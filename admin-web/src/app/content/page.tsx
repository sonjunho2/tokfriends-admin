'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface CampaignChannel {
  id: string
  title: string
  description: string
  audience: string
  enabled: boolean
}

interface CampaignDraft {
  name: string
  target: string
  schedule: string
  message: string
  deepLink: string
}

interface AnnouncementItem {
  id: string
  title: string
  audience: '전체' | '홈 배너' | '마이페이지'
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
  link?: string
  body: string
  scheduledAt?: string
}

interface EngagementTicket {
  id: string
  user: string
  category: 'FAQ' | '문의' | '버그 신고'
  status: '대기' | '진행' | '완료'
  createdAt: string
}

const INITIAL_CHANNELS: CampaignChannel[] = [
  {
    id: 'channel-push',
    title: '푸시 캠페인',
    description: 'FCM 푸시로 전체 또는 세그먼트 대상 알림 발송',
    audience: '세그먼트',
    enabled: true,
  },
  {
    id: 'channel-broadcast',
    title: '앱 내 브로드캐스트',
    description: '홈/탐색 상단 배너를 통한 공지',
    audience: '전체',
    enabled: true,
  },
  {
    id: 'channel-email',
    title: '이메일 뉴스레터',
    description: '고객지원 이슈 및 리텐션 메일링',
    audience: '휴면/위험',
    enabled: false,
  },
]

const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-101',
    title: '새로운 안전 정책 안내',
    audience: '전체',
    status: 'PUBLISHED',
    link: 'https://tokfriends.app/guide/policy',
    body: '커뮤니티 안전 정책이 업데이트되었습니다. 즉시 확인해주세요.',
  },
  {
    id: 'ann-102',
    title: '주말 한정 매칭 부스트',
    audience: '홈 배너',
    status: 'SCHEDULED',
    scheduledAt: '2024-03-16 10:00',
    body: '서울/경기 지역 사용자에게 매칭 부스트를 적용합니다.',
  },
]

const INITIAL_TICKETS: EngagementTicket[] = [
  { id: 'ENG-5001', user: 'hana@example.com', category: '문의', status: '대기', createdAt: '2024-03-13 21:44' },
  { id: 'ENG-5002', user: 'jay@example.com', category: 'FAQ', status: '진행', createdAt: '2024-03-14 09:12' },
  { id: 'ENG-5003', user: 'minsu@example.com', category: '버그 신고', status: '완료', createdAt: '2024-03-14 08:22' },
]

export default function ContentPage() {
  const { toast } = useToast()
  const [channels, setChannels] = useState(INITIAL_CHANNELS)
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS)
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(INITIAL_ANNOUNCEMENTS[0]?.id ?? null)
  const [tickets, setTickets] = useState(INITIAL_TICKETS)
  const [campaignDraft, setCampaignDraft] = useState<CampaignDraft>({
    name: '',
    target: '전체',
    schedule: '',
    message: '',
    deepLink: '',
  })
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    audience: '전체' as AnnouncementItem['audience'],
    body: '',
    link: '',
  })

  const selectedAnnouncement = useMemo(
    () => announcements.find((announcement) => announcement.id === selectedAnnouncementId) ?? null,
    [announcements, selectedAnnouncementId]
  )

  const toggleChannel = (id: string) => {
    setChannels((prev) => prev.map((channel) => (channel.id === id ? { ...channel, enabled: !channel.enabled } : channel)))
  }

  const submitCampaign = () => {
    if (!campaignDraft.name.trim() || !campaignDraft.message.trim()) {
      toast({ title: '입력 오류', description: '캠페인 이름과 메시지를 입력해주세요.', variant: 'destructive' })
      return
    }
    toast({
      title: '캠페인 예약',
      description: `${campaignDraft.target} 대상 캠페인이 예약되었습니다. (${campaignDraft.schedule || '즉시 발송'})`,
    })
    setCampaignDraft({ name: '', target: '전체', schedule: '', message: '', deepLink: '' })
  }

  const addAnnouncement = () => {
    if (!newAnnouncement.title.trim()) {
      toast({ title: '입력 오류', description: '공지 제목을 입력해주세요.', variant: 'destructive' })
      return
    }
    const id = `ann-${Date.now().toString().slice(-4)}`
    const announcement: AnnouncementItem = {
      id,
      title: newAnnouncement.title,
      audience: newAnnouncement.audience,
      status: 'DRAFT',
      body: newAnnouncement.body,
      link: newAnnouncement.link || undefined,
    }
    setAnnouncements((prev) => [announcement, ...prev])
    setSelectedAnnouncementId(id)
    setNewAnnouncement({ title: '', audience: '전체', body: '', link: '' })
    toast({ title: '공지 초안 생성', description: `${announcement.title} 공지가 생성되었습니다.` })
  }

  const updateAnnouncement = (payload: Partial<AnnouncementItem>) => {
    if (!selectedAnnouncement) return
    setAnnouncements((prev) => prev.map((announcement) => (announcement.id === selectedAnnouncement.id ? { ...announcement, ...payload } : announcement)))
    toast({ title: '공지 저장', description: '변경 사항이 저장되었습니다.' })
  }

  const updateTicketStatus = (id: string, status: EngagementTicket['status']) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === id ? { ...ticket, status } : ticket)))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>캠페인 채널 & 토글</CardTitle>
            <p className="text-sm text-muted-foreground">
              활성화된 채널만 자동 스케줄러가 사용합니다. 비활성화하면 즉시 전파가 중단됩니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {channels.map((channel) => (
              <div key={channel.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{channel.title}</p>
                    <p className="text-xs text-muted-foreground">{channel.description}</p>
                    <p className="text-xs text-muted-foreground">대상: {channel.audience}</p>
                  </div>
                  <Switch checked={channel.enabled} onCheckedChange={() => toggleChannel(channel.id)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>푸시/브로드캐스트 작성</CardTitle>
            <p className="text-sm text-muted-foreground">대상 세그먼트, 발송 시점, 메시지를 작성하고 예약합니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>캠페인 이름</Label>
                <Input value={campaignDraft.name} onChange={(event) => setCampaignDraft((prev) => ({ ...prev, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>타겟</Label>
                <Select value={campaignDraft.target} onValueChange={(value) => setCampaignDraft((prev) => ({ ...prev, target: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                    <SelectItem value="재방문">재방문</SelectItem>
                    <SelectItem value="휴면">휴면</SelectItem>
                    <SelectItem value="위험 사용자">위험 사용자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>발송 시점</Label>
                <Input
                  type="datetime-local"
                  value={campaignDraft.schedule}
                  onChange={(event) => setCampaignDraft((prev) => ({ ...prev, schedule: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>딥링크</Label>
                <Input
                  placeholder="tokfriends://path"
                  value={campaignDraft.deepLink}
                  onChange={(event) => setCampaignDraft((prev) => ({ ...prev, deepLink: event.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>메시지</Label>
                <Textarea
                  rows={4}
                  value={campaignDraft.message}
                  onChange={(event) => setCampaignDraft((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="캠페인 메시지를 작성하세요."
                />
              </div>
            </div>
            <Button size="sm" onClick={submitCampaign}>
              캠페인 예약
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>공지 & 배너 관리</CardTitle>
            <p className="text-sm text-muted-foreground">홈/마이페이지 공지를 작성하고 상태를 제어합니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>제목</Label>
                <Input value={newAnnouncement.title} onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, title: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>대상</Label>
                <Select value={newAnnouncement.audience} onValueChange={(value: AnnouncementItem['audience']) => setNewAnnouncement((prev) => ({ ...prev, audience: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                    <SelectItem value="홈 배너">홈 배너</SelectItem>
                    <SelectItem value="마이페이지">마이페이지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>본문</Label>
                <Textarea
                  value={newAnnouncement.body}
                  onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, body: event.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>링크 (선택)</Label>
                <Input value={newAnnouncement.link} onChange={(event) => setNewAnnouncement((prev) => ({ ...prev, link: event.target.value }))} />
              </div>
            </div>
            <Button size="sm" onClick={addAnnouncement}>
              공지 초안 추가
            </Button>

            <div className="max-h-[320px] overflow-y-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">제목</th>
                    <th className="px-3 py-2 font-medium">대상</th>
                    <th className="px-3 py-2 font-medium">상태</th>
                    <th className="px-3 py-2 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((announcement) => (
                    <tr key={announcement.id} className={`border-t ${announcement.id === selectedAnnouncementId ? 'bg-accent/40' : ''}`}>
                      <td className="px-3 py-2 font-semibold">{announcement.title}</td>
                      <td className="px-3 py-2">{announcement.audience}</td>
                      <td className="px-3 py-2 text-xs">
                        {announcement.status === 'PUBLISHED'
                          ? '발행'
                          : announcement.status === 'SCHEDULED'
                          ? `예약 (${announcement.scheduledAt ?? '-'})`
                          : '초안'}
                      </td>
                      <td className="px-3 py-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedAnnouncementId(announcement.id)}>
                          편집
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {announcements.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        등록된 공지가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

                        {selectedAnnouncement && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex flex-wrap gap-3">
                  <Select
                    value={selectedAnnouncement.status}
                    onValueChange={(value: AnnouncementItem['status']) => updateAnnouncement({ status: value })}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">초안</SelectItem>
                      <SelectItem value="SCHEDULED">예약</SelectItem>
                      <SelectItem value="PUBLISHED">발행</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="datetime-local"
                    value={selectedAnnouncement.scheduledAt ?? ''}
                    onChange={(event) => updateAnnouncement({ scheduledAt: event.target.value })}
                  />
                  <Button size="sm" variant="outline" onClick={() => updateAnnouncement({ link: undefined })}>
                    링크 제거
                  </Button>
                </div>
                  <Textarea
                  rows={4}
                  value={selectedAnnouncement.body}
                  onChange={(event) => updateAnnouncement({ body: event.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FAQ · 문의 응답 현황</CardTitle>
            <p className="text-sm text-muted-foreground">콘텐츠 큐레이션과 고객지원 티켓을 한 화면에서 추적합니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{ticket.createdAt}</span>
                  <span>{ticket.category}</span>
                </div>
                <p className="mt-1 font-semibold text-foreground">{ticket.user}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Select
                    value={ticket.status}
                    onValueChange={(value: EngagementTicket['status']) => updateTicketStatus(ticket.id, value)}
                  >
                    <SelectTrigger className="w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="대기">대기</SelectItem>
                      <SelectItem value="진행">진행</SelectItem>
                      <SelectItem value="완료">완료</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast({ title: '히스토리 열기', description: `${ticket.user} 문의 기록을 확인했습니다.` })}
                  >
                    히스토리 보기
                  </Button>
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-muted-foreground">처리할 항목이 없습니다.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
