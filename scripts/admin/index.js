#!/usr/bin/env node
'use strict';

const readline = require('readline');
const { runGenerateAdminOtpFlow } = require('./generateAdminOtp');

const MENU_ITEMS = [
  {
    key: '1',
    label: '관리자 인증번호 생성 및 환경 변수 저장',
    action: runGenerateAdminOtpFlow,
  },
  {
    key: 'q',
    label: '종료',
    action: null,
  },
];

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function main() {
  const rl = createInterface();

  try {
    while (true) {
      console.log('\n=== TOKFRIENDS 관리자 도구 ===');
      for (const item of MENU_ITEMS) {
        console.log(`[${item.key}] ${item.label}`);
      }

      const answer = await askQuestion(rl, '\n실행할 작업을 선택하세요: ');
      const menuItem = MENU_ITEMS.find((item) => item.key === answer.toLowerCase());

      if (!menuItem) {
        console.log('알 수 없는 선택입니다. 다시 시도해주세요.');
        continue;
      }

      if (menuItem.key === 'q') {
        console.log('관리자 도구를 종료합니다.');
        break;
      }

      try {
        await menuItem.action(rl);
      } catch (error) {
        console.error('\n작업 실행 중 오류가 발생했습니다:', error.message);
      }
    }
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
