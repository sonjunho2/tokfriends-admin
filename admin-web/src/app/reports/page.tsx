'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
  }, [page, statusFilter])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const response = await api.get('/reports', {
        params: { page, limit: 10, status: statusFilter || undefined }
      })
      setReports(response.data.data)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      toast({
        title: '오류',
        description: '신고 목록을 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (reportId: string, status: string) => {
    try {
      await api.patch(`/reports/${reportId}/status`, { status })
      toast({
        title: '성공',
        description: '신고 상태가 변경되었습니다.',
      })
      fetchReports()
    } catch (error) {
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다.',
        variant: 'destructive'
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
      render: (report: any) => (
        <div className="flex gap-2">
          {report.status === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => handleStatusChange(report.id, 'RESOLVED')}
              >
                처리완료
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleStatusChange(report.id, 'REJECTED')}
              >
                반려
              </Button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">신고 관리</h1>
      
      <div className="flex gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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

      <DataTable
        columns={columns}
        data={reports}
        loading={loading}
      />

      <div className="flex justify-center gap-2 mt-4">
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          이전
        </Button>
        <span className="flex items-center px-4">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage(p => p + 1)}
          disabled={page >= totalPages}
        >
          다음
        </Button>
      </div>
    </div>
  )
}