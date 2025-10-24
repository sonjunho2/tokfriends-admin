'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { PhoneCall } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  getUserById,
  searchUsers,
  updateUserProfile,
  type UserDetail,
  type UserSearchParams,
  type UserSummary,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const STATUS_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'PENDING_VERIFICATION', label: '인증 대기' },
  { value: 'UNDER_REVIEW', label: '검토 필요' },
  { value: 'SUSPENDED', label: '정지' },
] as const

type StatusFilter = (typeof STATUS_OPTIONS)[number]['value']

const FALLBACK_USERS: UserSummary[] = [
  {
    id: 'USR-101',
    email: 'hana@example.com',
    nickname: '하나',
    status: 'ACTIVE',
    createdAt: '2024-01-04T00:00:00+09:00',
    lastActiveAt: '2024-03-14T11:22:00+09:00',
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
      {
        id: 'note-1',
        author: '민아',
        body: '지난주 환불 처리. 재발 방지 모니터링 중.',
        createdAt: '2024-03-08T15:41:00+09:00',
      },
    ],
  },
  {
    id: 'USR-102',
    email: 'minsu@example.com',
    nickname: '민수',
    status: 'UNDER_REVIEW',
    createdAt: '2023-12-20T00:00:00+09:00',
    lastActiveAt: '2024-03-13T20:05:00+09:00',
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
         {
        id: 'note-2',
        author: '지훈',
        body: '신고 2건(언어/스팸). 경고 후 모니터링 중.',
        createdAt: '2024-03-12T10:22:00+09:00',
      },
    ],
  },
  {
    id: 'USR-103',
    email: 'sujin@example.com',
    nickname: '수진',
    status: 'PENDING_VERIFICATION',
    createdAt: '2024-03-11T00:00:00+09:00',
    marketingOptIn: false,
    verified: false,
    riskLevel: 'LOW',
    aiTags: ['needs_verification'],
    segments: ['서울-신규'],
    supportTickets: 0,
    notes: [
       {
        id: 'note-3',
        author: '도윤',
        body: '휴대폰 인증 대기. 재전송 완료.',
        createdAt: '2024-03-14T09:02:00+09:00',
      },
    ],
  },
  {
    id: 'USR-104',
    email: 'jay@example.com',
    nickname: '제이',
    status: 'SUSPENDED',
    createdAt: '2023-09-02T00:00:00+09:00',
    lastActiveAt: '2024-02-27T18:40:00+09:00',
    region: '대구 수성구',
    subscription: 'PREMIUM',
    marketingOptIn: true,
    verified: true,
    riskLevel: 'HIGH',
    aiTags: ['payment_chargeback'],
    segments: ['리스크감지'],
    supportTickets: 5,
    banExpiresAt: '2024-03-21T00:00:00+09:00',
    notes: [
      {
        id: 'note-4',
        author: '승아',
        body: '결제 분쟁으로 14일 정지. 카드사 회신 대기.',
        createdAt: '2024-03-07T13:10:00+09:00',
      },
    ],
  },
]

const FALLBACK_DETAIL_MAP = new Map(FALLBACK_USERS.map((user) => [user.id, user]))

function normalizeDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

function buildPatchObject(user: UserDetail | null) {
  if (!user) return {}
  const patch: Record<string, unknown> = {}
  if (typeof user.nickname === 'string') patch.nickname = user.nickname
  if (typeof user.status === 'string') patch.status = user.status
  if (typeof user.memo === 'string') patch.memo = user.memo
  if (typeof user.marketingOptIn === 'boolean') patch.marketingOptIn = user.marketingOptIn
  if (typeof (user as any).bio === 'string') patch.bio = (user as any).bio
  if (typeof (user as any).introduction === 'string') patch.introduction = (user as any).introduction
  return patch
}

function buildPatchDraft(user: UserDetail | null) {
  const patch = buildPatchObject(user)
  const keys = Object.keys(patch)
  if (keys.length === 0) {
    return '{\n  \n}'
  }
  return JSON.stringify(patch, null, 2)
}

export default function UsersPage() {
  const { toast } = useToast()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [searchNickname, setSearchNickname] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const [users, setUsers] = useState<UserSummary[]>(FALLBACK_USERS)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(FALLBACK_USERS[0]?.id ?? null)
  const [userDetail, setUserDetail] = useState<UserDetail | null>(
    selectedUserId ? (FALLBACK_DETAIL_MAP.get(selectedUserId) as UserDetail | undefined) ?? null : null
  )

  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [patchDraft, setPatchDraft] = useState(() => buildPatchDraft(userDetail))

  const visibleUsers = useMemo(() => {
    if (statusFilter === 'ALL') return users
    return users.filter((user) => user.status?.toUpperCase() === statusFilter)
  }, [users, statusFilter])

  useEffect(() => {
    void performSearch(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function performSearch(initial = false) {
    const params: UserSearchParams = {}
    if (searchKeyword.trim()) params.query = searchKeyword.trim()
    if (searchEmail.trim()) params.email = searchEmail.trim()
    if (searchNickname.trim()) params.nickname = searchNickname.trim()
    if (statusFilter !== 'ALL') params.status = statusFilter

    setIsSearching(true)
    try {
      const results = await searchUsers(params)
      const normalized = results.map((user, index) => ({
        ...user,
        id: typeof user.id === 'string' && user.id.trim().length > 0 ? user.id : `user-${index}`,
      }))
      if (normalized.length === 0) {
        if (!initial) {
          toast({ title: '검색 결과 없음', description: '조건에 해당하는 사용자가 없습니다.' })
          setUsers([])
          setSelectedUserId(null)
          setUserDetail(null)
          setPatchDraft('{\n  \n}')
        } else {
          setUsers(FALLBACK_USERS)
          const fallbackId = FALLBACK_USERS[0]?.id ?? null
          setSelectedUserId(fallbackId)
          const fallbackDetail = fallbackId
            ? (FALLBACK_DETAIL_MAP.get(fallbackId) as UserDetail | undefined) ?? null
            : null
          setUserDetail(fallbackDetail)
          setPatchDraft(buildPatchDraft(fallbackDetail))
        }
        return
      }

      setUsers(normalized)
      if (normalized.length > 0) {
        const firstId = normalized[0]?.id
        if (firstId) {
          setSelectedUserId(firstId)
          await loadUserDetail(firstId, { silent: true })
        }
      }
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '사용자 검색에 실패했습니다.'
      toast({
        title: 'API 검색 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
      setUsers(FALLBACK_USERS)
      const fallbackId = FALLBACK_USERS[0]?.id ?? null
      setSelectedUserId(fallbackId)
      const fallbackDetail = fallbackId ? (FALLBACK_DETAIL_MAP.get(fallbackId) as UserDetail | undefined) ?? null : null
      setUserDetail(fallbackDetail)
      setPatchDraft(buildPatchDraft(fallbackDetail))
    } finally {
      setIsSearching(false)
    }
  }

  async function loadUserDetail(userId: string, options: { silent?: boolean } = {}) {
    if (!userId) return
    if (!options.silent) {
      setDetailLoading(true)
    }
    try {
      const detail = await getUserById(userId)
      setUserDetail(detail)
      setPatchDraft(buildPatchDraft(detail))
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '사용자 정보를 불러오지 못했습니다.'
      const fallbackDetail = (FALLBACK_DETAIL_MAP.get(userId) as UserDetail | undefined) ?? null
      setUserDetail(fallbackDetail)
      setPatchDraft(buildPatchDraft(fallbackDetail))
      toast({
        title: '사용자 조회 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
    } finally {
      if (!options.silent) {
        setDetailLoading(false)
      }
    }
  }

  async function handlePatchSubmit() {
    if (!selectedUserId) {
      toast({ title: '선택된 사용자 없음', description: '먼저 목록에서 사용자를 선택해주세요.' })
      return
    }
    
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(patchDraft || '{}')
    } catch (error) {
      toast({ title: 'JSON 파싱 오류', description: 'PATCH payload 형식이 올바른지 확인해주세요.', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateUserProfile(selectedUserId, payload)
      setUserDetail(updated)
      setUsers((prev) => prev.map((user) => (user.id === updated.id ? { ...user, ...updated } : user)))
      setPatchDraft(buildPatchDraft(updated))
      toast({ title: '프로필 업데이트 완료', description: '변경 사항이 저장되었습니다.' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '프로필 업데이트에 실패했습니다.'
      toast({
        title: '업데이트 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

    const selectedDetail = userDetail

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
      <section className="space-y-4">
                <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-primary" /> 휴대폰 인증 대시보드
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                OTP 요청 로그, 인증 대기 세션, 수동 가입 완료 기능을 빠르게 확인하세요.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/users/phone-verification">휴대폰 인증 관리 열기</Link>
            </Button>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            인증 성공 후 프로필 입력을 완료하지 않은 세션을 만료하거나 재전송·승인 처리할 수 있습니다. 고객센터 대응 중에는 verificationId를 기준으로 검색해 주세요.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>사용자 검색</CardTitle>
            <p className="text-sm text-muted-foreground">이메일, 닉네임, 상태로 필터링하여 백엔드 `GET /users/search`와 연동합니다.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-keyword">키워드</Label>
                <Input
                  id="user-keyword"
                  placeholder="이메일, 닉네임 등"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">이메일</Label>
                <Input id="user-email" value={searchEmail} onChange={(event) => setSearchEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-nickname">닉네임</Label>
                <Input id="user-nickname" value={searchNickname} onChange={(event) => setSearchNickname(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-status">상태</Label>
                <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                  <SelectTrigger id="user-status">
                    <SelectValue />
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
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => performSearch()} disabled={isSearching}>
                {isSearching ? '검색 중...' : '검색'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchKeyword('')
                  setSearchEmail('')
                  setSearchNickname('')
                  setStatusFilter('ALL')
                  void performSearch()
                }}
                disabled={isSearching}
              >
                초기화
              </Button>
            </div>
            <div className="rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">이메일</th>
                    <th className="px-3 py-2 font-medium">닉네임</th>
                    <th className="px-3 py-2 font-medium">상태</th>
                    <th className="px-3 py-2 font-medium">가입일</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`cursor-pointer border-t ${user.id === selectedUserId ? 'bg-accent/50' : 'hover:bg-accent/40'}`}
                      onClick={() => {
                        setSelectedUserId(user.id)
                        void loadUserDetail(user.id)
                      }}
                    >
                      <td className="px-3 py-2 font-medium">{user.email ?? '-'}</td>
                      <td className="px-3 py-2">{user.nickname ?? '-'}</td>
                      <td className="px-3 py-2 text-xs uppercase tracking-wide">{user.status ?? '-'}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{normalizeDate(user.createdAt)}</td>
                    </tr>
                  ))}
                  {visibleUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        표시할 사용자가 없습니다. 조건을 바꾸고 다시 검색해주세요.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>사용자 상세</CardTitle>
              <p className="text-sm text-muted-foreground">
                `GET /users/:id` 응답을 기반으로 상태·메모 등을 검토하고 `PATCH /users/:id`로 갱신합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => selectedUserId && loadUserDetail(selectedUserId)} disabled={!selectedUserId || detailLoading}>
                {detailLoading ? '불러오는 중...' : '상세 새로고침'}
              </Button>
              <Button size="sm" onClick={handlePatchSubmit} disabled={isSaving || !selectedUserId}>
                {isSaving ? '저장 중...' : '프로필 저장'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {selectedDetail ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">사용자 ID</p>
                    <p className="font-semibold">{selectedDetail.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">이메일</p>
                    <p className="font-semibold break-all">{selectedDetail.email ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">닉네임</p>
                    <p className="font-semibold">{selectedDetail.nickname ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">상태</p>
                    <p className="font-semibold uppercase tracking-wide">{selectedDetail.status ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">가입일</p>
                    <p className="font-semibold">{normalizeDate(selectedDetail.createdAt)}</p>
                  </div>
                   <div>
                    <p className="text-xs text-muted-foreground">최근 활동</p>
                    <p className="font-semibold">{normalizeDate((selectedDetail as any).lastActiveAt)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-patch">PATCH Payload (JSON)</Label>
                  <Textarea
                    id="user-patch"
                    rows={10}
                    value={patchDraft}
                    onChange={(event) => setPatchDraft(event.target.value)}
                    placeholder="{\n  \"status\": \"SUSPENDED\"\n}"
                  />
                  <p className="text-xs text-muted-foreground">
                    JSON 형식으로 수정할 필드를 입력한 뒤 “프로필 저장” 버튼을 눌러 변경 사항을 적용하세요.
                  </p>
                </div>

                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">전체 응답</p>
                  <pre className="mt-2 max-h-[320px] overflow-auto whitespace-pre-wrap break-words text-xs">
                    {JSON.stringify(selectedDetail, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">사용자를 선택하면 상세 정보가 표시됩니다.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
