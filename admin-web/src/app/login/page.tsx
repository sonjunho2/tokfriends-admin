'use client'

import { useState } from 'react'
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
      console.log('로그인 시도:', data.email)

      const res = await api.post('/auth/login/email', data)

      console.log('서버 응답:', res.data)

      const result = res.data

      if (result.token || result.access_token) {
        saveLoginResult(result)

        toast({
          title: '로그인 성공',
          description: '관리자 대시보드로 이동합니다.',
        })

        router.push('/dashboard')
      } else {
        throw new Error('서버 응답에 토큰이 없습니다.')
      }
    } catch (err: any) {
      console.error('로그인 에러:', err)

      let msg = '로그인에 실패했습니다.'
      if (err?.response?.data?.message) {
        const serverMsg = err.response.data.message
        msg = Array.isArray(serverMsg) ? serverMsg.join(', ') : String(serverMsg)
      } else if (err?.message) {
        msg = err.message
      }

      toast({
        title: '로그인 실패',
        description: msg,
        variant: 'destructive',
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
          <CardDescription>관리자 계정으로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 폼 제출 막고 버튼 클릭으로만 처리 */}
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

            {/* 버튼 타입을 button 으로 변경하고 onClick 사용 */}
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
