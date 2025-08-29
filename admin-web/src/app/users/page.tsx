'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

type UserRow = {
  id: string
  email?: string
  nickname?: string
  status?: 'ACTIVE' | 'SUSPENDED'
  createdAt?: string
}

type Paginated<T> =
  | { data: T[]; totalPages?: number; total?: number; pageSize?: number }
  | { items: T[]; totalPages?: number; total?: number; pageSize?: number }
  | T[]

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    void fetchUsers()
  }, [page])

  function extract(list: Paginated<UserRow>, limit: number) {
    if (Array.isArray(list)) {
      return { rows: list, pages: 1 }
    }
    const rows = Array.isArray((list as any).data) ? (list as any).data : (list as any).items ?? []
    const total = (list as any).total
    const pageSize = (list as any).pageSize ?? limit
    const pages = (list as any).totalPages ?? (total && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1)
    return { rows, pages }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const limit = 10
      const res = await api.get<Paginated<UserRow>>('/admin/users', {
        params: { page, limit, search: search || undefined },
      })
      const { rows, pages } = extract(res.data, limit)
      setUsers(rows)
      setTotalPages(pages)
    } catch {
      toast({
        title: '오류',
        description: '사용자 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      })
      setUsers([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    void fetchUsers()
  }

  const handleStatusChange = async (userId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status })
      toast({ title: '성공', description: '사용자 상태가 변경되었습니다.' })
      void fetchUsers()
    } catch {
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다.',
        variant: 'destructive',
      })
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
      render: (user: UserRow) => (
        <div className="flex gap-2">
          {user.status === 'ACTIVE' ? (
            <Button size="sm" variant="destructive" onClick={() => handleStatusChange(user.id, 'SUSPENDED')}>
              정지
            </Button>
          ) : (
            <Button size="sm" variant="default" onClick={() => handleStatusChange(user.id, 'ACTIVE')}>
              활성화
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">사용자 관리</h1>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="이메일 또는 닉네임 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleSearch}>검색</Button>
      </div>

      <DataTable columns={columns} data={users} loading={loading} />

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
