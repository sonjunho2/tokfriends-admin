'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import {
  createAdminTeamMember,
  deleteAdminTeamMember,
  getAdminSettingsSnapshot,
  saveAdminAuditMemo,
  updateAdminFeatureFlag,
  updateAdminIntegrationSetting,
  updateAdminTeamMember,
  updateAdminTeamMemberPassword,
  type AdminFeatureFlag,
  type AdminIntegrationSetting,
  type AdminSettingsSnapshot,
  type AdminTeamMember,
} from '@/lib/api'
import { AdminAuthError, ensureDefaultSuperAdminAccount, listAdminAccounts } from '@/lib/admin-auth'
import type { AxiosError } from 'axios'

const FALLBACK_SETTINGS: AdminSettingsSnapshot = {
  members: [],  members: [],
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

const PERMISSION_HINT = 'users.manage, reports.view'

function mapAccountsToMembers(accounts: ReturnType<typeof listAdminAccounts>): AdminTeamMember[] {
  return accounts.map((account) => ({
    id: account.id,
    email: account.email,
    username: account.username,
    name: account.name,
    role: account.role,
    status: account.status,
    twoFactor: account.twoFactorEnabled,
    permissions: [...account.permissions],
    lastLoginAt: account.lastLoginAt,
  }))
}

function parsePermissionInput(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input.map((value) => value.trim()).filter((value) => value.length > 0)
  }
  return input
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

function formatDateTime(value?: string) {
  if (!value) return '기록 없음'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '기록 없음'
  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function SettingsPage() {
  const { toast } = useToast()

    const defaultMembers = useMemo(() => {
    ensureDefaultSuperAdminAccount()
    return mapAccountsToMembers(listAdminAccounts())
  }, [])

  const defaultPermissionText = PERMISSION_HINT

  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState<AdminTeamMember[]>(defaultMembers)
  const [flags, setFlags] = useState<AdminFeatureFlag[]>(FALLBACK_SETTINGS.featureFlags)
  const [integrations, setIntegrations] = useState<AdminIntegrationSetting[]>(FALLBACK_SETTINGS.integrations)
  const [auditLog, setAuditLog] = useState(FALLBACK_SETTINGS.auditMemo ?? '')
  const [initialAuditLog, setInitialAuditLog] = useState(FALLBACK_SETTINGS.auditMemo ?? '')

  const [savingMemberId, setSavingMemberId] = useState<string | null>(null)
  const [savingFlagId, setSavingFlagId] = useState<string | null>(null)
  const [savingIntegrationId, setSavingIntegrationId] = useState<string | null>(null)
  const [savingAuditLog, setSavingAuditLog] = useState(false)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [permissionDraft, setPermissionDraft] = useState('')
  const [permissionTarget, setPermissionTarget] = useState<AdminTeamMember | null>(null)

  const [passwordTarget, setPasswordTarget] = useState<AdminTeamMember | null>(null)
  const [passwordDraft, setPasswordDraft] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    role: 'MANAGER',
    status: 'ACTIVE',
    password: '',
    permissions: defaultPermissionText,
    twoFactor: false,
  })

  const resetNewAdmin = () => {
    setNewAdmin({
      name: '',
      email: '',
      role: 'MANAGER',
      status: 'ACTIVE',
      password: '',
      permissions: defaultPermissionText,
      twoFactor: false,
    })
  }

  const resolveRoleLabel = (value?: string) => teamRoles.find((role) => role.value === value)?.label ?? value ?? '역할 미정'
  const resolveStatusLabel = (value?: string) =>
    statusOptions.find((status) => status.value === value)?.label ?? value ?? '상태 미정'

  const teamRoles = useMemo(
        () => [
      { value: 'SUPER_ADMIN', label: '슈퍼 관리자' },
      { value: 'MANAGER', label: '운영 매니저' },
      { value: 'MODERATOR', label: '모더레이터' },
      { value: 'SUPPORT', label: '고객 지원' },
      { value: 'EDITOR', label: '콘텐츠 에디터' },
      { value: 'VIEWER', label: '조회 전용' },
    ],
    []
  )

  const statusOptions = useMemo(
    () => [
      { value: 'ACTIVE', label: '활성' },
      { value: 'SUSPENDED', label: '일시중지' },
    ],
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
      const localMembers = snapshot.members.length > 0 ? snapshot.members : mapAccountsToMembers(listAdminAccounts())
      setMembers(localMembers)
      setFlags(snapshot.featureFlags.length > 0 ? snapshot.featureFlags : FALLBACK_SETTINGS.featureFlags)
      setIntegrations(snapshot.integrations.length > 0 ? snapshot.integrations : FALLBACK_SETTINGS.integrations)
      setAuditLog(snapshot.auditMemo ?? '')
      setInitialAuditLog(snapshot.auditMemo ?? '')
    } catch (error) {
      if (error instanceof AdminAuthError) {
        toast({ title: '설정 데이터 불러오기 실패', description: error.message, variant: 'destructive' })
      } else {
        const ax = error as AxiosError | undefined
        const message =
          (ax?.response?.data as any)?.message || ax?.message || '설정 정보를 불러오지 못했습니다. 기본 예시를 보여드립니다.'
        toast({
          title: '설정 데이터 불러오기 실패',
          description: Array.isArray(message) ? message.join(', ') : String(message),
          variant: 'destructive',
        })
      }
      const localMembers = mapAccountsToMembers(listAdminAccounts())
      setMembers(localMembers.length > 0 ? localMembers : defaultMembers)
      toast({
        title: '로컬 예시 데이터 사용',
        description: 'API 연결 대신 저장된 관리자 계정 정보를 표시합니다.',
      })
      setFlags(FALLBACK_SETTINGS.featureFlags)
      setIntegrations(FALLBACK_SETTINGS.integrations)
      setAuditLog(FALLBACK_SETTINGS.auditMemo ?? '')
      setInitialAuditLog(FALLBACK_SETTINGS.auditMemo ?? '')
    } finally {
      setIsLoading(false)
    }
  }

  const createMember = async () => {
    const email = newAdmin.email.trim()
    const password = newAdmin.password.trim()
    if (!email || !password) {
      toast({ title: '아이디와 비밀번호 필요', description: '부관리자 아이디(이메일)와 초기 비밀번호를 입력하세요.', variant: 'destructive' })
      return
    }
    setSavingMemberId('create')
    try {
      const created = await createAdminTeamMember({
        email,
        name: newAdmin.name.trim() || email,
        role: newAdmin.role,
        status: newAdmin.status,
        password,
        permissions: parsePermissionInput(newAdmin.permissions),
        twoFactor: newAdmin.twoFactor,
      })
      setMembers((prev) => [created, ...prev])
      toast({
        title: '부관리자 생성',
        description: `${created.name ?? created.email ?? email} 계정을 추가했습니다.`,
      })
      resetNewAdmin()
      setIsCreateDialogOpen(false)
    } catch (error) {
      if (error instanceof AdminAuthError) {
        toast({ title: '추가 실패', description: error.message, variant: 'destructive' })
      } else {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '운영자 계정을 추가하지 못했습니다.'
        toast({ title: '추가 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
      }
    } finally {
      setSavingMemberId(null)
    }
  }

  const updateMemberRole = async (id: string, role: AdminTeamMember['role']) => {
    setSavingMemberId(id)
    try {
      const updated = await updateAdminTeamMember(id, { role })
      const nextRole = updated?.role ?? (typeof role === 'string' ? role : undefined)
      setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updated, role: nextRole } : member)))
      toast({
        title: '역할 변경',
        description: `${updated?.name ?? updated?.email ?? '운영자'}의 역할을 ${resolveRoleLabel(nextRole)}로 저장했습니다.`,
      })
    } catch (error) {
      if (error instanceof AdminAuthError) {
        toast({ title: '역할 변경 실패', description: error.message, variant: 'destructive' })
      } else {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '역할을 변경하지 못했습니다.'
        toast({ title: '역할 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
      }
    } finally {
      setSavingMemberId(null)
    }
  }

  const updateMemberStatus = async (id: string, status: AdminTeamMember['status']) => {
    setSavingMemberId(id)
    try {
      const updated = await updateAdminTeamMember(id, { status })
      const nextStatus = updated?.status ?? (typeof status === 'string' ? status : undefined)
      setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updated, status: nextStatus } : member)))
      toast({ title: '상태 변경', description: `${updated?.name ?? updated?.email ?? '운영자'}의 상태를 ${resolveStatusLabel(nextStatus)}로 저장했습니다.` })
    } catch (error) {
      if (error instanceof AdminAuthError) {
        toast({ title: '상태 변경 실패', description: error.message, variant: 'destructive' })
      } else {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '상태를 변경하지 못했습니다.'
        toast({ title: '상태 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
      }
    } finally {
      setSavingMemberId(null)
    }
  }

  const toggleTwoFactor = async (id: string, enabled: boolean) => {
    setSavingMemberId(id)
    try {
      const updated = await updateAdminTeamMember(id, { twoFactor: enabled })
      setMembers((prev) => prev.map((member) => (member.id === id ? { ...member, ...updated, twoFactor: enabled } : member)))      toast({
       toast({
        title: '2단계 인증 업데이트',
        description: `${updated?.name ?? updated?.email ?? '운영자'}의 2FA 설정이 ${updated?.twoFactor ? '활성화' : '비활성화'}되었습니다.`,
      })
    } catch (error) {
      if (error instanceof AdminAuthError) {
        toast({ title: '2FA 변경 실패', description: error.message, variant: 'destructive' })
      } else {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '2FA 상태를 변경하지 못했습니다.'
        toast({ title: '2FA 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
      }
    } finally {
      setSavingMemberId(null)
    }
  }

  const removeMember = async (member: AdminTeamMember) => {
    if (member.role === 'SUPER_ADMIN') {
      toast({ title: '삭제 불가', description: '최초 슈퍼 관리자는 삭제할 수 없습니다.', variant: 'destructive' })
      return
    }
    if (typeof window !== 'undefined') {
      const label = member.name ?? member.email ?? '운영자'
      if (!window.confirm(`${label} 계정을 삭제하시겠습니까?`)) {
        return
      }
    }
    setSavingMemberId(member.id)
    try {
      await deleteAdminTeamMember(member.id)
      setMembers((prev) => prev.filter((item) => item.id !== member.id))
      toast({ title: '계정 삭제', description: `${member.name ?? member.email ?? '운영자'} 계정을 삭제했습니다.` })
    } catch (error) {
      if (error instanceof AdminAuthError) {
        toast({ title: '삭제 실패', description: error.message, variant: 'destructive' })
      } else {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '계정을 삭제하지 못했습니다.'
        toast({ title: '삭제 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
      }
    } finally {
      setSavingMemberId(null)
    }
  }

  const openPermissionDialog = (member: AdminTeamMember) => {
    setPermissionTarget(member)
    const text = (member.permissions ?? []).join(', ')
    setPermissionDraft(text || defaultPermissionText)
    setIsPermissionDialogOpen(true)
  }

  const savePermissions = async () => {
    if (!permissionTarget) return
    const permissions = parsePermissionInput(permissionDraft)
    setSavingMemberId(permissionTarget.id)
    try {
      const updated = await updateAdminTeamMember(permissionTarget.id, { permissions })
      setMembers((prev) =>
        prev.map((member) =>
          member.id === permissionTarget.id
            ? { ...member, ...updated, permissions }
            : member
        )
      )
      toast({ title: '권한 업데이트', description: `${permissionTarget.name ?? permissionTarget.email ?? '운영자'}의 권한을 저장했습니다.` })
      setIsPermissionDialogOpen(false)
      setPermissionTarget(null)
    } catch (error) {
      if (error instanceof AdminAuthError) {
        toast({ title: '권한 저장 실패', description: error.message, variant: 'destructive' })
      } else {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '권한을 저장하지 못했습니다.'
        toast({ title: '권한 저장 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
      }
    } finally {
      setSavingMemberId(null)
    }
  }

  const closePermissionDialog = () => {
    setIsPermissionDialogOpen(false)
    setPermissionTarget(null)
    setPermissionDraft('')
  }

  const openPasswordDialog = (member: AdminTeamMember) => {
    setPasswordTarget(member)
    setPasswordDraft('')
  }

  const closePasswordDialog = () => {
    setPasswordTarget(null)
    setPasswordDraft('')
    setSavingPassword(false)
  }

  const savePassword = async () => {
    if (!passwordTarget) return
    const password = passwordDraft.trim()
    if (password.length < 8) {
      toast({ title: '비밀번호 조건 미달', description: '비밀번호는 최소 8자 이상이어야 합니다.', variant: 'destructive' })
      return
    }
    setSavingPassword(true)
    try {
      const updated = await updateAdminTeamMemberPassword(passwordTarget.id, { password })
      toast({
        title: '비밀번호 재설정 완료',
        description: `${passwordTarget.name ?? passwordTarget.email ?? '운영자'}의 비밀번호를 업데이트했습니다.`,
      })
      if (updated) {
        setMembers((prev) => prev.map((member) => (member.id === passwordTarget.id ? { ...member, ...updated } : member)))
      }
      closePasswordDialog()
    } catch (error) {
      if (error instanceof AdminAuthError) {
        toast({ title: '비밀번호 변경 실패', description: error.message, variant: 'destructive' })
      } else {
        const ax = error as AxiosError | undefined
        const message = (ax?.response?.data as any)?.message || ax?.message || '비밀번호를 변경하지 못했습니다.'
        toast({ title: '비밀번호 변경 실패', description: Array.isArray(message) ? message.join(', ') : String(message), variant: 'destructive' })
      }
    } finally {
      setSavingPassword(false)
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
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>팀 관리 & 권한</CardTitle>
              <p className="text-sm text-muted-foreground">
                관리자 아이디와 권한을 이메일 기반으로 관리하고, 부관리자 계정을 생성하거나 비밀번호를 재설정하세요.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                  setIsCreateDialogOpen(open)
                  if (!open) {
                    resetNewAdmin()
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm" disabled={savingMemberId === 'create'}>
                    새 부관리자 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>부관리자 계정 생성</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 text-sm">
                    <div className="grid gap-1.5">
                      <Label htmlFor="new-admin-name">이름</Label>
                      <Input
                        id="new-admin-name"
                        value={newAdmin.name}
                        onChange={(event) => setNewAdmin((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="홍길동"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="new-admin-email">아이디 (이메일)</Label>
                      <Input
                        id="new-admin-email"
                        type="email"
                        value={newAdmin.email}
                        onChange={(event) => setNewAdmin((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="manager@example.com"
                        autoComplete="off"
                      />
                    </div>
                    <div className="grid gap-1.5 md:grid-cols-2 md:gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="new-admin-role">역할</Label>
                        <Select
                          value={newAdmin.role}
                          onValueChange={(value) => setNewAdmin((prev) => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger id="new-admin-role" className="text-xs">
                            <SelectValue placeholder="역할 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="new-admin-status">상태</Label>
                        <Select
                          value={newAdmin.status}
                          onValueChange={(value) => setNewAdmin((prev) => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger id="new-admin-status" className="text-xs">
                            <SelectValue placeholder="상태 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="new-admin-password">초기 비밀번호</Label>
                      <Input
                        id="new-admin-password"
                        type="password"
                        value={newAdmin.password}
                        onChange={(event) => setNewAdmin((prev) => ({ ...prev, password: event.target.value }))}
                        placeholder="최소 8자 이상"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="new-admin-permissions">권한 (콤마 또는 줄바꿈으로 구분)</Label>
                      <Textarea
                        id="new-admin-permissions"
                        value={newAdmin.permissions}
                        onChange={(event) => setNewAdmin((prev) => ({ ...prev, permissions: event.target.value }))}
                        rows={3}
                        placeholder={PERMISSION_HINT}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                      <div>
                        <div className="font-medium">2단계 인증</div>
                        <p className="text-muted-foreground">보안 강화를 위해 SMS 또는 OTP 추가 인증을 요구합니다.</p>
                      </div>
                      <Switch
                        checked={newAdmin.twoFactor}
                        onCheckedChange={(value) => setNewAdmin((prev) => ({ ...prev, twoFactor: value }))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          resetNewAdmin()
                          setIsCreateDialogOpen(false)
                        }}
                      >
                        취소
                      </Button>
                      <Button type="button" onClick={() => void createMember()} disabled={savingMemberId === 'create'}>
                        {savingMemberId === 'create' ? '생성 중…' : '계정 생성'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" onClick={() => void loadSettings()} disabled={isLoading}>
                새로고침
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">이름 / 아이디</th>
                    <th className="px-3 py-2 font-medium">역할</th>
                    <th className="px-3 py-2 font-medium">상태</th>
                    <th className="px-3 py-2 font-medium">권한</th>
                    <th className="px-3 py-2 font-medium">2FA</th>
                    <th className="px-3 py-2 font-medium">최근 로그인</th>
                    <th className="px-3 py-2 font-medium text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                {members.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-xs text-muted-foreground" colSpan={7}>
                        아직 등록된 관리자가 없습니다. &quot;새 부관리자 추가&quot; 버튼으로 첫 계정을 생성하세요.
                      </td>
                    </tr>
                  )}
                  {members.map((member) => (
                    <tr key={member.id} className="border-t align-top">
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-semibold">{member.name ?? member.email ?? '이름 미등록'}</span>
                          <span className="text-xs text-muted-foreground">{member.email ?? '이메일 미등록'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={member.role ?? 'VIEWER'}
                          onValueChange={(value: AdminTeamMember['role']) => void updateMemberRole(member.id, value)}
                          disabled={savingMemberId === member.id}
                        >
                          <SelectTrigger className="w-[180px] text-xs">
                            <SelectValue placeholder="역할 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamRoles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={member.status ?? 'ACTIVE'}
                          onValueChange={(value: AdminTeamMember['status']) => void updateMemberStatus(member.id, value)}
                          disabled={savingMemberId === member.id}
                        >
                          <SelectTrigger className="w-[130px] text-xs">
                            <SelectValue placeholder="상태" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            {member.permissions && member.permissions.length > 0
                              ? member.permissions.join(', ')
                              : '권한 미설정'}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPermissionDialog(member)}
                            disabled={savingMemberId === member.id}
                            className="w-fit text-xs"
                          >
                            권한 편집
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <Switch
                          checked={Boolean(member.twoFactor)}
                          disabled={savingMemberId === member.id}
                          onCheckedChange={(value) => void toggleTwoFactor(member.id, value)}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{formatDateTime(member.lastLoginAt)}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPasswordDialog(member)}
                            disabled={savingPassword && passwordTarget?.id === member.id}
                            className="text-xs"
                          >
                            비밀번호 초기화
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => void removeMember(member)}
                            disabled={savingMemberId === member.id || member.role === 'SUPER_ADMIN'}
                          >
                            삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">* 권한은 콤마(,) 또는 줄바꿈으로 여러 개를 입력할 수 있습니다.</p>
            <Dialog
              open={isPermissionDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  closePermissionDialog()
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {permissionTarget?.name ?? permissionTarget?.email ?? '운영자'} 권한 편집
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 text-sm">
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-permissions">권한 목록</Label>
                    <Textarea
                      id="edit-permissions"
                      value={permissionDraft}
                      onChange={(event) => setPermissionDraft(event.target.value)}
                      rows={4}
                      placeholder={PERMISSION_HINT}
                    />
                    <p className="text-xs text-muted-foreground">
                      권한 키는 콤마(,) 또는 줄바꿈으로 구분합니다. 예: users.manage, reports.view
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => closePermissionDialog()}>
                      취소
                    </Button>
                    <Button type="button" onClick={() => void savePermissions()} disabled={!permissionTarget}>
                      저장
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog
              open={Boolean(passwordTarget)}
              onOpenChange={(open) => {
                if (!open) {
                  closePasswordDialog()
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {passwordTarget?.name ?? passwordTarget?.email ?? '운영자'} 비밀번호 재설정
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 text-sm">
                  <div className="grid gap-1.5">
                    <Label htmlFor="reset-password">새 비밀번호</Label>
                    <Input
                      id="reset-password"
                      type="password"
                      value={passwordDraft}
                      onChange={(event) => setPasswordDraft(event.target.value)}
                      placeholder="영문, 숫자 조합 8자 이상"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => closePasswordDialog()}>
                      취소
                    </Button>
                    <Button type="button" onClick={() => void savePassword()} disabled={savingPassword}>
                      {savingPassword ? '저장 중…' : '비밀번호 저장'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
