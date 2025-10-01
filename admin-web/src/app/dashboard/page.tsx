'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const METRIC_SECTIONS = [
  {
    title: '인증 · 온보딩',
    description:
      'AuthProvider 토큰 복원, HAS_ACCOUNT 플래그, 온보딩 보상(30분 내 프로필 50P / 사진·프로필 30P) 진행 현황을 확인합니다.',
    metrics: [
      { label: '총 가입자', value: '48,230', hint: '이메일 로그인 완료 사용자 수' },
      { label: '자동 로그인 성공률', value: '92%', hint: '환영 화면에서 토큰 복원 성공 비율' },
      { label: '프로필 보상 지급', value: '1,214건', hint: '최근 7일 내 지급' },
    ],
  },
  {
    title: '채팅 · 커뮤니티 운영',
    description:
      '전체/읽지 않음/신규/즐겨찾기 세그먼트, 방 만들기 폴백, 신고/차단 요청 집계와 상담사 진입 현황을 모니터링합니다.',
    metrics: [
      { label: '미확인 신고', value: '37', hint: '신고 API 연동 필요 건' },
      { label: '폴백 생성된 방', value: '12', hint: 'API 실패로 로컬 생성된 채팅방' },
      { label: '실시간 상담 중', value: '8', hint: '운영자가 직접 채팅 참여 중인 방 수' },
    ],
  },
  {
    title: '탐색 · 추천',
    description:
      '빠른 필터, HOT 추천, 접속 중, 지역/거리 기반 추천 풀을 구성하고, 더미 데이터를 실제 백엔드 지표로 대체합니다.',
    metrics: [
      { label: '빠른 필터 정의', value: '12개', hint: '홈 2×4 필터 슬롯' },
      { label: '추천 풀 커버리지', value: '86%', hint: '활성 사용자 대비 추천 노출률' },
      { label: '검증된 위치 데이터', value: '1,540건', hint: '표본 추출로 검증 완료' },
    ],
  },
  {
    title: '상점 · 포인트',
    description:
      '포인트 패키지, 1.5배 프로모션, 무료 충전소, 첫 메시지 이용권을 설정하고 지급/차감 이력을 추적합니다.',
    metrics: [
      { label: '총 포인트 잔액', value: '18,240,000P', hint: '전 사용자 보유 합계' },
      { label: '무통장 1.5배 이용', value: '312건', hint: '이번 달 주문' },
      { label: '첫 메시지 이용권 발급', value: '4,510장', hint: '누적 발급' },
    ],
  },
  {
    title: '고객 지원 · 알림',
    description:
      '공지 카드, 알림 센터, 1:1 문의, 비밀번호 찾기 대응 프로세스를 통합 관리합니다.',
    metrics: [
      { label: '활성 공지', value: '9건', hint: '홈/마이페이지 노출 중' },
      { label: '미처리 1:1 문의', value: '23건', hint: '상담 대기' },
      { label: '딥링크 가이드', value: '18개', hint: '고객 문의 대응용' },
    ],
  },
  {
    title: '시스템 · 분석',
    description:
      'API 헬스 체크, 토큰 갱신, 더미 데이터 교체 대상 모니터링으로 장애를 예방합니다.',
    metrics: [
      { label: '헬스 체크 성공률', value: '99.2%', hint: 'scripts/checkApi.js 실행 결과' },
      { label: '강제 로그아웃 처리', value: '42건', hint: '최근 30일' },
      { label: '더미 데이터 잔존 화면', value: '4개', hint: '교체 필요 섹션 수' },
    ],
  },
]

const ACTION_ITEMS = [
  {
    title: '온보딩 플로우',
    body:
      '환영 화면 자동 로그인 분기, 이메일·비밀번호 검증, 필수 약관 수집, 프로필 입력, 가입 후 자동 로그인까지 단계별로 현황을 추적합니다.',
    link: { href: '/onboarding', label: '온보딩 관리로 이동' },
  },
  {
    title: '채팅 운영',
    body:
      '탭바가 숨겨지는 채팅방 UI, 신고 모달, 방 만들기 폴백 등 현재 더미 메시지를 대체할 API 연결 상태를 점검합니다.',
    link: { href: '/chat-ops', label: '채팅 운영으로 이동' },
  },
  {
    title: '추천 풀 설정',
    body: '홈 빠른 필터와 HOT 추천 풀을 구성하고 성과 지표를 수집합니다.',
    link: { href: '/content', label: '탐색·추천 설정으로 이동' },
  },
  {
    title: '포인트 상점',
    body: '포인트 패키지, 프로모션 문구, 지급 규칙을 구성합니다.',
    link: { href: '/store', label: '상점 관리로 이동' },
  },
  {
    title: '공지·지원 센터',
    body: '마이페이지 바로가기, 공지, 문의 대응 프로세스를 관리합니다.',
    link: { href: '/support', label: '고객 지원으로 이동' },
  },
  {
    title: '시스템 진단',
    body: '환경 설정, 토큰 재발급, 더미 데이터 모니터링을 확인합니다.',
    link: { href: '/system', label: '시스템 모니터링으로 이동' },
  },
]

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
              온보딩, 채팅 운영, 추천, 상점, 고객 지원, 시스템 모니터링 등 {totalCards}개 축의 핵심 기능을 빠르게 이동합니다.
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
      </div>
    </div>
  )
}
