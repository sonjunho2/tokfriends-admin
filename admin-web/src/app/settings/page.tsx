'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  getAdminSettingsSnapshot,
  inviteAdminTeamMember,
  saveAdminAuditMemo,
  updateAdminFeatureFlag,
  updateAdminIntegrationSetting,
  updateAdminTeamMember,
  type AdminFeatureFlag,
  type AdminIntegrationSetting,
  type AdminSettingsSnapshot,
  type AdminTeamMember,
} from '@/lib/api'
import type { AxiosError } from 'axios'

const FALLBACK_SETTINGS: AdminSettingsSnapshot = {
  members: [
    { id: 'team-1', email: 'admin@tokfriends.com', role: 'Super Admin', status: '활성', twoFactor: true },
    { id: 'team-2', email: 'support@tokfriends.com', role: 'Customer Support', status: '활성', twoFactor: true },
    { id: 'team-3', email: 'safety@tokfriends.com', role: 'Safety Moderator', status: '활성', twoFactor: false },
  ],
  featureFlags: [
    {
      id: 'flag-new-matching',
      name: 'matching.nextPreset',
      description: '신규 AI 추천 프리셋 롤아웃',
      environment: 'stage',
      enabled: true,
    },
    {
      id: 'flag-chat-audit',
      name: 'chat.auditLog',
      description: '채팅 감사 로그 상세보기',
      environment: 'prod',
      enabled: true,
    },
    {
      id: 'flag-campaign-builder',
      name: 'engagement.builder',
      description: '푸시 캠페인 빌더 베타',
      environment: 'dev',
      enabled: false,
    },
  ],
  integrations: [
    { id: 'integration-push', label: 'FCM Server Key', value: 'AIzaSy***', placeholder: 'FCM 키 입력' },
    { id: 'integration-sentry', label: 'Sentry DSN', value: 'https://example@sentry.io/123', placeholder: 'Sentry DSN' },
    { id: 'integration-openai', label: 'OpenAI API Key', value: '', placeholder: 'sk-...' },
  ],
  auditMemo: '',
}

export default function SettingsPage() {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState<AdminTeamMember[]>(FALLBACK_SETTINGS.members)
  const [flags, setFlags] = useState<AdminFeatureFlag[]>(FALLBACK_SETTINGS.featureFlags)
  const [integrations, setIntegrations] = useState<AdminIntegrationSetting[]>(FALLBACK_SETTINGS.integrations)
  const [inviteEmail, setInviteEmail] = useState('')
  const [auditLog, setAuditLog] = useState(FALLBACK_SETTINGS.auditMemo ?? '')
  const [initialAuditLog, setInitialAuditLog] = useState(FALLBACK_SETTINGS.auditMemo ?? '')

  const [savingMemberId, setSavingMemberId] = useState<string | null>(null)
  const [savingFlagId, setSavingFlagId] = useState<string | null>(null)
  const [savingIntegrationId, setSavingIntegrationId] = useState<string | null>(null)
  const [savingAuditLog, setSavingAuditLog] = useState(false)

  const teamRoles = useMemo(
    () => ['Super Admin', 'Customer Support', 'Safety Moderator', 'Operations Manager'] as const,
    []
  )

  useEffect(() => {
    void loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSettings() {
    setIsLoading(true)
    try {
      const snapshot = await getAdminSettingsSnapshot()
      setMembers(snapshot.members.length > 0 ? snapshot.members : FALLBACK_SETTINGS.members)
      setFlags(snapshot.featureFlags.length > 0 ? snapshot.featureFlags : FALLBACK_SETTINGS.featureFlags)
      setIntegrations(snapshot.integrations.length > 0 ? snapshot.integrations : FALLBACK_SETTINGS.integrations)
      setAuditLog(snapshot.auditMemo ?? '')
      setInitialAuditLog(snapshot.auditMemo ?? '')
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message =
        (ax?.response?.data as any)?.message || ax?.message || '설정 정보를 불러오지 못했습니다. 기본 예시를 보여드립니다.'
      toast({
        title: '설정 데이터 불러오기 실패',
        description: Array.isArray(message) ? message.join(', ') : String(message),
        variant: 'destructive',
      })
      setMembers(FALLBACK_SETTINGS.members)
      setFlags(FALLBACK_SETTINGS.featureFlags)
      setIntegrations(FALLBACK_SETTINGS.integrations)
      setAuditLog(FALLBACK_SETTINGS.auditMemo ?? '')
      setInitialAuditLog(FALLBACK_SETTINGS.auditMemo ?? '')
    } finally {
      setIsLoading(false)
    }
  }

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: '이메일 필요', description: '초대할 이메일을 입력하세요.', variant: 'destructive' })
      return
    }
    setSavingMemberId('invite')
    try {
      const created = await inviteAdminTeamMember({ email: inviteEmail.trim() })
      setMembers((prev) => [created, ...prev])
      setInviteEmail('')
      toast({ title: '초대 전송', description: `${created.email ?? '새 운영자'}에게 초대 메일을 발송했습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '초대 메일을 발송하지 못했습니다.'
      toast({ title: '초대 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMemberId(null)
    }
  }

  const updateMemberRole = async (id: string, role: AdminTeamMember['role']) => {
    setSavingMemberId(id)
    try {
      const updated = await updateAdminTeamMember(id, { role })
      setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updated } : member)))
      toast({ title: '역할 변경', description: `${updated.email ?? '팀원'}의 역할을 ${updated.role}로 저장했습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '역할을 변경하지 못했습니다.'
      toast({ title: '역할 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMemberId(null)
    }
  }

  const updateMemberStatus = async (id: string, status: AdminTeamMember['status']) => {
    setSavingMemberId(id)
    try {
      const updated = await updateAdminTeamMember(id, { status })
      setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updated } : member)))
      toast({ title: '상태 변경', description: `${updated.email ?? '팀원'}의 상태를 ${updated.status}로 저장했습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '상태를 변경하지 못했습니다.'
      toast({ title: '상태 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMemberId(null)
    }
  }

  const toggleTwoFactor = async (id: string, enabled: boolean) => {
    setSavingMemberId(id)
    try {
      const updated = await updateAdminTeamMember(id, { twoFactor: enabled })
      setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updated } : member)))
      toast({
        title: '2단계 인증 업데이트',
        description: `${updated.email ?? '팀원'}의 2FA 설정이 ${updated.twoFactor ? '활성화' : '비활성화'}되었습니다.`,
      })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '2FA 상태를 변경하지 못했습니다.'
      toast({ title: '2FA 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingMemberId(null)
    }
  }

  const toggleFlag = async (id: string, enabled: boolean) => {
    setSavingFlagId(id)
    try {
      const updated = await updateAdminFeatureFlag(id, { enabled })
      setFlags((prev) => prev.map((flag) => (flag.id === id ? { ...flag, ...updated } : flag)))
      toast({ title: '기능 플래그 변경', description: `${updated.name ?? '플래그'} 상태가 업데이트되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '플래그 상태를 변경하지 못했습니다.'
      toast({ title: '플래그 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingFlagId(null)
    }
  }

  const updateIntegration = async (id: string, value: string) => {
    setIntegrations((prev) => prev.map((integration) => (integration.id === id ? { ...integration, value } : integration)))
    setSavingIntegrationId(id)
    try {
      const updated = await updateAdminIntegrationSetting(id, { value })
      setIntegrations((prev) => prev.map((integration) => (integration.id === id ? { ...integration, ...updated } : integration)))
      toast({ title: '통합 설정 저장', description: `${updated.label ?? '연동'} 정보가 저장되었습니다.` })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '통합 설정을 저장하지 못했습니다.'
      toast({ title: '통합 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingIntegrationId(null)
    }
  }

  const saveIntegrations = async () => {
    setSavingIntegrationId('bulk')
    try {
      await Promise.all(
        integrations.map((integration) => updateAdminIntegrationSetting(integration.id, { value: integration.value ?? '' }))
      )
      toast({ title: '통합 설정 일괄 저장', description: '모든 외부 서비스 키가 최신 상태로 저장되었습니다.' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '통합 정보를 일괄 저장하지 못했습니다.'
      toast({ title: '일괄 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingIntegrationId(null)
    }
  }

  const saveAuditLog = async () => {
    if (auditLog.trim() === initialAuditLog.trim()) {
      toast({ title: '변경 사항 없음', description: '새로운 메모가 없어 저장하지 않았습니다.' })
      return
    }
    setSavingAuditLog(true)
    try {
      const saved = await saveAdminAuditMemo({ memo: auditLog })
      setInitialAuditLog(saved ?? '')
      toast({ title: '감사 메모 저장', description: '변경 사항을 기록했습니다.' })
    } catch (error) {
      const ax = error as AxiosError | undefined
      const message = (ax?.response?.data as any)?.message || ax?.message || '감사 메모를 저장하지 못했습니다.'
      toast({ title: '감사 메모 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
    } finally {
      setSavingAuditLog(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>팀 관리 & 권한</CardTitle>
              <p className="text-sm text-muted-foreground">역할, 상태, 2FA 여부를 관리하고 신규 팀원을 초대합니다.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void loadSettings()} disabled={isLoading}>
              새로고침
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                placeholder="team@tokfriends.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
              <Button size="sm" onClick={() => void inviteMember()} disabled={savingMemberId === 'invite'}>
                초대 전송
              </Button>
            </div>

            <div className="max-h-[320px] overflow-y-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">이메일</th>
                    <th className="px-3 py-2 font-medium">역할</th>
                    <th className="px-3 py-2 font-medium">상태</th>
                    <th className="px-3 py-2 font-medium">2FA</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-t">
                      <td className="px-3 py-2 font-semibold">{member.email ?? '이메일 미등록'}</td>
                      <td className="px-3 py-2">
                        <Select
                          value={member.role ?? ''}
                          onValueChange={(value: AdminTeamMember['role']) => void updateMemberRole(member.id, value)}
                          disabled={savingMemberId === member.id}
                        >
                          <SelectTrigger className="w-[190px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {teamRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={member.status ?? '활성'}
                          onValueChange={(value: AdminTeamMember['status']) => void updateMemberStatus(member.id, value)}
                          disabled={savingMemberId === member.id}
                        >
                          <SelectTrigger className="w-[120px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="활성">활성</SelectItem>
                            <SelectItem value="일시중지">일시중지</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <Switch
                          checked={Boolean(member.twoFactor)}
                          disabled={savingMemberId === member.id}
                          onCheckedChange={(value) => void toggleTwoFactor(member.id, value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>감사 로그 메모</CardTitle>
            <p className="text-sm text-muted-foreground">권한 변경이나 플래그 조정 시 메모를 남겨두세요.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Textarea
              value={auditLog}
              onChange={(event) => setAuditLog(event.target.value)}
              rows={4}
              placeholder="예: 2024-03-14 운영자 role 변경, 보안팀 승인 등"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void saveAuditLog()} disabled={savingAuditLog}>
                {savingAuditLog ? '저장 중…' : '감사 메모 저장'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAuditLog(initialAuditLog)
                }}
              >
                되돌리기
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>기능 플래그</CardTitle>
            <p className="text-sm text-muted-foreground">
              환경별 기능 활성 여부를 토글하면 즉시 API에 반영되어 배포 팀이 한눈에 확인할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {flags.map((flag) => (
              <div key={flag.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{flag.name ?? '플래그'}</p>
                    <p className="text-xs text-muted-foreground">{flag.description ?? '설명이 등록되지 않았습니다.'}</p>
                    <p className="text-xs text-muted-foreground">환경: {flag.environment ?? '-'}</p>
                  </div>
                  <Switch
                    checked={Boolean(flag.enabled)}
                    disabled={savingFlagId === flag.id}
                    onCheckedChange={(value) => void toggleFlag(flag.id, value)}
                  />
                </div>
              </div>
            ))}
            {flags.length === 0 && <p className="text-muted-foreground">등록된 기능 플래그가 없습니다.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>외부 서비스 연동</CardTitle>
            <p className="text-sm text-muted-foreground">
              푸시·모니터링·AI 키를 관리합니다. 값을 입력하면 자동으로 저장되며, 필요 시 일괄 저장 버튼으로 다시 동기화할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div key={integration.id} className="space-y-2">
                  <Label>{integration.label ?? integration.id}</Label>
                  <Input
                    value={integration.value ?? ''}
                    placeholder={integration.placeholder ?? ''}
                    onChange={(event) => void updateIntegration(integration.id, event.target.value)}
                    disabled={savingIntegrationId === integration.id}
                  />
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={() => void saveIntegrations()} disabled={savingIntegrationId === 'bulk'}>
              일괄 저장
            </Button>
            <Button asChild size="sm" variant="link">
              <Link href="/settings/legal">약관 및 정책 문서 관리로 이동</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
