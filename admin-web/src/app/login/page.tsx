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
      toast({ title: '입력 오류', description: '이메일과 비밀번호를 입력해주세요.', variant: 'destructive' })
      return
    }

    setIsLoading(true)

    try {
      let result: any = null
      let lastError: any = null

      // 1차: /auth/login/email
      try {
        const res = await api.post('/auth/login/email', data)
        result = res.data
      } catch (e) {
        lastError = e
      }

      // 2차: /auth/login
      if (!result?.token && !result?.access_token) {
        try {
          const res = await api.post('/auth/login', data)
          result = res.data
        } catch (e) {
          lastError = e
        }
      }

      if (result?.token || result?.access_token) {
        saveLoginResult(result)
        toast({ title: '로그인 성공', description: '관리자 대시보드로 이동합니다.' })
        router.push('/dashboard')
        return
      }

      // 둘 다 실패 시
      throw lastError || new Error('로그인 실패')
    } catch (err: any) {
      console.error('로그인 에러:', {
        url: err?.config?.baseURL + err?.config?.url,
        status: err?.response?.status,
        data: err?.response?.data,
      })

      let msg = '로그인에 실패했습니다.'
      if (err?.response?.data?.message) {
        const serverMsg = err.response.data.message
        msg = Array.isArray(serverMsg) ? serverMsg.join(', ') : String(serverMsg)
      } else if (err?.message) {
        msg = err.message
      }

      toast({ title: '로그인 실패', description: msg, variant: 'destructive' })
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
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" placeholder="admin@example.com" autoComplete="username" disabled={isLoading} />
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
