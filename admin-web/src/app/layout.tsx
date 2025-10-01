'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { getAccessToken, logoutToLogin } from '@/lib/api'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const PUBLIC_PATHS = ['/login']

const NAV_ITEMS = [
  { label: '개요', href: '/dashboard' },
  { label: '온보딩·계정', href: '/onboarding' },
  { label: '채팅·커뮤니티', href: '/chat-ops' },
  { label: '탐색·추천', href: '/content' },
  { label: '상점·포인트', href: '/store' },
  { label: '고객지원·공지', href: '/support' },
  { label: '시스템 모니터링', href: '/system' },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => logoutToLogin()

    const activeKey = useMemo(() => {
    if (!pathname) return '/dashboard'
    const found = NAV_ITEMS.find((item) => pathname.startsWith(item.href))
    return found?.href ?? '/dashboard'
  }, [pathname])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          <div className="mr-4 hidden md:flex">
            <h1 className="font-semibold">TokFriends 관리자 콘솔</h1>
          </div>
          <nav className="flex flex-1 flex-wrap items-center gap-2 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                onClick={() => router.push(item.href)}
                className={
                  activeKey === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }
              >
                {item.label}
              </Button>
            ))}
          </nav>
          <div className="ml-auto flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </div>
      </header>

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
           <div className="flex min-h-screen items-center justify-center">
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
          <div className="flex min-h-screen items-center justify-center">
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
