'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface QuickLink {
  id: string
  title: string
  target: string
  enabled: boolean
}

interface NoticeItem {
  id: string
  title: string
  audience: '전체' | '홈 공지' | '마이페이지'
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
  link?: string
  body: string
}

interface InquiryItem {
  id: string
  user: string
  category: '비밀번호' | '결제' | '신고' | '기타'
  status: '대기' | '진행' | '완료'
  createdAt: string
}

const INITIAL_LINKS: QuickLink[] = [
  { id: 'link-notification', title: '알림 센터', target: '/notifications', enabled: true },
  { id: 'link-inquiry', title: '1:1 문의', target: '/support/inquiry', enabled: true },
  { id: 'link-faq', title: '공지사항', target: '/notice', enabled: true },
  { id: 'link-free', title: '무료 충전소', target: '/store/free', enabled: false },
]

const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'notice-101',
    title: '신규 빠른 필터 출시',
    audience: '홈 공지',
    status: 'PUBLISHED',
    link: 'https://tokfriends.app/guide/filter',
    body: '홈 화면 2×4 빠른 필터가 업데이트되었습니다.',
  },
  {
    id: 'notice-102',
    title: '비밀번호 찾기 임시 안내',
    audience: '마이페이지',
    status: 'SCHEDULED',
    body: '고객센터를 통해 비밀번호 재설정을 요청해주세요.',
  },
]

const INITIAL_INQUIRIES: InquiryItem[] = [
  { id: 'Q-5001', user: 'hana@example.com', category: '비밀번호', status: '대기', createdAt: '2024-03-13 21:44' },
  { id: 'Q-5002', user: 'jay@example.com', category: '결제', status: '진행', createdAt: '2024-03-14 09:12' },
  { id: 'Q-5003', user: 'minsu@example.com', category: '신고', status: '완료', createdAt: '2024-03-14 08:22' },
]

export default function SupportPage() {
  const { toast } = useToast()
  const [links, setLinks] = useState(INITIAL_LINKS)
  const [notices, setNotices] = useState(INITIAL_NOTICES)
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(INITIAL_NOTICES[0]?.id ?? null)
  const [inquiries, setInquiries] = useState(INITIAL_INQUIRIES)
  const [newNotice, setNewNotice] = useState({ title: '', audience: '전체' as NoticeItem['audience'], body: '', link: '' })

  const selectedNotice = useMemo(() => notices.find((notice) => notice.id === selectedNoticeId) ?? null, [notices, selectedNoticeId])

  const toggleLink = (id: string) => {
    setLinks((prev) => prev.map((link) => (link.id === id ? { ...link, enabled: !link.enabled } : link)))
  }

  const addNotice = () => {
    if (!newNotice.title.trim()) return
    const id = `notice-${Math.floor(Math.random() * 900 + 100)}`
    const notice: NoticeItem = {
      id,
      title: newNotice.title,
      audience: newNotice.audience,
      status: 'DRAFT',
      body: newNotice.body,
      link: newNotice.link || undefined,
    }
    setNotices((prev) => [notice, ...prev])
    setSelectedNoticeId(id)
    setNewNotice({ title: '', audience: '전체', body: '', link: '' })
    toast({ title: '공지 초안 생성', description: `${notice.title} 공지가 생성되었습니다.` })
  }

  const updateNotice = (payload: Partial<NoticeItem>) => {
    if (!selectedNotice) return
    setNotices((prev) => prev.map((notice) => (notice.id === selectedNotice.id ? { ...notice, ...payload } : notice)))
    toast({ title: '공지 저장', description: '변경 사항이 저장되었습니다.' })
  }

  const updateInquiryStatus = (id: string, status: InquiryItem['status']) => {
    setInquiries((prev) => prev.map((inquiry) => (inquiry.id === id ? { ...inquiry, status } : inquiry)))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>마이페이지 바로가기 관리</CardTitle>
            <p className="text-sm text-muted-foreground">
              알림 센터, 1:1 문의, 공지, 무료 충전소 등 진입점을 실제 서비스 도구와 연결하고 활성/비활성을 제어합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {links.map((link) => (
              <div key={link.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{link.title}</p>
                    <p className="text-xs text-muted-foreground">{link.target}</p>
                  </div>
                  <Switch checked={link.enabled} onCheckedChange={() => toggleLink(link.id)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>공지 등록</CardTitle>
            <p className="text-sm text-muted-foreground">
              홈 공지 카드와 마이페이지 공지 메뉴에 노출될 콘텐츠를 등록합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input value={newNotice.title} onChange={(event) => setNewNotice((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>대상</Label>
              <Select value={newNotice.audience} onValueChange={(value: NoticeItem['audience']) => setNewNotice((prev) => ({ ...prev, audience: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  <SelectItem value="홈 공지">홈 공지</SelectItem>
                  <SelectItem value="마이페이지">마이페이지</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>본문</Label>
              <Textarea value={newNotice.body} onChange={(event) => setNewNotice((prev) => ({ ...prev, body: event.target.value }))} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>연결 링크 (선택)</Label>
              <Input value={newNotice.link} onChange={(event) => setNewNotice((prev) => ({ ...prev, link: event.target.value }))} placeholder="https://" />
            </div>
            <Button size="sm" onClick={addNotice}>
              공지 초안 추가
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>1:1 문의</CardTitle>
            <p className="text-sm text-muted-foreground">
              미구현 지원 기능(비밀번호 찾기 등)에 대한 운영 프로세스를 마련하고 상태를 관리합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{inquiry.user}</span>
                  <span className="text-xs text-muted-foreground">{inquiry.createdAt}</span>
                </div>
                <p className="text-xs text-muted-foreground">카테고리: {inquiry.category}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['대기', '진행', '완료'] as InquiryItem['status'][]).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={inquiry.status === status ? 'default' : 'outline'}
                      onClick={() => updateInquiryStatus(inquiry.id, status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>공지 편집</CardTitle>
            <p className="text-sm text-muted-foreground">
              작성된 공지를 편집하고 상태를 변경하며 딥링크 경로를 안내합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="max-h-[260px] overflow-y-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">제목</th>
                    <th className="px-3 py-2 font-medium">대상</th>
                    <th className="px-3 py-2 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((notice) => (
                    <tr
                      key={notice.id}
                      className={`cursor-pointer border-t transition hover:bg-accent/40 ${selectedNotice?.id === notice.id ? 'bg-accent/50' : ''}`}
                      onClick={() => setSelectedNoticeId(notice.id)}
                    >
                      <td className="px-3 py-2 font-semibold">{notice.title}</td>
                      <td className="px-3 py-2">{notice.audience}</td>
                      <td className="px-3 py-2">{notice.status}</td>
                    </tr>
                  ))}
                  {notices.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                        등록된 공지가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedNotice ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>제목</Label>
                  <Input value={selectedNotice.title} onChange={(event) => updateNotice({ title: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>본문</Label>
                  <Textarea value={selectedNotice.body} onChange={(event) => updateNotice({ body: event.target.value })} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>링크</Label>
                  <Input value={selectedNotice.link ?? ''} onChange={(event) => updateNotice({ link: event.target.value })} placeholder="https://" />
                </div>
                <div className="space-y-2">
                  <Label>상태</Label>
                  <Select value={selectedNotice.status} onValueChange={(value: NoticeItem['status']) => updateNotice({ status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">DRAFT</SelectItem>
                      <SelectItem value="SCHEDULED">SCHEDULED</SelectItem>
                      <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => toast({ title: '배포 예약', description: '공지 게시가 예약되었습니다.' })}>
                    배포 예약
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast({ title: '딥링크 복사', description: '지원팀에 링크를 전달하세요.' })}>
                    딥링크 복사
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">좌측에서 편집할 공지를 선택하세요.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>지원 절차 체크리스트</CardTitle>
            <p className="text-sm text-muted-foreground">
              비밀번호 찾기 등 미구현 기능을 임시 대응하고, 고객 문의 시 정확한 진입점을 안내합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" /> 비밀번호 찾기 매뉴얼 업데이트
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" /> 딥링크 경로 점검
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" /> 알림 센터 템플릿 검수
            </label>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
