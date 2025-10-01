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

interface PointPackage {
  id: string
  name: string
  amount: number
  price: number
  isRecommended: boolean
  badge?: string
}

interface PromotionSetting {
  id: string
  title: string
  description: string
  enabled: boolean
}

const INITIAL_PACKAGES: PointPackage[] = [
  { id: 'PKG-001', name: 'Starter 100P', amount: 100, price: 1200, isRecommended: false },
  { id: 'PKG-002', name: 'Standard 500P', amount: 500, price: 5500, isRecommended: true, badge: '추천' },
  { id: 'PKG-003', name: 'Boost 1,000P', amount: 1000, price: 9800, isRecommended: false },
]

const INITIAL_PROMOTIONS: PromotionSetting[] = [
  {
    id: 'PROMO-BANK',
    title: '무통장 1.5배 충전',
    description: '무통장 입금 시 50% 추가 포인트 지급',
    enabled: true,
  },
  {
    id: 'PROMO-PROFILE',
    title: '프로필 완성 30P',
    description: '프로필 사진과 소개 작성 시 즉시 30P 지급',
    enabled: true,
  },
  {
    id: 'PROMO-FREE',
    title: '무료 충전소',
    description: '일일 출석 및 광고 시청으로 최대 15P 지급',
    enabled: false,
  },
]

const BALANCE_OVERVIEW = {
  totalPoints: 18240000,
  firstMessageTickets: 4510,
  pendingOrders: 32,
}

export default function StorePage() {
  const { toast } = useToast()
  const [packages, setPackages] = useState(INITIAL_PACKAGES)
  const [promotions, setPromotions] = useState(INITIAL_PROMOTIONS)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [manualAdjustment, setManualAdjustment] = useState({ userId: '', type: 'GRANT', amount: 0, memo: '' })

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === selectedPackageId) ?? null,
    [packages, selectedPackageId]
  )

  const togglePromotion = (id: string) => {
    setPromotions((prev) =>
      prev.map((promotion) =>
        promotion.id === id ? { ...promotion, enabled: !promotion.enabled } : promotion
      )
    )
  }

  const updatePackage = (id: string, payload: Partial<PointPackage>) => {
    setPackages((prev) => prev.map((pkg) => (pkg.id === id ? { ...pkg, ...payload } : pkg)))
  }

  const addPackage = () => {
    const name = prompt('패키지 이름을 입력하세요.')
    if (!name) return
    const amount = Number(prompt('포인트 수량을 입력하세요.') ?? 0)
    const price = Number(prompt('판매 금액을 입력하세요.') ?? 0)
    const id = `PKG-${Math.floor(Math.random() * 900 + 100)}`
    setPackages((prev) => [...prev, { id, name, amount, price, isRecommended: false }])
    toast({ title: '패키지 추가', description: `${name} 패키지가 등록되었습니다.` })
  }

  const removePackage = (id: string) => {
    setPackages((prev) => prev.filter((item) => item.id !== id))
    if (selectedPackageId === id) setSelectedPackageId(null)
  }

  const submitManualAdjustment = () => {
    if (!manualAdjustment.userId || !manualAdjustment.amount) {
      toast({ title: '입력 오류', description: '사용자와 금액을 입력하세요.', variant: 'destructive' })
      return
    }
    toast({
      title: '지급/차감 처리',
      description: `${manualAdjustment.userId}님에게 ${
        manualAdjustment.type === 'GRANT' ? '지급' : '차감'
      } ${manualAdjustment.amount}P 처리 요청을 보냈습니다.`,
    })
    setManualAdjustment({ userId: '', type: 'GRANT', amount: 0, memo: '' })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>포인트 패키지</CardTitle>
            <p className="text-sm text-muted-foreground">
              상품 ID, 레이블, 가격, 추천 뱃지를 관리하고 노출 순서를 조정합니다. 결제는 준비 중이며 가상 데이터로 구성됩니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={addPackage}>
                패키지 추가
              </Button>
            </div>
            <div className="max-h-[360px] overflow-y-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">상품명</th>
                    <th className="px-3 py-2 font-medium">포인트</th>
                    <th className="px-3 py-2 font-medium">금액</th>
                    <th className="px-3 py-2 font-medium">추천</th>
                    <th className="px-3 py-2 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="border-t">
                      <td className="px-3 py-2 font-semibold">{pkg.name}</td>
                      <td className="px-3 py-2">{pkg.amount.toLocaleString()}P</td>
                      <td className="px-3 py-2">₩{pkg.price.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <Switch
                          checked={pkg.isRecommended}
                          onCheckedChange={(checked) => updatePackage(pkg.id, { isRecommended: checked })}
                        />
                        {pkg.badge && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                            {pkg.badge}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 space-x-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedPackageId(pkg.id)}>
                          편집
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => removePackage(pkg.id)}>
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {packages.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                        등록된 패키지가 없습니다.
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
            <CardTitle>프로모션 설정</CardTitle>
            <p className="text-sm text-muted-foreground">
              무통장 1.5배 혜택, 무료 충전소, 프로필 보상 등 지급 규칙을 제어합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {promotions.map((promotion) => (
              <div key={promotion.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{promotion.title}</p>
                    <p className="text-xs text-muted-foreground">{promotion.description}</p>
                  </div>
                  <Switch checked={promotion.enabled} onCheckedChange={() => togglePromotion(promotion.id)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>사용자 포인트 조정</CardTitle>
            <p className="text-sm text-muted-foreground">
              고객 문의에 따라 포인트 잔액과 첫 메시지 이용권을 조정하고 지급/차감 이력을 남깁니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>사용자 ID 또는 이메일</Label>
                <Input
                  value={manualAdjustment.userId}
                  onChange={(event) => setManualAdjustment((prev) => ({ ...prev, userId: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>처리 유형</Label>
                <Select
                  value={manualAdjustment.type}
                  onValueChange={(value: 'GRANT' | 'DEDUCT') =>
                    setManualAdjustment((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GRANT">지급</SelectItem>
                    <SelectItem value="DEDUCT">차감</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>포인트</Label>
                <Input
                  type="number"
                  value={manualAdjustment.amount || ''}
                  onChange={(event) =>
                    setManualAdjustment((prev) => ({ ...prev, amount: Number(event.target.value) }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>메모</Label>
                <Textarea
                  value={manualAdjustment.memo}
                  onChange={(event) => setManualAdjustment((prev) => ({ ...prev, memo: event.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <Button size="sm" onClick={submitManualAdjustment}>
              지급/차감 요청
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>포인트 잔액 및 이용권 현황</CardTitle>
            <p className="text-sm text-muted-foreground">
              실 서비스 연결 전까지 더미 데이터를 사용하며, 추후 백엔드 연동 시 실시간 잔액으로 대체합니다.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">전체 포인트 잔액</p>
              <p className="mt-2 text-2xl font-semibold">{BALANCE_OVERVIEW.totalPoints.toLocaleString()}P</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">첫 메시지 이용권 잔량</p>
              <p className="mt-2 text-2xl font-semibold">{BALANCE_OVERVIEW.firstMessageTickets.toLocaleString()}장</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">결제 준비 중 주문</p>
              <p className="mt-2 text-2xl font-semibold">{BALANCE_OVERVIEW.pendingOrders}건</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>선택한 패키지 상세</CardTitle>
            <p className="text-sm text-muted-foreground">
              레이블, 뱃지, 가격 정보를 편집하고 노출 순서를 조정합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {selectedPackage ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>상품명</Label>
                    <Input
                      value={selectedPackage.name}
                      onChange={(event) => updatePackage(selectedPackage.id, { name: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>포인트</Label>
                    <Input
                      type="number"
                      value={selectedPackage.amount}
                      onChange={(event) => updatePackage(selectedPackage.id, { amount: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>가격</Label>
                    <Input
                      type="number"
                      value={selectedPackage.price}
                      onChange={(event) => updatePackage(selectedPackage.id, { price: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>추천 뱃지</Label>
                    <Input
                      value={selectedPackage.badge ?? ''}
                      onChange={(event) => updatePackage(selectedPackage.id, { badge: event.target.value })}
                      placeholder="예: 추천"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => toast({ title: '저장 완료', description: '패키지 정보가 업데이트되었습니다.' })}>
                    수정 내용 저장
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedPackageId(null)}>
                    선택 취소
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">좌측 목록에서 패키지를 선택하세요.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
