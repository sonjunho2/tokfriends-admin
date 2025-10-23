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

interface AdminNote {
  id: string
  author: string
  body: string
  createdAt: string
}

type UserStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'UNDER_REVIEW' | 'SUSPENDED'
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

type SubscriptionTier = 'FREE' | 'PLUS' | 'PREMIUM'

interface DirectoryUser {
  id: string
  email: string
  nickname: string
  status: UserStatus
  joinedAt: string
  lastActiveAt?: string
  region?: string
  subscription: SubscriptionTier
  marketingOptIn: boolean
  verified: boolean
  riskLevel: RiskLevel
  aiTags: string[]
  segments: string[]
  supportTickets: number
  banExpiresAt?: string
  bio?: string
  notes: AdminNote[]
}

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: '활성',
  PENDING_VERIFICATION: '인증 대기',
  UNDER_REVIEW: '검토 필요',
  SUSPENDED: '정지',
}

const STATUS_CLASS: Record<UserStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING_VERIFICATION: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700',
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: STATUS_LABEL.ACTIVE },
  { value: 'PENDING_VERIFICATION', label: STATUS_LABEL.PENDING_VERIFICATION },
  { value: 'UNDER_REVIEW', label: STATUS_LABEL.UNDER_REVIEW },
  { value: 'SUSPENDED', label: STATUS_LABEL.SUSPENDED },
] as const

type StatusFilter = (typeof STATUS_OPTIONS)[number]['value']

const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
}

const RISK_CLASS: Record<RiskLevel, string> = {
  LOW: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
}

const SUBSCRIPTION_LABEL: Record<SubscriptionTier, string> = {
  FREE: 'Free',
  PLUS: 'Plus',
  PREMIUM: 'Premium',
}

const DIRECTORY_USERS: DirectoryUser[] = [
  {
    id: 'USR-101',
    email: 'hana@example.com',
    nickname: '하나',
    status: 'ACTIVE',
    joinedAt: '2024-01-04',
    lastActiveAt: '2024-03-14 11:22',
    region: '서울 강남구',
    subscription: 'PLUS',
    marketingOptIn: false,
    verified: true,
    riskLevel: 'LOW',
    aiTags: ['core_user', 'top_match'],
    segments: ['VIP', '강남-2030'],
    supportTickets: 1,
    bio: '마케팅 기획자, 주말엔 요리를 좋아해요.',
    notes: [
      { id: 'note-1', author: '민아', body: '지난주 환불 처리. 재발 방지 모니터링 중.', createdAt: '2024-03-08 15:41' },
    ],
  },
  {
    id: 'USR-102',
    email: 'minsu@example.com',
    nickname: '민수',
    status: 'UNDER_REVIEW',
    joinedAt: '2023-12-20',
    lastActiveAt: '2024-03-13 20:05',
    region: '부산 해운대구',
    subscription: 'FREE',
    marketingOptIn: true,
    verified: true,
    riskLevel: 'MEDIUM',
    aiTags: ['report_watch'],
    segments: ['부산-취향', '다중신고'],
    supportTickets: 3,
    bio: '등산과 부산 맛집 탐방을 좋아합니다.',
    notes: [
      { id: 'note-2', author: '지훈', body: '신고 2건(언어/스팸). 경고 후 모니터링 중.', createdAt: '2024-03-12 10:22' },
    ],
  },
  {
    id: 'USR-103',
    email: 'sujin@example.com',
    nickname: '수진',
    status: 'PENDING_VERIFICATION',
    joinedAt: '2024-03-11',
    subscription: 'FREE',
    marketingOptIn: false,
    verified: false,
    riskLevel: 'LOW',
    aiTags: ['needs_verification'],
    segments: ['서울-신규'],
    supportTickets: 0,
    banExpiresAt: undefined,
    notes: [
      { id: 'note-3', author: '도윤', body: '휴대폰 인증 대기. 재전송 완료.', createdAt: '2024-03-14 09:02' },
    ],
  },
  {
    id: 'USR-104',
    email: 'jay@example.com',
    nickname: '제이',
    status: 'SUSPENDED',
    joinedAt: '2023-09-02',
    lastActiveAt: '2024-02-27 18:40',
    region: '대구 수성구',
    subscription: 'PREMIUM',
    marketingOptIn: true,
    verified: true,
    riskLevel: 'HIGH',
    aiTags: ['payment_chargeback'],
    segments: ['리스크감지'],
    supportTickets: 5,
    banExpiresAt: '2024-03-21',
    notes: [
      { id: 'note-4', author: '승아', body: '결제 분쟁으로 14일 정지. 카드사 회신 대기.', createdAt: '2024-03-07 13:10' },
    ],
  },
]

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<DirectoryUser[]>(DIRECTORY_USERS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedUserId, setSelectedUserId] = useState<string>(DIRECTORY_USERS[0]?.id ?? '')
  const [noteDraft, setNoteDraft] = useState('')

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = search.trim().toLowerCase()
      const matchesKeyword =
        keyword.length === 0 ||
        user.email.toLowerCase().includes(keyword) ||
        user.nickname.toLowerCase().includes(keyword)
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter
      return matchesKeyword && matchesStatus
    })
  }, [users, search, statusFilter])

  const selectedUser = useMemo(() => {
    const fromList = filteredUsers.find((user) => user.id === selectedUserId)
    if (fromList) return fromList
    return filteredUsers[0]
  }, [filteredUsers, selectedUserId])

  const updateSelectedUser = (payload: Partial<DirectoryUser>) => {
    if (!selectedUser) return
    setUsers((prev) =>
      prev.map((user) => (user.id === selectedUser.id ? { ...user, ...payload } : user))
    )
  }

  const changeStatus = (status: UserStatus) => {
    if (!selectedUser) return
    const banExpiresAt = status === 'SUSPENDED' ? '2024-03-21' : undefined
    updateSelectedUser({ status, banExpiresAt })
    toast({ title: '상태 변경', description: `${selectedUser.nickname}님의 상태가 ${STATUS_LABEL[status]}로 업데이트되었습니다.` })
  }

  const toggleSegment = (segment: string) => {
    if (!selectedUser) return
    const hasSegment = selectedUser.segments.includes(segment)
    const segments = hasSegment
      ? selectedUser.segments.filter((item) => item !== segment)
      : [...selectedUser.segments, segment]
    updateSelectedUser({ segments })
  }

  const appendNote = () => {
    if (!selectedUser || !noteDraft.trim()) {
      toast({ title: '메모 입력 필요', description: '메모 내용을 작성해주세요.', variant: 'destructive' })
      return
    }
    const note: AdminNote = {
      id: `note-${Date.now()}`,
      author: '운영자',
      body: noteDraft.trim(),
      createdAt: new Date().toLocaleString('ko-KR'),
    }
    updateSelectedUser({ notes: [note, ...(selectedUser.notes ?? [])] })
    setNoteDraft('')
    toast({ title: '메모 추가됨', description: '내부 메모가 기록되었습니다.' })
  }

  const sendVerification = () => {
    if (!selectedUser) return
    toast({ title: '인증 메일 재전송', description: `${selectedUser.email} 주소로 재전송했습니다.` })
  }

  const sendPasswordReset = () => {
    if (!selectedUser) return
    toast({ title: '비밀번호 초기화', description: `${selectedUser.email}로 초기화 링크를 발송했습니다.` })
  }

  const escalateCase = () => {
    if (!selectedUser) return
    toast({ title: '에스컬레이션', description: '안전 담당자에게 케이스를 전달했습니다.' })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>사용자 디렉토리</CardTitle>
            <p className="text-sm text-muted-foreground">
              검색과 상태 필터를 활용해 운영 대상 사용자를 빠르게 찾아보세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <Input
                placeholder="이메일 또는 닉네임 검색"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[500px] overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">사용자</th>
                    <th className="px-4 py-2 font-medium">상태</th>
                    <th className="px-4 py-2 font-medium">구독</th>
                    <th className="px-4 py-2 font-medium">리스크</th>
                    <th className="px-4 py-2 font-medium">마지막 활동</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isActive = user.id === selectedUser?.id
                    return (
                      <tr
                        key={user.id}
                        className={`cursor-pointer border-t transition hover:bg-accent/40 ${
                          isActive ? 'bg-accent/60' : ''
                        }`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col">
                            <span className="font-medium">{user.nickname}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                            <span className="text-xs text-muted-foreground">가입 {user.joinedAt}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASS[user.status]}`}>
                            {STATUS_LABEL[user.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-xs font-medium">{SUBSCRIPTION_LABEL[user.subscription]}</td>
                        <td className="px-4 py-3 align-top">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${RISK_CLASS[user.riskLevel]}`}>
                            {RISK_LABEL[user.riskLevel]}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                          {user.lastActiveAt ?? '-'}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-muted-foreground" colSpan={5}>
                        조건에 맞는 사용자가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제재 & 액션</CardTitle>
            <p className="text-sm text-muted-foreground">
              계정 상태 전환, 인증 재전송, 패스워드 초기화 등 주요 운영 액션을 수행합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="default" onClick={() => changeStatus('ACTIVE')} disabled={!selectedUser}>
                활성화
              </Button>
              <Button size="sm" variant="outline" onClick={() => changeStatus('UNDER_REVIEW')} disabled={!selectedUser}>
                검토 요청
              </Button>
              <Button size="sm" variant="outline" onClick={() => changeStatus('PENDING_VERIFICATION')} disabled={!selectedUser}>
                인증 대기
              </Button>
              <Button size="sm" variant="destructive" onClick={() => changeStatus('SUSPENDED')} disabled={!selectedUser}>
                정지 처리
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={sendVerification} disabled={!selectedUser}>
                인증 메일 재전송
              </Button>
              <Button size="sm" variant="outline" onClick={sendPasswordReset} disabled={!selectedUser}>
                비밀번호 재설정 링크
              </Button>
              <Button size="sm" variant="secondary" onClick={escalateCase} disabled={!selectedUser}>
                안전팀 에스컬레이트
              </Button>
            </div>

            {selectedUser && (
              <div className="rounded-md border p-3 text-xs">
                <p className="font-semibold">현재 상태: {STATUS_LABEL[selectedUser.status]}</p>
                <p className="mt-1 text-muted-foreground">
                  고객 문의 {selectedUser.supportTickets}건 · AI 태그 {selectedUser.aiTags.join(', ') || '없음'}
                </p>
                {selectedUser.banExpiresAt && (
                  <p className="mt-1 text-red-600">정지 해제 예정: {selectedUser.banExpiresAt}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>프로필 & 메타데이터</CardTitle>
            <p className="text-sm text-muted-foreground">
              닉네임, 지역, 소개 문구를 편집하고 AI 태그/세그먼트를 관리하세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedUser ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>닉네임</Label>
                    <Input
                      value={selectedUser.nickname}
                      onChange={(event) => updateSelectedUser({ nickname: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>이메일</Label>
                    <Input value={selectedUser.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>활동 지역</Label>
                    <Input
                      value={selectedUser.region ?? ''}
                      onChange={(event) => updateSelectedUser({ region: event.target.value })}
                      placeholder="예: 서울특별시 강남구"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>구독 플랜</Label>
                    <Select
                      value={selectedUser.subscription}
                      onValueChange={(value: SubscriptionTier) => updateSelectedUser({ subscription: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="PLUS">Plus</SelectItem>
                        <SelectItem value="PREMIUM">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>소개</Label>
                    <Textarea
                      value={selectedUser.bio ?? ''}
                      onChange={(event) => updateSelectedUser({ bio: event.target.value })}
                      rows={3}
                      placeholder="운영 메모에 활용될 간단한 소개"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>세그먼트</Label>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['VIP', '강남-2030', '부산-취향', '다중신고', '리스크감지'].map((segment) => {
                      const active = selectedUser.segments.includes(segment)
                      return (
                        <button
                          key={segment}
                          type="button"
                          onClick={() => toggleSegment(segment)}
                          className={`rounded-full border px-3 py-1 transition ${
                            active ? 'border-primary bg-primary/10 text-primary' : 'border-dashed text-muted-foreground'
                          }`}
                        >
                          {segment}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">좌측에서 사용자를 선택하면 상세 정보를 편집할 수 있습니다.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>권한 & 위험도</CardTitle>
            <p className="text-sm text-muted-foreground">인증 여부, 마케팅 동의, 리스크 레벨을 제어합니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {selectedUser ? (
              <>
                <div className="flex items-center justify-between">
                  <span>본인 인증 완료</span>
                  <Switch checked={selectedUser.verified} onCheckedChange={() => updateSelectedUser({ verified: !selectedUser.verified })} />
                </div>
                <div className="flex items-center justify-between">
                  <span>마케팅 정보 수신</span>
                  <Switch
                    checked={selectedUser.marketingOptIn}
                    onCheckedChange={() => updateSelectedUser({ marketingOptIn: !selectedUser.marketingOptIn })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">리스크 레벨</Label>
                  <Select
                    value={selectedUser.riskLevel}
                    onValueChange={(value: RiskLevel) => updateSelectedUser({ riskLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>AI 태그: {selectedUser.aiTags.join(', ') || '없음'}</p>
                  <p>지원 티켓: {selectedUser.supportTickets}건</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">선택된 사용자가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>내부 메모 & 타임라인</CardTitle>
            <p className="text-sm text-muted-foreground">사건 경과, 조치 결과를 기록해 팀 간 컨텍스트를 공유합니다.</p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              rows={3}
              placeholder="내부 메모를 작성하세요."
              disabled={!selectedUser}
            />
            <Button size="sm" onClick={appendNote} disabled={!selectedUser}>
              메모 추가
            </Button>

            <div className="space-y-3">
              {selectedUser?.notes?.length ? (
                selectedUser.notes.map((note) => (
                  <div key={note.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{note.author}</span>
                      <span>{note.createdAt}</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground leading-relaxed">{note.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">등록된 내부 메모가 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
