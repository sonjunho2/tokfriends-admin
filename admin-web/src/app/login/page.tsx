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
      email: 'admin@example.com',
      password: 'Admin123!',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    
    try {
      console.log('로그인 시도:', data.email) // 디버깅용
      
      const res = await api.post('/auth/login/email', data)
      
      console.log('서버 응답:', res.data) // 디버깅용
      
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
      console.error('로그인 에러:', err) // 디버깅용
      
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
                placeholder="admin@example.com"
                autoComplete="username"
                {...register('email')}
                disabled={isLoading}
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
                disabled={isLoading}
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
              기본 관리자 계정: admin@example.com / Admin123!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
