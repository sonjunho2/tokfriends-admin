'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface QuickFilter {
  id: string
  label: string
  segment: '접속중' | '가까운 거리' | '연령대' | '의도'
  description: string
}

interface RecommendationPool {
  id: string
  type: 'HOT' | 'ACTIVE' | 'NEARBY' | 'AGE' | 'INTENT'
  title: string
  sortRule: string
  metrics: string
}

interface SampleUserCard {
  id: string
  nickname: string
  lastSeen: string
  region: string
  distance: string
  points: number
  intent: string
}

const INITIAL_FILTERS: QuickFilter[] = [
  { id: 'F1', label: '지금 접속중', segment: '접속중', description: '최근 5분 내 접속' },
  { id: 'F2', label: '근처 친구', segment: '가까운 거리', description: '5km 이내 사용자' },
  { id: 'F3', label: '20대 추천', segment: '연령대', description: '출생연도 1995~2005' },
  { id: 'F4', label: '같이 운동', segment: '의도', description: '관심사=운동, 등산' },
]

const INITIAL_POOLS: RecommendationPool[] = [
  { id: 'POOL1', type: 'HOT', title: 'HOT 추천', sortRule: '관심·대화수·포인트 지표', metrics: 'CTR 18.2%' },
  { id: 'POOL2', type: 'ACTIVE', title: '접속중', sortRule: '최근 접속 순', metrics: '세션 유지율 72%' },
  { id: 'POOL3', type: 'NEARBY', title: '가까운 친구', sortRule: '거리 ASC + 활성도', metrics: '첫 메시지 전환 9%' },
  { id: 'POOL4', type: 'INTENT', title: '의도별 추천', sortRule: '선호 의도 매칭 점수', metrics: '응답률 24%' },
]

const SAMPLE_USERS: SampleUserCard[] = [
  { id: 'U-10', nickname: '루나', lastSeen: '5분 전', region: '서울 마포', distance: '1.2km', points: 420, intent: '친구찾기' },
  { id: 'U-11', nickname: '도윤', lastSeen: '접속중', region: '경기 고양', distance: '3.8km', points: 210, intent: '취미모임' },
  { id: 'U-12', nickname: '민지', lastSeen: '12분 전', region: '서울 송파', distance: '7.1km', points: 980, intent: '소개팅' },
]

export default function ContentPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [pools, setPools] = useState(INITIAL_POOLS)
  const [newFilter, setNewFilter] = useState({ label: '', segment: '접속중' as QuickFilter['segment'], description: '' })

  const addFilter = () => {
    if (!newFilter.label.trim()) return
    const id = `F${filters.length + 1}`
    setFilters((prev) => [...prev, { id, ...newFilter }])
    setNewFilter({ label: '', segment: '접속중', description: '' })
  }

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((item) => item.id !== id))
  }

  const updatePool = (id: string, payload: Partial<RecommendationPool>) => {
    setPools((prev) => prev.map((pool) => (pool.id === id ? { ...pool, ...payload } : pool)))
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>홈 빠른 필터 구성</CardTitle>
            <p className="text-sm text-muted-foreground">
              2×4 빠른 필터 슬롯에 노출되는 항목을 정의하고 재배치합니다. 탐색 화면과 공통 세그먼트 사전을 공유합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>라벨</Label>
                <Input value={newFilter.label} onChange={(event) => setNewFilter((prev) => ({ ...prev, label: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>세그먼트</Label>
                <Select value={newFilter.segment} onValueChange={(value: QuickFilter['segment']) => setNewFilter((prev) => ({ ...prev, segment: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="접속중">접속중</SelectItem>
                    <SelectItem value="가까운 거리">가까운 거리</SelectItem>
                    <SelectItem value="연령대">연령대</SelectItem>
                    <SelectItem value="의도">의도</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>설명</Label>
                <Textarea
                  value={newFilter.description}
                  onChange={(event) => setNewFilter((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <Button size="sm" onClick={addFilter}>
              빠른 필터 추가
            </Button>

            <div className="max-h-[320px] overflow-y-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">라벨</th>
                    <th className="px-3 py-2 font-medium">세그먼트</th>
                    <th className="px-3 py-2 font-medium">설명</th>
                    <th className="px-3 py-2 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filters.map((filter) => (
                    <tr key={filter.id} className="border-t">
                      <td className="px-3 py-2 font-semibold">{filter.label}</td>
                      <td className="px-3 py-2">{filter.segment}</td>
                      <td className="px-3 py-2 text-muted-foreground">{filter.description}</td>
                      <td className="px-3 py-2">
                        <Button size="sm" variant="outline" onClick={() => removeFilter(filter.id)}>
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filters.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                        등록된 필터가 없습니다.
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
            <CardTitle>추천 풀 성과 지표</CardTitle>
            <p className="text-sm text-muted-foreground">
              HOT 추천, 접속중, 가까운, 연령대, 의도별 추천의 노출 비율과 전환 지표를 추적합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {pools.map((pool) => (
              <div key={pool.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{pool.title}</p>
                    <p className="text-xs text-muted-foreground">정렬 기준: {pool.sortRule}</p>
                  </div>
                  <Input
                    className="w-32"
                    value={pool.metrics}
                    onChange={(event) => updatePool(pool.id, { metrics: event.target.value })}
                  />
                </div>
                <div className="mt-3 space-y-2">
                  <Label className="text-xs font-semibold">정렬 규칙</Label>
                  <Textarea
                    value={pool.sortRule}
                    onChange={(event) => updatePool(pool.id, { sortRule: event.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>사용자 카드 검증</CardTitle>
            <p className="text-sm text-muted-foreground">
              최근 접속, 지역, 거리, 포인트 데이터를 샘플 조회하여 추천 노출 데이터가 실제 서비스 기준과 일치하는지 확인합니다.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {SAMPLE_USERS.map((user) => (
              <div key={user.id} className="rounded-lg border p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">{user.nickname}</span>
                  <span className="text-xs text-muted-foreground">{user.lastSeen}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{user.region} · {user.distance}</p>
                <p className="mt-1 text-xs text-muted-foreground">포인트 {user.points.toLocaleString()}P · 의도 {user.intent}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">
                    위치 데이터 검증
                  </Button>
                  <Button size="sm" variant="outline">
                    실시간 프로필 보기
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>더미 데이터 전환 체크리스트</CardTitle>
            <p className="text-sm text-muted-foreground">
              탐색·추천 화면에 남아 있는 더미 데이터를 실제 백엔드 지표와 분리 관리합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" /> 홈 빠른 필터 API 연동 계획
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="h-4 w-4" /> 사용자 카드 거리 계산 검증
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" /> HOT 추천 실 데이터 매핑
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" /> 의도별 추천 성과 대시보드 연결
            </label>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
