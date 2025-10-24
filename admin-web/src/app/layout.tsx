'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { AppShell, type AppShellNavItem } from '@/components/layout/app-shell'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { getAccessToken } from '@/lib/api'

import './globals.css'

const PUBLIC_PATHS = ['/login']

const NAV_ITEMS: AppShellNavItem[] = [
  { label: '대시보드', href: '/dashboard', description: '핵심 KPI와 라이브 시스템 상태' },
  { label: '사용자', href: '/users', description: '가입/인증 상태, 제재 및 지원 이력' },
  { label: '매칭 & 탐색', href: '/matches', description: '매칭 큐와 추천 파이프라인 제어', badge: 'Beta' },
  { label: '채팅 & 안전', href: '/chats', description: '실시간 채팅 모니터링과 신고 처리' },
  { label: '콘텐츠 & 참여', href: '/content', description: '공지, 캠페인, FAQ 워크플로우 운영' },
  { label: '분석 & 리포트', href: '/analytics', description: '코호트 분석과 데이터 익스포트' },
  { label: '설정', href: '/settings', description: '팀 권한, 기능 플래그, 통합 설정' },
  { label: '상점', href: '/store', description: '포인트 상품, 구독 및 결제 설정' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const token = getAccessToken()
    const currentPath = pathname ?? '/'

    if (PUBLIC_PATHS.includes(currentPath)) {
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
        <body className="font-sans">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-sm text-muted-foreground">콘솔을 준비하고 있습니다…</div>
          </div>
        </body>
      </html>
    )
  }

  const currentPath = pathname ?? '/'
  const isPublicPage = PUBLIC_PATHS.includes(currentPath)

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {isPublicPage ? children : <AppShell items={NAV_ITEMS}>{children}</AppShell>}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
