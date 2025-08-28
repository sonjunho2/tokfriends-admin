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

  // 선택: 첫 진입 시 백엔드 헬스체크
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await api.get('/health', { timeout: 5000 })
        if (!mounted) return
        if (res?.data && (res.data.ok === true || res.status === 200)) {
          setHealth('ok')
        } else {
          setHealth('bad')
        }
      } catch {
        if (!mounted) return
        setHealth('bad')
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleLoginClick = async () => {
    const emailInput = document.getElementById('email') as HTMLInputElement | null
    const passwordInput = document.getElementById('password') as HTMLInputElement | null

    const data = {
      email: emailInput?.value?.trim() || '',
      password: passwordInput?.value || '',
    }

    if (!data.email || !data.password) {
      toast({
        title: '입력 오류',
        description: '이메일과 비밀번호를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      // 1차: /auth/login/email
      let res = await api.post('/auth/login/email', data)
      let result = res?.data

      // 서버가 다른 엔드포인트를 쓸 수 있으니 2차 시도
      if (!(result?.token || result?.access_token)) {
        try {
          res = await api.post('/auth/login', data)
          result = res?.data
        } catch (e) {
          // 두 경로 모두 실패 → 아래 공통 에러 처리로
          throw e
        }
      }

      if (result?.token || result?.access_token) {
        saveLoginResult(result)
        toast({
          title: '로그인 성공',
          description: '관리자 대시보드로 이동합니다.',
        })
        router.push('/dashboard')
        return
      }

      throw new Error('서버 응답에 토큰이 없습니다.')
    } catch (err: any) {
      // 에러 메시지 조합
      const serverMsg = err?.response?.data?.message
      const msg = Array.isArray(serverMsg)
        ? serverMsg.join(', ')
        : (serverMsg || err?.message || '로그인에 실패했습니다.')

      toast({
        title: '로그인 실패',
        description: String(msg),
        variant: 'destructive',
      })
      // 네트워크/도메인 오설정 진단 보조: 콘솔 로그
      // eslint-disable-next-line no-console
      console.error('[Login Error]', {
        url: err?.config?.baseURL + err?.config?.url,
        status: err?.response?.status,
        data: err?.response?.data,
      })
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
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="username"
                defaultValue="admin@example.com"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                defaultValue="Admin123!"
                disabled={isLoading}
              />
            </div>

            <Button
              type="button"
              onClick={handleLoginClick}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-600">
              기본 관리자 계정: admin@example.com / Admin123!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
