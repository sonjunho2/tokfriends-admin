'use client'

import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Search, Sparkles, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { logoutToLogin } from '@/lib/api'

export interface AppShellNavItem {
  label: string
  href: string
  description: string
  badge?: string
}

interface AppShellProps {
  items: AppShellNavItem[]
  children: React.ReactNode
}

export function AppShell({ items, children }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()

  const activeItem = useMemo(() => {
    if (!pathname) return items[0]
    const found = items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    return found ?? items[0]
  }, [items, pathname])

  const handleLogout = () => {
    logoutToLogin()
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="flex min-h-screen">
        <aside className="hidden border-r bg-background px-4 py-6 md:flex md:w-72 md:flex-col">
          <div className="mb-6 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TokFriends Admin</span>
            <h1 className="text-lg font-semibold">운영 콘솔</h1>
            <p className="text-xs text-muted-foreground">커뮤니티 안전과 성과 지표를 한눈에 파악하세요.</p>
          </div>

          <div className="mb-6">
            <label className="sr-only" htmlFor="global-search">
              글로벌 검색
            </label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="global-search"
                placeholder="사용자, 신고, 캠페인 검색"
                className="pl-8 text-sm"
                autoComplete="off"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">⌘K 로 전역 검색이 곧 제공될 예정입니다.</p>
          </div>

          <nav className="flex-1 space-y-2">
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-left transition',
                    isActive
                      ? 'border-primary/70 bg-primary/10 text-primary'
                      : 'border-transparent hover:border-border hover:bg-muted/70'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold leading-tight">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 text-primary" />}
                  </div>
                  {item.badge && (
                    <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-6 space-y-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">실시간 운영 상태</p>
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="flex items-center justify-between text-xs font-medium text-foreground">
                <span>사고 대응</span>
                <span className="text-emerald-600">안정</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Slack #ops-alert 에 동기화됨</p>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
            <div className="flex h-14 items-center justify-between gap-4 px-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">현재 모듈</p>
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-base font-semibold">{activeItem?.label ?? '대시보드'}</h2>
                  {activeItem?.badge && (
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {activeItem.badge}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{activeItem?.description}</p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex"
                  onClick={() => router.push('/analytics')}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  실시간 지표
                </Button>
                <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>
                  설정 바로가기
                </Button>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

export default AppShell
