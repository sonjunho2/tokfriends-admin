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

interface OnboardingUser {
  id: string
  email: string
  nickname: string
  hasAccount: boolean
  status: 'READY' | 'IN_PROGRESS' | 'NEEDS_REVIEW' | 'COMPLETED'
  birthYear?: number
  gender?: '남성' | '여성' | '기타'
  region?: string
  profileImage?: string
  bio?: string
  agreements: { service: boolean; privacy: boolean; marketing: boolean }
  onboardingReward: { profileTimer: boolean; photoBonus: boolean; firstMessageTickets: number }
  lastLoginAt?: string
  missingFields: string[]
}

const MOCK_USERS: OnboardingUser[] = [
  {
    id: 'USR001',
    email: 'hana@example.com',
    nickname: '하나',
    hasAccount: true,
    status: 'COMPLETED',
    birthYear: 1995,
    gender: '여성',
    region: '서울 강남구',
    profileImage: 'https://placehold.co/64x64',
    bio: '마케팅 기획자, 주말엔 요리를 좋아해요.',
    agreements: { service: true, privacy: true, marketing: false },
    onboardingReward: { profileTimer: true, photoBonus: true, firstMessageTickets: 3 },
    lastLoginAt: '2024-03-14 11:22',
    missingFields: [],
  },
  {
    id: 'USR002',
    email: 'minsu@example.com',
    nickname: '민수',
    hasAccount: true,
    status: 'NEEDS_REVIEW',
    birthYear: 1991,
    gender: '남성',
    region: '부산 해운대구',
    bio: '등산을 좋아하고 부산 맛집 탐방 중',
    agreements: { service: true, privacy: true, marketing: true },
    onboardingReward: { profileTimer: false, photoBonus: false, firstMessageTickets: 2 },
    lastLoginAt: '2024-03-13 20:05',
    missingFields: ['프로필 사진', '자기소개 50자'],
  },
  {
    id: 'USR003',
    email: 'sujin@example.com',
    nickname: '수진',
    hasAccount: false,
    status: 'READY',
    agreements: { service: true, privacy: true, marketing: false },
    onboardingReward: { profileTimer: false, photoBonus: false, firstMessageTickets: 0 },
    missingFields: ['이메일 인증', '비밀번호 설정'],
  },
  {
    id: 'USR004',
    email: 'jake@example.com',
    nickname: '제이크',
    hasAccount: true,
    status: 'IN_PROGRESS',
    birthYear: 1998,
    gender: '남성',
    region: '대구 수성구',
    agreements: { service: true, privacy: true, marketing: true },
    onboardingReward: { profileTimer: true, photoBonus: false, firstMessageTickets: 1 },
    lastLoginAt: '2024-03-14 09:12',
    missingFields: ['거주 지역 상세', '성별 확인'],
  },
]

const STATUS_LABEL: Record<OnboardingUser['status'], string> = {
  READY: '사전 등록',
  IN_PROGRESS: '정보 수집 중',
  NEEDS_REVIEW: '검수 필요',
  COMPLETED: '완료',
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'READY', label: STATUS_LABEL.READY },
  { value: 'IN_PROGRESS', label: STATUS_LABEL.IN_PROGRESS },
  { value: 'NEEDS_REVIEW', label: STATUS_LABEL.NEEDS_REVIEW },
  { value: 'COMPLETED', label: STATUS_LABEL.COMPLETED },
] as const

type StatusFilter = (typeof STATUS_OPTIONS)[number]['value']

export default function OnboardingPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<OnboardingUser[]>(MOCK_USERS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedId, setSelectedId] = useState<string>(MOCK_USERS[0]?.id ?? '')
  const [adminNote, setAdminNote] = useState('')

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesKeyword =
        search.trim().length === 0 ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.nickname.includes(search)
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter
      return matchesKeyword && matchesStatus
    })
  }, [users, search, statusFilter])

  const selectedUser = useMemo(() => {
    const fromFilter = filteredUsers.find((user) => user.id === selectedId)
    if (fromFilter) return fromFilter
    return filteredUsers[0]
  }, [filteredUsers, selectedId])

  const updateSelectedUser = (payload: Partial<OnboardingUser>) => {
    if (!selectedUser) return
    setUsers((prev) =>
      prev.map((user) => (user.id === selectedUser.id ? { ...user, ...payload } : user))
    )
    toast({ title: '저장됨', description: '온보딩 정보가 업데이트되었습니다.' })
  }

  const toggleAgreement = (key: keyof OnboardingUser['agreements']) => {
    if (!selectedUser) return
    updateSelectedUser({ agreements: { ...selectedUser.agreements, [key]: !selectedUser.agreements[key] } })
  }

  const toggleHasAccount = () => {
    if (!selectedUser) return
    updateSelectedUser({ hasAccount: !selectedUser.hasAccount })
  }

  const markRewards = (key: keyof OnboardingUser['onboardingReward'], value: boolean | number) => {
    if (!selectedUser) return
    updateSelectedUser({
      onboardingReward: {
        ...selectedUser.onboardingReward,
        [key]: value,
      },
    })
  }

  const resetHasAccount = () => {
    if (!selectedUser) return
    updateSelectedUser({ hasAccount: false })
    toast({
      title: 'HAS_ACCOUNT 초기화',
      description: '마케팅 자동화 대상에 다시 포함됩니다.',
    })
  }

  const markComplete = () => {
    if (!selectedUser) return
    updateSelectedUser({ status: 'COMPLETED', missingFields: [] })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>회원 온보딩 현황</CardTitle>
            <p className="text-sm text-muted-foreground">
              이메일·비밀번호 검증부터 필수 약관, 프로필 세팅, 가입 후 자동 로그인까지 진행 상황을 관리합니다.
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
                <SelectTrigger className="w-full lg:w-[160px]">
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

            <div className="max-h-[480px] overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">회원</th>
                    <th className="px-4 py-2 font-medium">온보딩 단계</th>
                    <th className="px-4 py-2 font-medium">HAS_ACCOUNT</th>
                    <th className="px-4 py-2 font-medium">보상</th>
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
                        onClick={() => setSelectedId(user.id)}
                      >
                        <td className="px-4 py-2 align-top">
                          <div className="flex flex-col">
                            <span className="font-medium">{user.nickname}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 align-top">
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                            {STATUS_LABEL[user.status]}
                          </span>
                          {user.missingFields.length > 0 && (
                            <p className="mt-2 text-xs text-amber-600">
                              누락: {user.missingFields.join(', ')}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2 align-top">
                          <span className={`text-xs font-semibold ${user.hasAccount ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {user.hasAccount ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="px-4 py-2 align-top">
                          <div className="space-y-1 text-xs">
                            <p>프로필 타이머: {user.onboardingReward.profileTimer ? '지급' : '대기'}</p>
                            <p>사진/프로필: {user.onboardingReward.photoBonus ? '완료' : '미완료'}</p>
                            <p>첫 메시지권: {user.onboardingReward.firstMessageTickets}장</p>
                          </div>
                        </td>
                        <td className="px-4 py-2 align-top text-xs text-muted-foreground">
                          {user.lastLoginAt ?? '-'}
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
            <CardTitle>온보딩 보상 설정</CardTitle>
            <p className="text-sm text-muted-foreground">
              30분 내 프로필 50P, 사진/프로필 완성 30P, 첫 메시지 이용권 3장을 지급하거나 회수할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>30분 내 프로필 완료 보상</span>
              <Switch
                checked={Boolean(selectedUser?.onboardingReward.profileTimer)}
                onCheckedChange={(checked) => markRewards('profileTimer', checked)}
                disabled={!selectedUser}
              />
            </div>
            <div className="flex items-center justify-between">
              <span>사진/프로필 완성 보상</span>
              <Switch
                checked={Boolean(selectedUser?.onboardingReward.photoBonus)}
                onCheckedChange={(checked) => markRewards('photoBonus', checked)}
                disabled={!selectedUser}
              />
            </div>
            <div className="flex items-center justify-between">
              <span>첫 메시지 이용권</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markRewards('firstMessageTickets', Math.max(0, (selectedUser?.onboardingReward.firstMessageTickets ?? 0) - 1))}
                  disabled={!selectedUser}
                >
                  -
                </Button>
                <span className="w-8 text-center font-semibold">
                  {selectedUser?.onboardingReward.firstMessageTickets ?? 0}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markRewards('firstMessageTickets', (selectedUser?.onboardingReward.firstMessageTickets ?? 0) + 1)}
                  disabled={!selectedUser}
                >
                  +
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>프로필 검수 및 정보 편집</CardTitle>
            <p className="text-sm text-muted-foreground">
              출생연도, 성별, 지역, 프로필 이미지, 자기소개를 검수하고 필요 시 재요청합니다. HAS_ACCOUNT 플래그와 약관 동의 현황을 제어합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
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
                    <Label>출생연도</Label>
                    <Input
                      type="number"
                      value={selectedUser.birthYear ?? ''}
                      onChange={(event) =>
                        updateSelectedUser({ birthYear: Number(event.target.value) || undefined })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>성별</Label>
                    <Select
                      value={selectedUser.gender ?? ''}
                      onValueChange={(value: string) =>
                        updateSelectedUser({ gender: value ? (value as OnboardingUser['gender']) : undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="남성">남성</SelectItem>
                        <SelectItem value="여성">여성</SelectItem>
                        <SelectItem value="기타">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>거주 지역</Label>
                    <Input
                      value={selectedUser.region ?? ''}
                      onChange={(event) => updateSelectedUser({ region: event.target.value })}
                      placeholder="예: 서울특별시 강남구"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>자기소개</Label>
                    <Textarea
                      value={selectedUser.bio ?? ''}
                      onChange={(event) => updateSelectedUser({ bio: event.target.value })}
                      rows={4}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-semibold">약관 동의</Label>
                    <div className="mt-2 space-y-2 text-sm">
                      <label className="flex items-center justify-between">
                        <span>서비스 이용약관</span>
                        <Switch checked={selectedUser.agreements.service} onCheckedChange={() => toggleAgreement('service')} />
                      </label>
                      <label className="flex items-center justify-between">
                        <span>개인정보 처리방침</span>
                        <Switch checked={selectedUser.agreements.privacy} onCheckedChange={() => toggleAgreement('privacy')} />
                      </label>
                      <label className="flex items-center justify-between">
                        <span>마케팅 정보 수신</span>
                        <Switch checked={selectedUser.agreements.marketing} onCheckedChange={() => toggleAgreement('marketing')} />
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">HAS_ACCOUNT · 자동 로그인</Label>
                    <div className="mt-2 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>HAS_ACCOUNT 플래그</span>
                        <Switch checked={selectedUser.hasAccount} onCheckedChange={toggleHasAccount} />
                      </div>
                      <Button size="sm" variant="outline" onClick={resetHasAccount}>
                        최초 가입 여부 초기화
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        환영 화면 자동 로그인 분기에 사용됩니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">검수 메모</Label>
                  <Textarea
                    placeholder="재요청 사유나 상담 메모를 남겨주세요."
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    rows={3}
                  />
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {selectedUser.missingFields.length > 0 ? (
                      selectedUser.missingFields.map((field) => (
                        <span key={field} className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                          누락: {field}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">필수 항목 충족</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="default" onClick={markComplete}>
                    온보딩 완료 처리
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      toast({
                        title: '재요청 발송',
                        description: `${selectedUser.nickname}님에게 프로필 보완을 안내했습니다.`,
                      })
                    }
                  >
                    보완 요청 알림 보내기
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAdminNote('')
                      toast({ title: '메모 초기화' })
                    }}
                  >
                    메모 초기화
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">좌측 목록에서 회원을 선택하세요.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
