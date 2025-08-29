'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Report = {
  id: number | string
  reason: string
  status: string
  createdAt: string
  reporter?: { id: string; email: string; displayName: string }
  reported?: { id: string; email: string; displayName: string }
}

const STATUS = ['ALL', 'PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'] as const

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<(typeof STATUS)[number]>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page])

  async function fetchReports() {
    setLoading(true)
    try {
      const params: any = { page, limit: 20 }
      if (status !== 'ALL') params.status = status
      const res = await api.get('/admin/reports', { params })
      const rows = res.data?.data || res.data?.items || []
      setReports(rows)
      setTotalPages(res.data?.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">신고 관리</h1>
      <div className="flex gap-3 mb-6">
        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            {STATUS.map((s) => (
              <SelectItem key={s} value={s}>{s === 'ALL' ? '전체' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 원하는 테이블 컴포넌트로 교체 */}
      <div className="space-y-2">
        {reports.map((r) => (
          <div key={String(r.id)} className="border rounded p-3">
            <div className="text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</div>
            <div className="font-medium">{r.reason} ({r.status})</div>
            <div className="text-sm">신고자: {r.reporter?.email} / 피신고자: {r.reported?.email}</div>
          </div>
        ))}
        {!loading && reports.length === 0 && <div>신고가 없습니다.</div>}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>이전</Button>
        <span className="flex items-center px-4">{page} / {totalPages}</span>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>다음</Button>
      </div>
    </div>
  )
}
