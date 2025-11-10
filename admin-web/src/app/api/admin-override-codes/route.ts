import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const ENV_KEY = 'EXPO_PUBLIC_ADMIN_OVERRIDE_CODES'
const ENV_FILE_PATH = path.join(process.cwd(), '.env.local')

function normalizeCodes(input: unknown): string[] {
  if (!input) {
    return []
  }

  if (Array.isArray(input)) {
    return input.map((code) => String(code).trim()).filter((code) => code.length > 0)
  }

  return String(input)
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code.length > 0)
}

function validateCodes(codes: string[]): string | null {
  const invalid = codes.filter((code) => !/^\d{4,10}$/.test(code))
  if (invalid.length > 0) {
    return `4~10자리 숫자 코드만 입력할 수 있습니다: ${invalid.join(', ')}`
  }
  return null
}

function extractCodesFromEnv(content: string | null): string[] {
  if (!content) {
    const fallback = process.env[ENV_KEY]
    return fallback ? normalizeCodes(fallback) : []
  }

  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    if (line.startsWith(`${ENV_KEY}=`)) {
      const value = line.slice(ENV_KEY.length + 1)
      return normalizeCodes(value)
    }
  }

  const fallback = process.env[ENV_KEY]
  return fallback ? normalizeCodes(fallback) : []
}

async function readEnvFile(): Promise<string | null> {
  try {
    return await fs.readFile(ENV_FILE_PATH, 'utf8')
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

function ensureTrailingNewline(content: string): string {
  return content.endsWith('\n') ? content : `${content}\n`
}

function buildUpdatedEnv(existing: string | null, codes: string[]): string {
  const lines = existing ? existing.split(/\r?\n/) : []
  const filtered: string[] = []

  for (const line of lines) {
    if (!line) {
      if (filtered.length === 0) {
        continue
      }
      filtered.push(line)
      continue
    }

    if (line.startsWith(`${ENV_KEY}=`)) {
      continue
    }

    filtered.push(line)
  }

  while (filtered.length > 0 && filtered[filtered.length - 1] === '') {
    filtered.pop()
  }

  if (codes.length > 0) {
    if (filtered.length > 0) {
      filtered.push('')
    }
    filtered.push(`${ENV_KEY}=${codes.join(',')}`)
  }

  const joined = filtered.join('\n')
  return ensureTrailingNewline(joined)
}

export async function GET() {
  const content = await readEnvFile()
  const codes = extractCodesFromEnv(content)
  return NextResponse.json({ codes })
}

export async function PUT(request: Request) {
  const payload = await request.json().catch(() => ({}))
  const codes = normalizeCodes(payload.codes)

  const validationError = validateCodes(codes)
  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 })
  }

  const existing = await readEnvFile()
  const nextContent = buildUpdatedEnv(existing, codes)
  await fs.writeFile(ENV_FILE_PATH, nextContent, 'utf8')

  return NextResponse.json({ codes })
}
