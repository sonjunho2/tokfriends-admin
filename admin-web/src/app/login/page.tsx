'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api' // ⚠️ axios 인스턴스(아래 체크리스트 참고)

const loginSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@example.com',    // 권장 관리자 계정
      password: 'Admin123!',         // 초기 비번
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      // ✅ 백엔드 실제 경로에 맞춤: /auth/login/email
      const res = await api.post('/auth/login/email', data, { withCredentials: true })

      // 백엔드 응답 형태 대응 (token 또는 access_token)
      const token: string | undefined = res?.data?.token ?? res?.data?.access_token
      const user = res?.data?.user ?? null

      if (token) {
        localStorage.setItem('tokfriends_admin_token', token)
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      }

      // 초기 계정이면 비번 변경 유도 토스트
      if ((data.email === 'admin@local' || data.email === 'admin@example.com') && data.password === 'Admin123!') {
        toast({
          title: '비밀번호 변경 권장',
          description: '보안을 위해 관리자 비밀번호를 변경하세요.',
        })
      }

      router.push('/dashboard')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        '이메일 또는 비밀번호를 확인하세요.'
      toast({
        title: '로그인 실패',
        description: Array.isArray(msg) ? msg.join(', ') : String(msg),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>딱친 관리자 로그인</CardTitle>
          <CardDescription>관리자 계정으로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="username"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
