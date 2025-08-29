'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users', { params: { page, limit: 10, search } })
      const rows = res.data?.data || res.data?.items || []
      setUsers(rows)
      setTotalPages(res.data?.totalPages || 1)
    } catch (e) {
      toast({ title: '오류', description: '사용자 목록 조회 실패', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchUsers()
  }

  const handleStatusChange = async (userId: string, status: string) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status })
      toast({ title: '성공', description: '상태 변경됨' })
      fetchUsers()
    } catch {
      toast({ title: '오류', description: '상태 변경 실패', variant: 'destructive' })
    }
  }

  const columns = [
    { key: 'email', label: '이메일' },
    { key: 'nickname', label: '닉네임' },
    { key: 'status', label: '상태' },
    { key: 'createdAt', label: '가입일' },
    {
      key: 'actions',
      label: '액션',
      render: (user: any) => (
        <div className="flex gap-2">
          {user.status === 'ACTIVE' ? (
            <Button size="sm" variant="destructive" onClick={() => handleStatusChange(user.id, 'SUSPENDED')}>정지</Button>
          ) : (
            <Button size="sm" variant="default" onClick={() => handleStatusChange(user.id, 'ACTIVE')}>활성화</Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">사용자 관리</h1>
      <div className="flex gap-4 mb-6">
        <Input placeholder="이메일 또는 닉네임 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button onClick={handleSearch}>검색</Button>
      </div>
      <DataTable columns={columns} data={users} loading={loading} />
      <div className="flex justify-center gap-2 mt-4">
        <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>이전</Button>
        <span className="flex items-center px-4">{page} / {totalPages}</span>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>다음</Button>
      </div>
    </div>
  )
}
