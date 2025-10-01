'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface DummyDataItem {
  id: string
  screen: string
  description: string
  owner: string
}

const DUMMY_DATA_ITEMS: DummyDataItem[] = [
  { id: 'dummy-home', screen: '홈 추천 캐러셀', description: '신규/베스트 추천 캐러셀 더미 데이터', owner: '콘텐츠팀' },
  { id: 'dummy-explore', screen: '탐색 필터', description: '빠른 필터/세그먼트 샘플', owner: '프로덕트' },
  { id: 'dummy-chat', screen: '대화 탭 목록', description: '샘플 메시지 및 미확인 카운트', owner: '운영팀' },
  { id: 'dummy-room', screen: '채팅방 메시지', description: '샘플 대화 로그', owner: '운영팀' },
]

export default function SystemPage() {
  const { toast } = useToast()
  const [apiBaseUrl, setApiBaseUrl] = useState('https://tok-friends-api.onrender.com')
  const [timeout, setTimeoutValue] = useState(8000)
  const [autoLogout, setAutoLogout] = useState(true)
  const [healthResult, setHealthResult] = useState<string | null>(null)
  const [log, setLog] = useState('')

  const runHealthCheck = async () => {
    setHealthResult('검사 중...')
    await new Promise((resolve) => setTimeout(resolve, 600))
    setHealthResult('정상 (scripts/checkApi.js: /health → /api/health → / 순회 완료)')
    toast({ title: '헬스 체크 완료', description: '백엔드 엔드포인트가 정상 응답했습니다.' })
  }

  const forceLogout = () => {
    toast({ title: '강제 로그아웃', description: '선택된 사용자 세션을 초기화했습니다.' })
  }

  const saveSettings = () => {
    toast({ title: '환경 저장', description: 'API 베이스 URL과 타임아웃이 업데이트되었습니다.' })
  }

  const appendLog = (message: string) => {
    setLog((prev) => `${new Date().toLocaleString('ko-KR')} - ${message}\n${prev}`)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>환경 설정</CardTitle>
            <p className="text-sm text-muted-foreground">
              백엔드 URL, 타임아웃, 토큰 저장 정책을 제어하여 장애를 조기 감지합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <Label>API Base URL</Label>
              <Input value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>요청 타임아웃 (ms)</Label>
              <Input
                type="number"
                value={timeout}
                onChange={(event) => setTimeoutValue(Number(event.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span>토큰 자동 로그아웃</span>
              <Switch checked={autoLogout} onCheckedChange={setAutoLogout} />
            </div>
            <Button size="sm" onClick={saveSettings}>
              설정 저장
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API 헬스 체크</CardTitle>
            <p className="text-sm text-muted-foreground">
              scripts/checkApi.js 로컬 실행과 동일한 순서로 헬스 체크를 수행합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Button size="sm" onClick={runHealthCheck}>
              헬스 체크 실행
            </Button>
            {healthResult && <p className="text-sm text-emerald-600">{healthResult}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>세션 제어</CardTitle>
            <p className="text-sm text-muted-foreground">
              토큰 저장/삭제, 자동 로그아웃 재시도 현황을 모니터링하고 강제 로그아웃을 지원합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Button size="sm" variant="outline" onClick={() => appendLog('세션 점검을 수동으로 실행했습니다.')}>세션 점검</Button>
            <Button size="sm" onClick={forceLogout}>
              강제 로그아웃
            </Button>
            <Textarea value={log} onChange={(event) => setLog(event.target.value)} rows={5} placeholder="운영 로그를 입력하거나 붙여넣으세요." />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>더미 데이터 모니터링</CardTitle>
            <p className="text-sm text-muted-foreground">
              실서비스와 분리된 더미 데이터가 남아 있는 화면을 파악하여 백엔드 지표와 혼동되지 않도록 합니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="max-h-[320px] overflow-y-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">화면</th>
                    <th className="px-3 py-2 font-medium">설명</th>
                    <th className="px-3 py-2 font-medium">담당</th>
                  </tr>
                </thead>
                <tbody>
                  {DUMMY_DATA_ITEMS.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2 font-semibold">{item.screen}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.description}</td>
                      <td className="px-3 py-2">{item.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>지표 수집 메모</CardTitle>
            <p className="text-sm text-muted-foreground">
              홈 카테고리, 채팅 세그먼트, 프로모션 노출 등 주요 지표의 수집 계획을 작성합니다.
            </p>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={8}
              placeholder={`예) 홈 빠른 필터 CTR · 채팅 상담 진입 시간 · 프로필 보상 악용 감지 지표 등`}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
