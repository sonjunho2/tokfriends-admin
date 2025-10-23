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

interface MetricWidget {
  id: string
  name: string
  value: string
  delta: string
  description: string
  pinned: boolean
}

interface ReportJob {
  id: string
  name: string
  cadence: 'Daily' | 'Weekly' | 'Monthly'
  destination: 'Email' | 'Slack' | 'BigQuery'
  format: 'CSV' | 'XLSX' | 'Looker'
  active: boolean
}

interface ExportLog {
  id: string
  title: string
  generatedAt: string
  status: 'SUCCESS' | 'PENDING' | 'FAILED'
}

const INITIAL_METRICS: MetricWidget[] = [
  {
    id: 'metric-dau',
    name: 'DAU',
    value: '48,230',
    delta: '+6.2% vs LW',
    description: '일간 활성 사용자 (24시간)',
    pinned: true,
  },
  {
    id: 'metric-match',
    name: '매칭 성공률',
    value: '41%',
    delta: '+3.1pt',
    description: '매칭 후 24시간 내 1:1 채팅 시작 비율',
    pinned: true,
  },
  {
    id: 'metric-support',
    name: '지원 SLA',
    value: '18분',
    delta: '-5분',
    description: '최근 7일 문의 평균 응답 시간',
    pinned: false,
  },
  {
    id: 'metric-churn',
    name: '주간 이탈률',
    value: '8.4%',
    delta: '-0.6pt',
    description: '지난주 대비 잔존 변화',
    pinned: false,
  },
]

const INITIAL_JOBS: ReportJob[] = [
  { id: 'job-daily-kpi', name: 'Daily KPI Digest', cadence: 'Daily', destination: 'Slack', format: 'CSV', active: true },
  { id: 'job-weekly-cohort', name: 'Weekly Cohort', cadence: 'Weekly', destination: 'Email', format: 'XLSX', active: true },
  { id: 'job-monthly-revenue', name: 'Monthly Revenue Snapshot', cadence: 'Monthly', destination: 'BigQuery', format: 'Looker', active: false },
]

const INITIAL_EXPORT_LOG: ExportLog[] = [
  { id: 'exp-9001', title: 'Retention Cohort 2024-03-14', generatedAt: '2024-03-14 09:10', status: 'SUCCESS' },
  { id: 'exp-9002', title: 'Safety Incidents Breakdown', generatedAt: '2024-03-13 20:45', status: 'PENDING' },
]

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState(INITIAL_METRICS)
  const [jobs, setJobs] = useState(INITIAL_JOBS)
  const [selectedJobId, setSelectedJobId] = useState<string>(INITIAL_JOBS[0]?.id ?? '')
  const [exportLogs, setExportLogs] = useState(INITIAL_EXPORT_LOG)
  const [quickExport, setQuickExport] = useState({
    title: '',
    dimension: '',
    format: 'CSV',
    note: '',
  })

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) ?? null, [jobs, selectedJobId])

  const toggleMetricPin = (id: string) => {
    setMetrics((prev) => prev.map((metric) => (metric.id === id ? { ...metric, pinned: !metric.pinned } : metric)))
  }

  const toggleJobActive = (id: string) => {
    setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, active: !job.active } : job)))
  }

  const updateSelectedJob = (payload: Partial<ReportJob>) => {
    if (!selectedJob) return
    setJobs((prev) => prev.map((job) => (job.id === selectedJob.id ? { ...job, ...payload } : job)))
    toast({ title: '보고서 업데이트', description: `${selectedJob.name} 설정이 저장되었습니다.` })
  }

  const runQuickExport = () => {
    if (!quickExport.title.trim() || !quickExport.dimension.trim()) {
      toast({ title: '입력 오류', description: '제목과 Dimension을 입력해주세요.', variant: 'destructive' })
      return
    }
    const log: ExportLog = {
      id: `exp-${Date.now().toString(36)}`,
      title: quickExport.title,
      generatedAt: new Date().toLocaleString('ko-KR'),
      status: 'PENDING',
    }
    setExportLogs((prev) => [log, ...prev])
    toast({ title: '익스포트 요청', description: `${quickExport.dimension} 기준으로 ${quickExport.format} 추출을 시작했습니다.` })
    setQuickExport({ title: '', dimension: '', format: 'CSV', note: '' })
  }

  const addMetric = () => {
    const title = prompt('추가할 지표 이름을 입력하세요.')
    if (!title) return
    const metric: MetricWidget = {
      id: `metric-${Date.now().toString(36)}`,
      name: title,
      value: '-',
      delta: '측정중',
      description: '커스텀 지표',
      pinned: false,
    }
    setMetrics((prev) => [...prev, metric])
    toast({ title: '지표 추가', description: `${title} 지표가 위젯에 추가되었습니다.` })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>핵심 KPI 패널</CardTitle>
            <p className="text-sm text-muted-foreground">핀 고정된 지표는 대시보드 상단에 반영됩니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={addMetric}>
                지표 추가
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {metrics.map((metric) => (
                <div key={metric.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{metric.name}</p>
                      <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </div>
                    <Switch checked={metric.pinned} onCheckedChange={() => toggleMetricPin(metric.id)} />
                  </div>
                  <div className="mt-3 text-2xl font-semibold">{metric.value}</div>
                  <div className="text-xs text-emerald-600">{metric.delta}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>보고서 스케줄러</CardTitle>
            <p className="text-sm text-muted-foreground">코호트, 매칭 퍼널, 안전 지표를 자동으로 전달합니다.</p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="md:w-[240px]">
                <SelectValue placeholder="보고서 선택" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedJob ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>주기</Label>
                  <Select
                    value={selectedJob.cadence}
                    onValueChange={(value: ReportJob['cadence']) => updateSelectedJob({ cadence: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>전송 채널</Label>
                  <Select
                    value={selectedJob.destination}
                    onValueChange={(value: ReportJob['destination']) => updateSelectedJob({ destination: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Slack">Slack</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="BigQuery">BigQuery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>포맷</Label>
                  <Select
                    value={selectedJob.format}
                    onValueChange={(value: ReportJob['format']) => updateSelectedJob({ format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSV">CSV</SelectItem>
                      <SelectItem value="XLSX">XLSX</SelectItem>
                      <SelectItem value="Looker">Looker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>활성화</Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={selectedJob.active} onCheckedChange={() => toggleJobActive(selectedJob.id)} />
                    <span className="text-xs text-muted-foreground">{selectedJob.active ? '실행 중' : '일시 중지'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">편집할 보고서를 선택하세요.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>즉시 익스포트</CardTitle>
            <p className="text-sm text-muted-foreground">필요한 지표를 즉시 추출해 CSV/XLSX 파일로 저장합니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <Label>익스포트 제목</Label>
              <Input value={quickExport.title} onChange={(event) => setQuickExport((prev) => ({ ...prev, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Dimension</Label>
              <Input
                placeholder="예: region, ai_risk_level"
                value={quickExport.dimension}
                onChange={(event) => setQuickExport((prev) => ({ ...prev, dimension: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>포맷</Label>
              <Select value={quickExport.format} onValueChange={(value) => setQuickExport((prev) => ({ ...prev, format: value }))}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="XLSX">XLSX</SelectItem>
                  <SelectItem value="Looker">Looker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>메모</Label>
              <Textarea
                value={quickExport.note}
                onChange={(event) => setQuickExport((prev) => ({ ...prev, note: event.target.value }))}
                rows={3}
                placeholder="익스포트 목적이나 공유 대상 메모"
              />
            </div>
            <Button size="sm" onClick={runQuickExport}>
              익스포트 실행
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 생성된 리포트</CardTitle>
            <p className="text-sm text-muted-foreground">대시보드와 연동된 익스포트 로그를 확인합니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {exportLogs.map((log) => (
              <div key={log.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{log.generatedAt}</span>
                  <span className={log.status === 'SUCCESS' ? 'text-emerald-600' : log.status === 'FAILED' ? 'text-red-600' : ''}>
                    {log.status === 'SUCCESS' ? '완료' : log.status === 'FAILED' ? '실패' : '진행 중'}
                  </span>
                </div>
                <p className="mt-1 font-semibold text-foreground">{log.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast({ title: '리포트 열기', description: `${log.title} 다운로드를 시작합니다.` })}>
                    다운로드
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Slack 공유', description: 'Slack #analytics 채널로 공유했습니다.' })}>
                    Slack 공유
                  </Button>
                </div>
              </div>
            ))}
            {exportLogs.length === 0 && <p className="text-muted-foreground">최근 생성된 리포트가 없습니다.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
