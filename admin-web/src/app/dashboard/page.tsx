'use client'

import { useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const METRIC_SECTIONS = [
  {
    title: '사용자 운영',
    description:
      '활성 사용자 풀, 신규 가입, 제재/해제 현황을 통해 고객 지원 대기열을 예측합니다.',
    metrics: [
      { label: '24시간 활성', value: '48,230명', hint: '로그인 + 위치 업데이트 기준' },
      { label: '신규 가입', value: '+1,284', hint: '전일 대비 증감 +6.2%' },
      { label: '제재 중 계정', value: '312', hint: '자동 정책 58, 운영자 수동 254' },
    ],
  },
  {
    title: '매칭 & 탐색',
    description: '대기열 지연, AI 추천 품질, 위치 히트맵을 점검합니다.',
    metrics: [
      { label: '평균 매칭 대기', value: '42초', hint: '서울/경기 주요 클러스터 기준' },
      { label: 'AI 추천 적중률', value: '74%', hint: '1시간 내 채팅 시작 비율' },
      { label: '플레이스 홀더 지역', value: '3곳', hint: '데이터 수집 필요 지역' },
    ],
  },
  {
    title: '채팅 & 안전',
    description: '실시간 방, 신고 처리 SLA, 정책 자동화를 추적합니다.',
    metrics: [
      { label: '활성 채팅방', value: '612', hint: '현재 열려있는 1:1 대화' },
      { label: '미처리 신고', value: '37건', hint: '24시간 SLA 92% 달성' },
      { label: '자동 제재 성공률', value: '88%', hint: '키워드/반복 위반 탐지' },
    ],
  },
  {
    title: '콘텐츠 & 참여',
    description: '캠페인, 공지, FAQ 운영 지표를 살펴봅니다.',
    metrics: [
      { label: '발송 중 캠페인', value: '5건', hint: '세그먼트 타겟팅 포함' },
      { label: '공지 노출', value: '11개', hint: '홈/마이페이지 활성 상태' },
      { label: 'FAQ 해결률', value: '93%', hint: '최근 7일 문의 대비' },
    ],
  },
  {
    title: '분석 & 리포트',
    description: '핵심 KPI, 코호트, ARPPU/Retention 추이를 모니터링합니다.',
    metrics: [
      { label: 'DAU/MAU', value: '32%', hint: '전월 대비 +2.4pt' },
      { label: '7일 잔존', value: '41%', hint: '신규 cohort 2024-03-08' },
      { label: '지원 SLA', value: '18분', hint: '중앙 응답 소요 시간' },
    ],
  },
  {
    title: '설정 & 인프라',
    description: '관리자 권한, 기능 플래그, API 상태를 추적합니다.',
    metrics: [
      { label: '활성 운영자', value: '28명', hint: 'SSO + 2FA 적용' },
      { label: '플래그 변경', value: '3건', hint: '오늘 배포 대비 롤백 없음' },
      { label: 'API 오류율', value: '0.42%', hint: 'admin 네임스페이스 기준' },
    ],
  },
] as const

const ACTION_ITEMS = [
  {
    title: '사용자 케이스 조사',
    body: '프로필 제재, 환불, VIP 태깅 등 사용자 케이스를 빠르게 확인하고 대응하세요.',
    link: { href: '/users', label: '사용자 모듈 열기' },
  },
  {
    title: '매칭 전략 튜닝',
    body: '대기열 병목, 추천 가중치, 위치 기반 히트맵을 점검하여 매칭 효율을 높입니다.',
    link: { href: '/matches', label: '매칭 & 탐색으로 이동' },
  },
  {
    title: '채팅 & 안전 모니터링',
    body: '실시간 신고 큐, 메시지 로그, 자동 제재 규칙을 검토해 안전 이슈를 예방하세요.',
    link: { href: '/chats', label: '채팅 & 안전 열기' },
  },
  {
    title: '캠페인 운영',
    body: '공지/푸시 캠페인을 작성하고 성과 지표를 추적합니다. A/B 테스트도 지원 예정입니다.',
    link: { href: '/content', label: '콘텐츠 & 참여로 이동' },
  },
  {
    title: '지표 분석 & 익스포트',
    body: '코호트 차트, 매칭 퍼널, 지원 SLA를 확인하고 CSV/BigQuery로 내보내세요.',
    link: { href: '/analytics', label: '분석 & 리포트 보기' },
  },
  {
    title: '플랫폼 설정',
    body: '팀 권한, 기능 플래그, 외부 통합 키를 관리하고 배포 이력을 추적합니다.',
    link: { href: '/settings', label: '설정으로 이동' },
  },
] as const

export default function DashboardPage() {
  const totalCards = useMemo(() => METRIC_SECTIONS.length, [])

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {METRIC_SECTIONS.map((section) => (
          <Card key={section.title} className="flex flex-col">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>
            </CardHeader>
            <CardContent className="mt-auto grid gap-2">
              {section.metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{metric.label}</span>
                    <span className="text-lg font-semibold">{metric.value}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>주요 업무 바로가기</CardTitle>
            <p className="text-sm text-muted-foreground">
              사용자, 매칭, 채팅, 콘텐츠, 분석, 설정 등 {totalCards}개 모듈의 핵심 화면으로 바로 이동합니다.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ACTION_ITEMS.map((item) => (
              <div key={item.title} className="rounded-lg border p-4">
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                <a className="mt-4 inline-flex text-sm font-medium text-primary hover:underline" href={item.link.href}>
                  {item.link.label}
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
