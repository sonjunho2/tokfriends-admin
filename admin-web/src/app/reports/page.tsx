'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

type ReportRow = {
  id: string
  category?: string
  detail?: string
  status?: 'PENDING' | 'RESOLVED' | 'REJECTED'
  createdAt?: string
}

type Paginated<T> =
  | { data: T[]; totalPages?: number; total?: number; pageSize?: number }
  | { items: T[]; totalPages?: number; total?: number; pageSize?: number }
  | T[]

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('') // 빈 문자열 허용
  const { toast } = useToast()

  useEffect(() => {
    void fetchReports()
  }, [page, statusFilter])

  function extract(list: Paginated<ReportRow>, limit: number) {
    if (Array.isArray(list)) return { rows: list, pages: 1 }
    const rows = Array.isArray((list as any).data) ? (list as any).data : (list as any).items ?? []
    const total = (list as any).total
    const pageSize = (list as any).pageSize ?? limit
    const pages = (list as any).totalPages ?? (total && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1)
    return { rows, pages }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const limit = 10
      const res = await api.get<Paginated<ReportRow>>('/admin/reports', {
        params: { page, limit, status: statusFilter || undefined },
      })
      const { rows, pages } = extract(res.data, limit)
      setReports(rows)
      setTotalPages(pages)
    } catch {
      toast({
        title: '오류',
        description: '신고 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      })
      setReports([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (reportId: string, status: 'RESOLVED' | 'REJECTED') => {
    try {
      await api.patch(`/admin/reports/${reportId}/status`, { status })
      toast({ title: '성공', description: '신고 상태가 변경되었습니다.' })
      void fetchReports()
    } catch {
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'category', label: '카테고리' },
    { key: 'detail', label: '상세내용' },
    { key: 'status', label: '상태' },
    { key: 'createdAt', label: '신고일' },
    {
      key: 'actions',
      label: '액션',
      render: (r: ReportRow) =>
        r.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={() => handleStatusChange(r.id, 'RESOLVED')}>
              처리완료
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleStatusChange(r.id, 'REJECTED')}>
              반려
            </Button>
          </div>
        ) : null,
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">신고 관리</h1>

      <div className="flex gap-4 mb-6">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체</SelectItem>
            <SelectItem value="PENDING">대기중</SelectItem>
            <SelectItem value="RESOLVED">처리완료</SelectItem>
            <SelectItem value="REJECTED">반려</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={reports} loading={loading} />

      <div className="flex justify-center gap-2 mt-4">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          이전
        </Button>
        <span className="flex items-center px-4">
          {page} / {totalPages}
        </span>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
          다음
        </Button>
      </div>
    </div>
  )
}
