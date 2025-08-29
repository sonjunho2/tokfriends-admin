'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { getAccessToken, logoutToLogin } from '@/lib/api'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const PUBLIC_PATHS = ['/login']

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => logoutToLogin()

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            {/* ✅ 표기 수정: 딱친 관리자 */}
            <h1 className="font-semibold">딱친 관리자</h1>
          </div>
          {/* ✅ 라우팅 연결 */}
          <nav className="flex items-center space-x-4 text-sm font-medium">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className={pathname === '/dashboard' ? 'bg-accent' : ''}
            >
              대시보드
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/users')}
              className={pathname === '/users' ? 'bg-accent' : ''}
            >
              사용자
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/reports')}
              className={pathname === '/reports' ? 'bg-accent' : ''}
            >
              신고
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/announcements')}
              className={pathname === '/announcements' ? 'bg-accent' : ''}
            >
              공지
            </Button>
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto py-6">{children}</main>
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const token = getAccessToken()

    if (PUBLIC_PATHS.includes(pathname)) {
      setIsAuthenticated(true)
      return
    }

    if (token) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
      router.push('/login')
    }
  }, [pathname, router])

  if (isAuthenticated === null) {
    return (
      <html lang="ko" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">로딩 중...</div>
          </div>
        </body>
      </html>
    )
  }

  if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <html lang="ko" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">인증이 필요합니다.</div>
          </div>
        </body>
      </html>
    )
  }

  const isPublicPage = PUBLIC_PATHS.includes(pathname)

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {isPublicPage ? children : <DashboardLayout>{children}</DashboardLayout>}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
