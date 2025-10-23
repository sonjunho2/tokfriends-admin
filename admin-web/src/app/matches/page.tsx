'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface QueueStat {
  id: string
  segment: string
  waiting: number
  medianWait: string
  dropOffRate: string
}

interface MatchingPreset {
  id: string
  name: string
  isActive: boolean
  weights: {
    distance: number
    interest: number
    aiAffinity: number
    recency: number
  }
  createdAt: string
  author: string
}

interface QuickFilter {
  id: string
  label: string
  segment: '접속중' | '가까운 거리' | '연령대' | '의도'
  description: string
}

interface RecommendationPool {
  id: string
  title: string
  sortRule: string
  metrics: string
  owner: string
}

interface HeatRegion {
  id: string
  name: string
  activeUsers: number
  flagged: number
  trend: 'UP' | 'DOWN' | 'FLAT'
}

const QUEUE_STATS: QueueStat[] = [
  { id: 'SEG-1', segment: '서울 20대', waiting: 128, medianWait: '00:42', dropOffRate: '4.2%' },
  { id: 'SEG-2', segment: '부산 취향 모임', waiting: 76, medianWait: '01:18', dropOffRate: '6.8%' },
  { id: 'SEG-3', segment: '야간 이용자', waiting: 54, medianWait: '02:05', dropOffRate: '8.1%' },
  { id: 'SEG-4', segment: '신규 가입자', waiting: 192, medianWait: '00:58', dropOffRate: '5.6%' },
]

const INITIAL_PRESETS: MatchingPreset[] = [
  {
    id: 'preset-balanced',
    name: '표준 밸런스',
    isActive: true,
    weights: { distance: 30, interest: 30, aiAffinity: 25, recency: 15 },
    createdAt: '2024-03-01',
    author: '이한별',
  },
  {
    id: 'preset-high-affinity',
    name: '관심사 우선',
    isActive: false,
    weights: { distance: 20, interest: 40, aiAffinity: 30, recency: 10 },
    createdAt: '2024-02-21',
    author: '박지원',
  },
]

const INITIAL_FILTERS: QuickFilter[] = [
  { id: 'F1', label: '지금 접속중', segment: '접속중', description: '최근 5분 내 접속' },
  { id: 'F2', label: '근처 친구', segment: '가까운 거리', description: '5km 이내 사용자' },
  { id: 'F3', label: '20대 추천', segment: '연령대', description: '출생연도 1995~2005' },
  { id: 'F4', label: '같이 운동', segment: '의도', description: '관심사=운동, 등산' },
]

const INITIAL_POOLS: RecommendationPool[] = [
  { id: 'POOL1', title: 'HOT 추천', sortRule: '관심·대화수·포인트 지표', metrics: 'CTR 18.2%', owner: '추천팀' },
  { id: 'POOL2', title: '접속중', sortRule: '최근 접속 순', metrics: '세션 유지율 72%', owner: '플랫폼' },
  { id: 'POOL3', title: '가까운 친구', sortRule: '거리 ASC + 활성도', metrics: '첫 메시지 전환 9%', owner: '추천팀' },
]

const HEAT_REGIONS: HeatRegion[] = [
  { id: 'HR-1', name: '서울 강남·서초', activeUsers: 1832, flagged: 6, trend: 'UP' },
  { id: 'HR-2', name: '부산 해운대', activeUsers: 684, flagged: 4, trend: 'FLAT' },
  { id: 'HR-3', name: '대구 수성', activeUsers: 412, flagged: 9, trend: 'DOWN' },
]

export default function MatchesPage() {
  const { toast } = useToast()
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [pools, setPools] = useState(INITIAL_POOLS)
  const [presets, setPresets] = useState(INITIAL_PRESETS)
  const [selectedPresetId, setSelectedPresetId] = useState<string>(INITIAL_PRESETS[0]?.id ?? '')
  const [newFilter, setNewFilter] = useState({
    label: '',
    segment: '접속중' as QuickFilter['segment'],
    description: '',
  })
  const [heatSummaryMemo, setHeatSummaryMemo] = useState('')

  const selectedPreset = useMemo(
    () => presets.find((item) => item.id === selectedPresetId) ?? presets[0] ?? null,
    [presets, selectedPresetId]
  )

  const addFilter = () => {
    if (!newFilter.label.trim()) {
      toast({ title: '필터 이름이 필요합니다.', variant: 'destructive' })
      return
    }
    const id = `F${Date.now().toString().slice(-4)}`
    setFilters((prev) => [...prev, { id, ...newFilter }])
    setNewFilter({ label: '', segment: '접속중', description: '' })
    toast({ title: '빠른 필터 추가', description: `${newFilter.label} 필터가 생성되었습니다.` })
  }

  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((item) => item.id !== id))
  }

  const updatePool = (id: string, payload: Partial<RecommendationPool>) => {
    setPools((prev) => prev.map((pool) => (pool.id === id ? { ...pool, ...payload } : pool)))
  }

  const updatePresetWeight = (key: keyof MatchingPreset['weights'], value: number) => {
    if (!selectedPreset) return
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === selectedPreset.id
          ? {
              ...preset,
              weights: {
                ...preset.weights,
                [key]: Math.max(0, Math.min(100, value)),
              },
            }
          : preset
      )
    )
  }

  const savePreset = () => {
    if (!selectedPreset) return
    toast({ title: '프리셋 저장', description: `${selectedPreset.name} 가중치 구성이 저장되었습니다.` })
  }

  const activatePreset = (id: string) => {
    setPresets((prev) => prev.map((preset) => ({ ...preset, isActive: preset.id === id })))
    setSelectedPresetId(id)
    toast({ title: '프리셋 활성화', description: '새로운 매칭 가중치가 적용되었습니다.' })
  }

  const duplicatePreset = () => {
    if (!selectedPreset) return
    const id = `preset-${Date.now().toString(36)}`
    const clone: MatchingPreset = {
      ...selectedPreset,
      id,
      name: `${selectedPreset.name} 사본`,
      isActive: false,
      createdAt: new Date().toISOString().slice(0, 10),
      author: '운영자',
    }
    setPresets((prev) => [...prev, clone])
    setSelectedPresetId(id)
    toast({ title: '프리셋 복제', description: `${clone.name}이 생성되었습니다.` })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>실시간 매칭 대기열</CardTitle>
            <p className="text-sm text-muted-foreground">
              세그먼트별 대기 시간과 이탈률을 확인해 운영자 투입 여부를 판단합니다.
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-h-[320px] overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">세그먼트</th>
                    <th className="px-4 py-2 font-medium">대기 인원</th>
                    <th className="px-4 py-2 font-medium">중앙값 대기</th>
                    <th className="px-4 py-2 font-medium">이탈률</th>
                  </tr>
                </thead>
                <tbody>
                  {QUEUE_STATS.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-4 py-2 font-semibold">{row.segment}</td>
                      <td className="px-4 py-2">{row.waiting.toLocaleString()}명</td>
                      <td className="px-4 py-2">{row.medianWait}</td>
                      <td className="px-4 py-2 text-red-600">{row.dropOffRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI 추천 가중치 프리셋</CardTitle>
            <p className="text-sm text-muted-foreground">
              거리·관심사·AI 적합도·최근 활동 비중을 조절해 매칭 품질을 실험합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-col gap-2 md:flex-row">
              <Select value={selectedPresetId} onValueChange={setSelectedPresetId}>
                <SelectTrigger className="md:w-[220px]">
                  <SelectValue placeholder="프리셋 선택" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name} {preset.isActive ? '(사용중)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={duplicatePreset}>
                  프리셋 복제
                </Button>
                <Button size="sm" variant="outline" onClick={() => selectedPresetId && activatePreset(selectedPresetId)}>
                  활성화
                </Button>
                <Button size="sm" onClick={savePreset}>
                  저장
                </Button>
              </div>
            </div>

            {selectedPreset ? (
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  [
                    { key: 'distance', label: '거리 가중치' },
                    { key: 'interest', label: '관심사 적합도' },
                    { key: 'aiAffinity', label: 'AI 추천 점수' },
                    { key: 'recency', label: '최근 활동' },
                  ] as const
                ).map((item) => (
                  <div key={item.key} className="space-y-2">
                    <Label>{item.label}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedPreset.weights[item.key]}
                      onChange={(event) => updatePresetWeight(item.key, Number(event.target.value) || 0)}
                    />
                  </div>
                ))}
                <div className="md:col-span-2 rounded-md border p-3 text-xs text-muted-foreground">
                  <p>작성자: {selectedPreset.author}</p>
                  <p>생성일: {selectedPreset.createdAt}</p>
                  <p>
                    총합: {Object.values(selectedPreset.weights).reduce((sum, curr) => sum + curr, 0)} (권장 100)
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">편집할 프리셋이 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>홈 탐색 빠른 필터</CardTitle>
            <p className="text-sm text-muted-foreground">
              탐색 화면의 2×4 슬롯을 구성해 실험별 노출 전략을 관리합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>라벨</Label>
                <Input
                  value={newFilter.label}
                  onChange={(event) => setNewFilter((prev) => ({ ...prev, label: event.target.value }))}
                  placeholder="예: 지금 대화하기"
                />
              </div>
              <div className="space-y-2">
                <Label>세그먼트</Label>
                <Select
                  value={newFilter.segment}
                  onValueChange={(value: QuickFilter['segment']) => setNewFilter((prev) => ({ ...prev, segment: value }))}
                >
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

            <div className="max-h-[280px] overflow-y-auto rounded-md border">
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
            <CardTitle>추천 풀 현황</CardTitle>
            <p className="text-sm text-muted-foreground">
              HOT/Hype/근접 등 추천 풀의 정렬 로직과 지표를 업데이트합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {pools.map((pool) => (
              <div key={pool.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{pool.title}</span>
                  <span className="text-muted-foreground">{pool.owner}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{pool.sortRule}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                    {pool.metrics}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updatePool(pool.id, { metrics: '업데이트 대기' })}
                  >
                    지표 새로고침
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>지역별 활성도 메모</CardTitle>
            <p className="text-sm text-muted-foreground">히트맵 운영 시 참고할 수 있는 지역별 활성 현황입니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="max-h-[220px] overflow-y-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">지역</th>
                    <th className="px-3 py-2 font-medium">활성 인원</th>
                    <th className="px-3 py-2 font-medium">플래그</th>
                    <th className="px-3 py-2 font-medium">추세</th>
                  </tr>
                </thead>
                <tbody>
                  {HEAT_REGIONS.map((region) => (
                    <tr key={region.id} className="border-t">
                      <td className="px-3 py-2 font-semibold">{region.name}</td>
                      <td className="px-3 py-2">{region.activeUsers.toLocaleString()}명</td>
                      <td className="px-3 py-2 text-red-600">{region.flagged}건</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {region.trend === 'UP' ? '상승' : region.trend === 'DOWN' ? '하락' : '유지'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Textarea
              value={heatSummaryMemo}
              onChange={(event) => setHeatSummaryMemo(event.target.value)}
              rows={3}
              placeholder="히트맵에 반영할 추가 메모를 남겨주세요."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
