//admin-web/src/app/login/page.tsx
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
import { api, saveLoginResult } from '@/lib/api'

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
      email: 'admin@local',        // 백엔드 seed 파일과 일치
      password: 'Admin123!',       // 백엔드 seed 파일과 일치
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      // 백엔드 실제 경로에 맞춤: /auth/login/email
      const res = await api.post('/auth/login/email', data)

      // 백엔드 응답 형태 대응 (token 키 사용)
      const result = {
        token: res?.data?.token,
        user: res?.data?.user,
      }

      if (result.token) {
        // api.ts의 saveLoginResult 함수 사용
        saveLoginResult(result)
        
        toast({
          title: '로그인 성공',
          description: '관리자 대시보드로 이동합니다.',
        })

        router.push('/dashboard')
      } else {
        throw new Error('로그인 응답에 토큰이 없습니다.')
      }
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>등친 관리자 로그인</CardTitle>
          <CardDescription>관리자 계정으로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@local"
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
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-600">
              기본 관리자 계정: admin@local / Admin123!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
