'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface TeamMember {
  id: string
  email: string
  role: 'Super Admin' | 'Customer Support' | 'Safety Moderator' | 'Operations Manager'
  status: '활성' | '일시중지'
  twoFactor: boolean
}

interface FeatureFlag {
  id: string
  name: string
  description: string
  environment: 'dev' | 'stage' | 'prod'
  enabled: boolean
}

interface IntegrationSetting {
  id: string
  label: string
  value: string
  placeholder: string
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: 'team-1', email: 'admin@tokfriends.com', role: 'Super Admin', status: '활성', twoFactor: true },
  { id: 'team-2', email: 'support@tokfriends.com', role: 'Customer Support', status: '활성', twoFactor: true },
  { id: 'team-3', email: 'safety@tokfriends.com', role: 'Safety Moderator', status: '활성', twoFactor: false },
]

const INITIAL_FLAGS: FeatureFlag[] = [
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
]

const INITIAL_INTEGRATIONS: IntegrationSetting[] = [
  { id: 'integration-push', label: 'FCM Server Key', value: 'AIzaSy***', placeholder: 'FCM 키 입력' },
  { id: 'integration-sentry', label: 'Sentry DSN', value: 'https://example@sentry.io/123', placeholder: 'Sentry DSN' },
  { id: 'integration-openai', label: 'OpenAI API Key', value: '', placeholder: 'sk-...' },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const [members, setMembers] = useState(TEAM_MEMBERS)
  const [flags, setFlags] = useState(INITIAL_FLAGS)
  const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS)
  const [inviteEmail, setInviteEmail] = useState('')
  const [auditLog, setAuditLog] = useState('')

  const inviteMember = () => {
    if (!inviteEmail.trim()) {
      toast({ title: '이메일 필요', description: '초대할 이메일을 입력하세요.', variant: 'destructive' })
      return
    }
    setMembers((prev) => [
      ...prev,
      { id: `team-${Date.now().toString(36)}`, email: inviteEmail.trim(), role: 'Customer Support', status: '활성', twoFactor: false },
    ])
    setInviteEmail('')
    toast({ title: '초대 전송', description: '새로운 팀원 초대 이메일을 발송했습니다.' })
  }

  const toggleTwoFactor = (id: string) => {
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, twoFactor: !member.twoFactor } : member)))
  }

  const updateMemberRole = (id: string, role: TeamMember['role']) => {
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, role } : member)))
  }

  const updateMemberStatus = (id: string, status: TeamMember['status']) => {
    setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, status } : member)))
  }

  const toggleFlag = (id: string) => {
    setFlags((prev) => prev.map((flag) => (flag.id === id ? { ...flag, enabled: !flag.enabled } : flag)))
  }

  const updateIntegration = (id: string, value: string) => {
    setIntegrations((prev) => prev.map((integration) => (integration.id === id ? { ...integration, value } : integration)))
  }

  const saveIntegrations = () => {
    toast({ title: '통합 설정 저장', description: '외부 서비스 API 키가 업데이트되었습니다.' })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[2fr_3fr]">
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>팀 관리 & 권한</CardTitle>
            <p className="text-sm text-muted-foreground">역할, 상태, 2FA 여부를 관리하고 신규 팀원을 초대합니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                placeholder="team@tokfriends.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
              <Button size="sm" onClick={inviteMember}>
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
                      <td className="px-3 py-2 font-semibold">{member.email}</td>
                      <td className="px-3 py-2">
                        <Select value={member.role} onValueChange={(value: TeamMember['role']) => updateMemberRole(member.id, value)}>
                          <SelectTrigger className="w-[190px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Super Admin">Super Admin</SelectItem>
                            <SelectItem value="Customer Support">Customer Support</SelectItem>
                            <SelectItem value="Safety Moderator">Safety Moderator</SelectItem>
                            <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <Select value={member.status} onValueChange={(value: TeamMember['status']) => updateMemberStatus(member.id, value)}>
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
                        <Switch checked={member.twoFactor} onCheckedChange={() => toggleTwoFactor(member.id)} />
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAuditLog('')
                toast({ title: '메모 저장', description: '감사 로그 메모가 저장되었습니다.' })
              }}
            >
              메모 저장
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>기능 플래그</CardTitle>
            <p className="text-sm text-muted-foreground">환경별 실험을 제어하고 배포 전후를 관리합니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {flags.map((flag) => (
              <div key={flag.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{flag.name}</p>
                    <p className="text-xs text-muted-foreground">{flag.description}</p>
                    <p className="text-xs text-muted-foreground">환경: {flag.environment}</p>
                  </div>
                  <Switch checked={flag.enabled} onCheckedChange={() => toggleFlag(flag.id)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>통합 설정</CardTitle>
            <p className="text-sm text-muted-foreground">외부 서비스 API 키와 엔드포인트를 관리합니다.</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {integrations.map((integration) => (
              <div key={integration.id} className="space-y-2">
                <Label>{integration.label}</Label>
                <Input
                  placeholder={integration.placeholder}
                  value={integration.value}
                  onChange={(event) => updateIntegration(integration.id, event.target.value)}
                />
              </div>
            ))}
            <Button size="sm" onClick={saveIntegrations}>
              저장
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
