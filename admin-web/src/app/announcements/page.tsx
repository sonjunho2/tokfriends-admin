'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

type Announcement = {
  id: string
  title: string
  body: string
  isActive: boolean
  createdAt?: string
  startsAt?: string
  endsAt?: string | null
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    void fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await api.get<Announcement[] | { items: Announcement[] }>('/admin/announcements')
      const list = Array.isArray(res.data) ? res.data : res.data.items ?? []
      setAnnouncements(list)
    } catch {
      toast({
        title: '오류',
        description: '공지사항 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      })
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      await api.post('/admin/announcements', {
        title,
        body,
        isActive,
        startsAt: new Date().toISOString(),
      })
      toast({ title: '성공', description: '공지사항이 추가되었습니다.' })
      setDialogOpen(false)
      setTitle('')
      setBody('')
      setIsActive(false)
      void fetchAnnouncements()
    } catch {
      toast({
        title: '오류',
        description: '공지사항 추가에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/announcements/${id}`, { isActive: !currentStatus })
      toast({ title: '성공', description: '공지사항 상태가 변경되었습니다.' })
      void fetchAnnouncements()
    } catch {
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/announcements/${id}`)
      toast({ title: '성공', description: '공지사항이 삭제되었습니다.' })
      void fetchAnnouncements()
    } catch {
      toast({
        title: '오류',
        description: '공지사항 삭제에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const columns = [
    { key: 'title', label: '제목' },
    { key: 'body', label: '내용' },
    {
      key: 'isActive',
      label: '활성',
      render: (a: Announcement) => (
        <Switch checked={a.isActive} onCheckedChange={() => handleToggle(a.id, a.isActive)} />
      ),
    },
    { key: 'createdAt', label: '생성일' },
    {
      key: 'actions',
      label: '액션',
      render: (a: Announcement) => (
        <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)}>
          삭제
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">공지사항 관리</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>공지사항 추가</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 공지사항</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="내용" value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
              <div className="flex items-center space-x-2">
                <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                <label htmlFor="active">즉시 활성화</label>
              </div>
              <Button onClick={handleAdd} className="w-full">
                추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={announcements} loading={loading} />
    </div>
  )
}
