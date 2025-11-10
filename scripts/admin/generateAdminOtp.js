'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_KEY = 'EXPO_PUBLIC_ADMIN_OVERRIDE_CODES';
const DEFAULT_CODE_LENGTH = 6;
const DEFAULT_ENV_PATH = '.env.local';

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function askWithDefault(rl, question, defaultValue) {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  return ask(rl, `${question}${suffix ? suffix : ''}: `).then((value) => {
    if (!value && defaultValue !== undefined) {
      return defaultValue;
    }
    return value;
  });
}

function normalizeCodes(input) {
  return input
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);
}

function validateCodes(codes) {
  if (!Array.isArray(codes) || codes.length === 0) {
    return '최소 한 개 이상의 인증번호를 입력해야 합니다.';
  }

  const invalid = codes.filter((code) => !/^\d{4,10}$/.test(code));
  if (invalid.length > 0) {
    return `다음 인증번호는 4~10자리 숫자여야 합니다: ${invalid.join(', ')}`;
  }

  return null;
}

function generateRandomCode(length) {
  const max = 10 ** length;
  return crypto.randomInt(0, max).toString().padStart(length, '0');
}

function ensureTrailingNewline(content) {
  return content.endsWith('\n') ? content : `${content}\n`;
}

function updateEnvFile(envPath, line) {
  let existing = '';
  if (fs.existsSync(envPath)) {
    existing = fs.readFileSync(envPath, 'utf8');
  }

  const lines = existing.split(/\r?\n/);
  const filtered = [];

  for (const currentLine of lines) {
    if (!currentLine) {
      if (filtered.length === 0) {
        continue;
      }

      filtered.push(currentLine);
      continue;
    }

    if (currentLine.startsWith(`${ENV_KEY}=`)) {
      continue;
    }

    filtered.push(currentLine);
  }

  if (filtered.length > 0 && filtered[filtered.length - 1] !== '') {
    filtered.push('');
  }

  filtered.push(line);
  const content = filtered.join('\n');
  fs.writeFileSync(envPath, ensureTrailingNewline(content), 'utf8');
}

async function runGenerateAdminOtpFlow(externalInterface) {
  const rl = externalInterface ?? createInterface();
  const shouldClose = !externalInterface;

  try {
    console.log('\n관리자 인증번호 생성 도우미를 시작합니다.');
    const method = (await askWithDefault(rl, '인증번호를 직접 입력하시겠습니까? (y/N)', 'n')).toLowerCase();

    let codes = [];
    if (method === 'y' || method === 'yes') {
      const manualInput = await ask(rl, '등록할 인증번호를 입력하세요 (여러 개는 콤마로 구분): ');
      codes = normalizeCodes(manualInput);
    } else {
      const countInput = await askWithDefault(rl, '생성할 인증번호 개수를 입력하세요', '1');
      const count = Math.max(1, parseInt(countInput, 10) || 1);
      const lengthInput = await askWithDefault(rl, '인증번호 길이를 입력하세요', String(DEFAULT_CODE_LENGTH));
      const length = Math.min(10, Math.max(4, parseInt(lengthInput, 10) || DEFAULT_CODE_LENGTH));
      for (let i = 0; i < count; i += 1) {
        codes.push(generateRandomCode(length));
      }
    }

    const validationError = validateCodes(codes);
    if (validationError) {
      console.error(`\n${validationError}`);
      return;
    }

    console.log(`\n생성된 인증번호 (${codes.length}개): ${codes.join(', ')}`);
    const envPathInput = await askWithDefault(rl, '저장할 환경 변수 파일 경로를 입력하세요', DEFAULT_ENV_PATH);
    const envPath = path.resolve(process.cwd(), envPathInput);

    const line = `${ENV_KEY}=${codes.join(',')}`;
    updateEnvFile(envPath, line);

    console.log(`\n${envPathInput} 파일에 ${ENV_KEY} 값이 저장되었습니다.`);
    console.log('변경 사항이 적용되도록 Expo 앱을 재시작하거나 다시 빌드하세요.');
  } finally {
    if (shouldClose) {
      rl.close();
    }
  }
}

module.exports = {
  runGenerateAdminOtpFlow,
};

if (require.main === module) {
  runGenerateAdminOtpFlow().catch((error) => {
    console.error('관리자 인증번호 생성 중 오류가 발생했습니다.');
    console.error(error);
    process.exit(1);
  });
}
