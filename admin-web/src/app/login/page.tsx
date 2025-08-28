'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { api, saveLoginResult } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [health, setHealth] = useState<'ok' | 'bad' | 'idle'>('idle')

  // 진입 시 헬스체크(가시화)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get('/health', { timeout: 5000 })
        if (!mounted) return
        setHealth(res?.data?.ok === true || res.status === 200 ? 'ok' : 'bad')
      } catch {
        if (!mounted) return
        setHealth('bad')
      }
    })()
    return () => { mounted = false }
  }, [])

  async function tryLogin(endpoint: string, data: any, timeoutMs: number) {
    // 개별 시도: 지정 타임아웃으로 빠르게 실패시켜 다음 경로로 넘어감
    return api.post(endpoint, data, { timeout: timeoutMs })
  }

  const handleLoginClick = async () => {
    const emailInput = document.getElementById('email') as HTMLInputElement | null
    const passwordInput = document.getElementById('password') as HTMLInputElement | null

    const data = {
      email: emailInput?.value?.trim() || '',
      password: passwordInput?.value || '',
    }

    if (!data.email || !data.password) {
      toast({ title: '입력 오류', description: '이메일과 비밀번호를 입력해주세요.', variant: 'destructive' })
      return
    }

    setIsLoading(true)

    try {
      let result: any | null = null
      let lastErr: any = null

      // 1차: /auth/login/email (짧게 3초)
      try {
        const r1 = await tryLogin('/auth/login/email', data, 3000)
        result = r1?.data
      } catch (e) {
        lastErr = e
        // eslint-disable-next-line no-console
        console.warn('[login] /auth/login/email failed or timed out', {
          url: e?.config?.baseURL + e?.config?.url,
          status: e?.response?.status,
          data: e?.response?.data,
          message: e?.message,
        })
      }

      // 2차: /auth/login (조금 넉넉히 5초)
      if (!(result?.token || result?.access_token)) {
        try {
          const r2 = await tryLogin('/auth/login', data, 5000)
          result = r2?.data
        } catch (e) {
          lastErr = e
          // eslint-disable-next-line no-console
          console.warn('[login] /auth/login failed or timed out', {
            url: e?.config?.baseURL + e?.config?.url,
            status: e?.response?.status,
            data: e?.response?.data,
            message: e?.message,
          })
        }
      }

      if (result?.token || result?.access_token) {
        saveLoginResult(result)
        toast({ title: '로그인 성공', description: '관리자 대시보드로 이동합니다.' })
        router.push('/dashboard')
        return
      }

      throw lastErr || new Error('로그인 실패')
    } catch (err: any) {
      // 네트워크 진단 로그
      // eslint-disable-next-line no-console
      console.error('[Login Error]', {
        url: err?.config?.baseURL + err?.config?.url,
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      })

      const serverMsg = err?.response?.data?.message
      const msg = Array.isArray(serverMsg) ? serverMsg.join(', ') : (serverMsg || err?.message || '로그인에 실패했습니다.')
      toast({ title: '로그인 실패', description: String(msg), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>딱친 관리자 로그인</CardTitle>
          <CardDescription>
            관리자 계정으로 로그인하세요
            {health === 'ok' && <span className="ml-2 text-green-600 text-xs">(서버 연결 OK)</span>}
            {health === 'bad' && <span className="ml-2 text-red-600 text-xs">(서버 연결 불안정)</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" autoComplete="username" disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input id="password" type="password" autoComplete="current-password" disabled={isLoading} />
            </div>
            <Button type="button" onClick={handleLoginClick} className="w-full" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
