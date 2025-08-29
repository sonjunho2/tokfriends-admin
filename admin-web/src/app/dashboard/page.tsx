'use client'

import { useEffect, useState } from 'react'
import { getDashboardMetrics, api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Metrics = {
  users: { total: number; active: number; suspended: number }
  reports: { total: number; pending: number }
  bannedWords: number
  activeAnnouncements: number
  newUsers: { day: number; week: number; month: number }
}

type ReportItem = {
  id: string
  status: string
  reason?: string | null
  createdAt: string
  reporter?: { id: string; email?: string; displayName?: string } | null
  reported?: { id: string; email?: string; displayName?: string } | null
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [recent, setRecent] = useState<ReportItem[]>([])
  const [recentError, setRecentError] = useState<string | null>(null)

  useEffect(() => {
    // 메트릭스(공개)
    getDashboardMetrics()
      .then(setMetrics)
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('[dashboard] metrics failed', e)
      })

    // ✅ 최근 신고(보호 API) - axios 인스턴스로 호출해야 토큰이 붙음
    api
      .get('/admin/reports/recent', { params: { limit: 20 } })
      .then((r) => {
        const data = r.data?.items || r.data?.data || []
        setRecent(Array.isArray(data) ? data : [])
        setRecentError(null)
      })
      .catch((e) => {
        const status = e?.response?.status
        setRecentError(`최근 신고를 불러오지 못했어. (HTTP ${status ?? 'ERR'})`)
        // eslint-disable-next-line no-console
        console.error('[dashboard] recent reports failed', e)
      })
  }, [])

  return (
    <div className="grid gap-6">
      {/* 상단 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>전체 사용자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.users.total ?? 0}</div>
            <div className="text-sm text-muted-foreground">
              활성: {metrics?.users.active ?? 0} / 정지: {metrics?.users.suspended ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>대기 중인 신고</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.reports.pending ?? 0}</div>
            <div className="text-sm text-muted-foreground">전체 신고: {metrics?.reports.total ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>금칙어</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.bannedWords ?? 0}</div>
            <div className="text-sm text-muted-foreground">등록된 금칙어 수</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>활성 공지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.activeAnnouncements ?? 0}</div>
            <div className="text-sm text-muted-foreground">현재 표시 중</div>
          </CardContent>
        </Card>
      </div>

      {/* 신규 가입 현황 (간단 표시) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>신규 가입 현황</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            일간: <b>{metrics?.newUsers.day ?? 0}</b> / 주간: <b>{metrics?.newUsers.week ?? 0}</b> / 월간:{' '}
            <b>{metrics?.newUsers.month ?? 0}</b>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 신고</CardTitle>
          </CardHeader>
          <CardContent>
            {recentError ? (
              <div className="text-sm text-red-500">{recentError}</div>
            ) : recent.length === 0 ? (
              <div className="text-sm text-muted-foreground">최근 신고가 없어요.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {recent.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex justify-between border-b pb-1">
                    <span>
                      #{r.id.slice(0, 6)} · {r.status}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
