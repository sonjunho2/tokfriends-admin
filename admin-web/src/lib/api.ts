// tokfriends-admin/admin-web/src/lib/api.ts
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  isAxiosError,
} from 'axios'

const ENV_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
const FALLBACK_BASE = 'https://tok-friends-api.onrender.com'
const RAW_BASE = (ENV_BASE && ENV_BASE.trim().length > 0 ? ENV_BASE : FALLBACK_BASE) as string
const API_BASE_URL = RAW_BASE.replace(/\/+$/, '')

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[TokFriends Admin] API_BASE_URL =', API_BASE_URL)
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 8000,
})

const TOKEN_KEY = 'tokfriends_admin_token'
const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(ACCESS_KEY) || null
}
export function setAccessToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ACCESS_KEY, token)
}
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY)
}
export function setRefreshToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(REFRESH_KEY, token)
}
export function clearAuthStorage() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem('user')
}

/** 표준 로그아웃: 저장 토큰 삭제 후 /login 이동 */
export function logoutToLogin() {
  clearAuthStorage()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }

  // 진단 로그: 토큰 부착 여부(앞 10자만)
  if (typeof window !== 'undefined') {
    const short = token ? token.slice(0, 10) + '…' : '(no token)'
    const method = (config.method || 'GET').toUpperCase()
    const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`
    // eslint-disable-next-line no-console
    console.info('[TokFriends Admin] ->', method, fullUrl, '| auth =', short)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const status = error.response?.status
    const message = (error.response?.data as any)?.message || error.message || ''

    // 안전하게 전체 URL 구성 (strict 모드 대응)
    const fullUrl = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`

    if (status === 401) {
      // eslint-disable-next-line no-console
      console.warn('[TokFriends Admin] 401 from', fullUrl, '| message =', message)
      // refresh 플로우가 없다면 즉시 재로그인
      logoutToLogin()
    } else {
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.error('[TokFriends Admin] API error @', fullUrl || API_BASE_URL, error)
      }
    }
    return Promise.reject(error)
  }
)

// 공통 POST 헬퍼들
export function postJson<T = any>(url: string, data?: any, config?: AxiosRequestConfig<T>) {
  return api.post<T>(url, data, {
    headers: { 'Content-Type': 'application/json' },
    ...(config || {}),
  })
}

export function postForm<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig<T>) {
  const body = new URLSearchParams()
  Object.entries(data || {}).forEach(([k, v]) => body.append(k, String(v ?? '')))
  return api.post<T>(url, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    ...(config || {}),
  })
}

export function saveLoginResult(payload: any) {
  const token = payload?.token || payload?.access_token
  const refresh = payload?.refresh_token
  const user = payload?.user

  if (token) setAccessToken(token)
  if (refresh) setRefreshToken(refresh)
  if (typeof window !== 'undefined' && user) {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

// 대시보드 메트릭스
export async function getDashboardMetrics() {
  const res = await api.get('/metrics/dashboard')
  return res.data
}

// ---------------------------------------------------------------------------
// 인증 & 헬스체크
// ---------------------------------------------------------------------------

export interface LoginWithEmailRequest {
  email: string
  password: string
}

export interface LoginWithEmailResponse {
  access_token?: string
  token?: string
  refresh_token?: string
  user?: unknown
  [key: string]: unknown
}

export async function loginWithEmail(payload: LoginWithEmailRequest) {
  const response = await postForm<LoginWithEmailResponse>('/auth/login/email', payload)
  return response.data
}

export async function checkHealth() {
  const response = await api.get('/health')
  return response.data
}

// ---------------------------------------------------------------------------
// 유틸리티
// ---------------------------------------------------------------------------

const DEFAULT_ARRAY_KEYS = ['items', 'results', 'data', 'list', 'records']

function unwrapArray<T>(payload: unknown, extraKeys: string[] = []): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (payload && typeof payload === 'object') {
    const probeKeys = [...extraKeys, ...DEFAULT_ARRAY_KEYS]
    for (const key of probeKeys) {
      const value = (payload as Record<string, unknown>)[key]
      if (Array.isArray(value)) {
        return value as T[]
      }
    }
  }

  return []
}

function ensureStringId(value: unknown, fallbackPrefix: string) {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (typeof value === 'number') return String(value)
  return `${fallbackPrefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`
}

// ---------------------------------------------------------------------------
// 사용자
// ---------------------------------------------------------------------------

export interface UserSearchParams {
  query?: string
  email?: string
  nickname?: string
  status?: string
  page?: number
  limit?: number
  [key: string]: unknown
}

export interface UserSummary {
  id: string
  email?: string
  nickname?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  lastActiveAt?: string
  [key: string]: unknown
}

export type UserDetail = UserSummary & {
  profile?: unknown
  memo?: string
  marketingOptIn?: boolean
  [key: string]: unknown
}

export type UserUpdatePayload = Record<string, unknown>

export async function searchUsers(params: UserSearchParams = {}) {
  const response = await api.get('/users/search', { params })
  return unwrapArray<UserSummary>(response.data, ['users'])
}

export async function getUserById(userId: string) {
  const response = await api.get(`/users/${userId}`)
  const data = response.data as UserDetail
  const id = ensureStringId(data?.id, 'user')
  return { ...data, id }
}

export async function updateUserProfile(userId: string, payload: UserUpdatePayload) {
  const response = await api.patch(`/users/${userId}`, payload)
  const data = response.data as UserDetail
  const id = ensureStringId(data?.id ?? userId, 'user')
  return { ...data, id }
}

// ---------------------------------------------------------------------------
// 신고 / 차단
// ---------------------------------------------------------------------------

export interface ReportPayload {
  type: string
  reason: string
  reportedUserId?: string
  targetId?: string
  description?: string
  [key: string]: unknown
}

export interface BlockPayload {
  userId: string
  reason?: string
  expiresAt?: string | null
  [key: string]: unknown
}

export function submitUserReport(payload: ReportPayload) {
  return api.post('/community/report', payload)
}

export function submitUserBlock(payload: BlockPayload) {
  return api.post('/community/block', payload)
}

// ---------------------------------------------------------------------------
// 토픽 / 게시글
// ---------------------------------------------------------------------------

export interface TopicQuery {
  status?: string
  page?: number
  limit?: number
  [key: string]: unknown
}

export interface Topic {
  id: string
  title?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface Post {
  id: string
  topicId?: string
  title?: string
  body?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export async function listTopics(params: TopicQuery = {}) {
  const response = await api.get('/topics', { params })
  return unwrapArray<Topic>(response.data, ['topics'])
}

export async function listTopicPosts(topicId: string, params: Record<string, unknown> = {}) {
  const response = await api.get(`/topics/${topicId}/posts`, { params })
  return unwrapArray<Post>(response.data, ['posts'])
}

export async function listPosts(params: Record<string, unknown> = {}) {
  const response = await api.get('/posts', { params })
  return unwrapArray<Post>(response.data, ['posts'])
}

export async function updatePost(postId: string, payload: Record<string, unknown>) {
  const response = await api.patch(`/posts/${postId}`, payload)
  const data = response.data as Post
  const id = ensureStringId(data?.id ?? postId, 'post')
  return { ...data, id }
}

export async function deletePost(postId: string) {
  await api.delete(`/posts/${postId}`)
}

// ---------------------------------------------------------------------------
// 공지 / 배너
// ---------------------------------------------------------------------------

export interface AnnouncementWritePayload {
  title?: string
  body?: string | null
  content?: string | null
  audience?: string | null
  link?: string | null
  isActive?: boolean
  startsAt?: string | null
  endsAt?: string | null
  status?: string | null
  [key: string]: unknown
}

export interface Announcement {
  id: string
  title: string
  body?: string | null
  content?: string | null
  audience?: string | null
  link?: string | null
  isActive?: boolean
  startsAt?: string | null
  endsAt?: string | null
  scheduledAt?: string | null
  status?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  [key: string]: unknown
}

export async function getAnnouncements(params: Record<string, unknown> = {}) {
  const response = await api.get('/announcements', { params })
  return unwrapArray<Announcement>(response.data, ['announcements'])
}

export async function getActiveAnnouncements() {
  const response = await api.get('/announcements/active')
  return unwrapArray<Announcement>(response.data, ['announcements'])
}

export async function createAnnouncement(payload: AnnouncementWritePayload) {
  const response = await api.post('/announcements', payload)
  const data = response.data as Announcement
  const id = ensureStringId(data?.id, 'announcement')
  return { ...data, id }
}

export async function updateAnnouncement(announcementId: string, payload: AnnouncementWritePayload) {
  const response = await api.patch(`/announcements/${announcementId}`, payload)
  const data = response.data as Announcement
  const id = ensureStringId(data?.id ?? announcementId, 'announcement')
  return { ...data, id }
}

// ---------------------------------------------------------------------------
// 선물 / 아이템
// ---------------------------------------------------------------------------

export interface Gift {
  id: string
  name?: string
  description?: string
  price?: number
  isActive?: boolean
  [key: string]: unknown
}

export type GiftPayload = Record<string, unknown>

export async function getGifts(params: Record<string, unknown> = {}) {
  try {
    const response = await api.get('/gifts', { params })
    return unwrapArray<Gift>(response.data, ['gifts'])
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export async function createGift(payload: GiftPayload) {
  const response = await api.post('/gifts', payload)
  const data = response.data as Gift
  const id = ensureStringId(data?.id, 'gift')
  return { ...data, id }
}

export async function updateGift(giftId: string, payload: GiftPayload) {
  const response = await api.patch(`/gifts/${giftId}`, payload)
  const data = response.data as Gift
  const id = ensureStringId(data?.id ?? giftId, 'gift')
  return { ...data, id }
}

export async function deleteGift(giftId: string) {
  await api.delete(`/gifts/${giftId}`)
}

// ---------------------------------------------------------------------------
// 약관 / 정책 문서
// ---------------------------------------------------------------------------

export interface LegalDocumentVersion {
  version?: number
  title?: string
  body?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
  memo?: string | null
  [key: string]: unknown
}

export interface LegalDocument {
  slug: string
  title?: string | null
  body?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
  version?: number | null
  history?: LegalDocumentVersion[]
  [key: string]: unknown
}

export interface LegalDocumentPayload {
  title: string
  body: string
  updatedBy?: string
  memo?: string
  [key: string]: unknown
}

function normalizeVersion(entry: LegalDocumentVersion | undefined, index: number) {
  if (!entry) return undefined
  const normalized: LegalDocumentVersion = {
    ...entry,
    version: entry.version ?? (entry as any)?.revision ?? (entry as any)?.sequence ?? index + 1,
    updatedAt: entry.updatedAt ?? (entry as any)?.updated_at ?? (entry as any)?.createdAt ?? null,
    updatedBy: entry.updatedBy ?? (entry as any)?.updated_by ?? null,
    memo: entry.memo ?? (entry as any)?.memo ?? (entry as any)?.note ?? (entry as any)?.changelog ?? null,
  }
  return normalized
}

export async function getLegalDocument(slug: string) {
  try {
    const response = await api.get(`/legal-documents/${slug}`)
    const raw = response.data as any
    const document = (raw?.document ?? raw) as Record<string, unknown>
    const history = unwrapArray<LegalDocumentVersion>(
      raw?.history ?? document?.history ?? document?.versions ?? (document as any)?.revisions ?? [],
      ['history', 'versions', 'revisions']
    )

    const normalizedHistory = history
      .map((entry, index) => normalizeVersion(entry, index))
      .filter((entry): entry is LegalDocumentVersion => Boolean(entry))

    const normalized: LegalDocument = {
      slug: ensureStringId((document?.slug as string | undefined) ?? slug, 'legal-document'),
      title: (document?.title as string | undefined) ?? (document?.name as string | undefined) ?? null,
      body: (document?.body as string | undefined) ?? (document?.content as string | undefined) ?? null,
      updatedAt:
        (document?.updatedAt as string | undefined) ??
        (document?.updated_at as string | undefined) ??
        (document?.modifiedAt as string | undefined) ??
        null,
      updatedBy:
        (document?.updatedBy as string | undefined) ??
        (document?.updated_by as string | undefined) ??
        (document?.editor as string | undefined) ??
        null,
      version:
        (document?.version as number | undefined) ??
        (document?.latestVersion as number | undefined) ??
        (document?.revision as number | undefined) ??
        null,
      history: normalizedHistory,
    }

    return normalized
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return {
        slug,
        title: '',
        body: '',
        history: [],
      } as LegalDocument
    }
    throw error
  }
}

export async function saveLegalDocument(slug: string, payload: LegalDocumentPayload) {
  const response = await api.put(`/legal-documents/${slug}`, payload)
  const raw = response.data as any
  const history = unwrapArray<LegalDocumentVersion>(raw?.history ?? raw?.versions ?? raw?.revisions ?? [], [
    'history',
    'versions',
    'revisions',
  ])

  const normalizedHistory = history
    .map((entry, index) => normalizeVersion(entry, index))
    .filter((entry): entry is LegalDocumentVersion => Boolean(entry))

  const normalized: LegalDocument = {
    slug: ensureStringId((raw?.slug as string | undefined) ?? slug, 'legal-document'),
    title: (raw?.title as string | undefined) ?? payload.title,
    body: (raw?.body as string | undefined) ?? (raw?.content as string | undefined) ?? payload.body,
    updatedAt: (raw?.updatedAt as string | undefined) ?? (raw?.updated_at as string | undefined) ?? new Date().toISOString(),
    updatedBy: (raw?.updatedBy as string | undefined) ?? (raw?.updated_by as string | undefined) ?? payload.updatedBy,
    version:
      (raw?.version as number | undefined) ??
      (raw?.latestVersion as number | undefined) ??
      (raw?.revision as number | undefined) ??
      (normalizedHistory[0]?.version ?? null),
    history: normalizedHistory,
  }

  return normalized
}

// ---------------------------------------------------------------------------
// 휴대폰 인증
// ---------------------------------------------------------------------------

export interface PhoneOtpLog {
  id?: string
  phoneNumber: string
  requestedAt?: string
  status: 'SUCCESS' | 'FAILED' | string
  failureReason?: string | null
  verificationId?: string | null
  [key: string]: unknown
}

export interface PhoneVerificationSession {
  verificationId: string
  phoneNumber: string
  lastOtpSentAt?: string | null
  verifiedAt?: string | null
  expiresAt?: string | null
  profileCompleted?: boolean
  attempts?: number
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface ManualProfileCompletionPayload {
  verificationId: string
  nickname?: string
  note?: string
  [key: string]: unknown
}

export async function getPhoneOtpLogs(params: Record<string, unknown> = {}) {
  const response = await api.get('/verifications/phone/otp-logs', { params })
  return unwrapArray<PhoneOtpLog>(response.data, ['logs', 'items'])
}

export async function getPendingPhoneVerifications(params: Record<string, unknown> = {}) {
  const response = await api.get('/verifications/phone/pending', { params })
  return unwrapArray<PhoneVerificationSession>(response.data, ['sessions', 'items'])
}

export function resendPhoneOtp(verificationId: string) {
  return api.post(`/verifications/phone/${verificationId}/resend`)
}

export function approvePhoneVerification(verificationId: string) {
  return api.post(`/verifications/phone/${verificationId}/approve`)
}

export function expirePhoneVerificationSession(verificationId: string) {
  return api.post(`/verifications/phone/${verificationId}/expire`)
}

export function completePhoneVerificationProfile(payload: ManualProfileCompletionPayload) {
  return api.post('/verifications/phone/manual-complete', payload)
}

// ---------------------------------------------------------------------------
// 포인트 상품
// ---------------------------------------------------------------------------

export interface PointProduct {
  id: string
  name?: string
  points?: number
  price?: number
  isRecommended?: boolean
  isActive?: boolean
  androidProductId?: string | null
  iosProductId?: string | null
  order?: number
  note?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  [key: string]: unknown
}

export interface PointProductPayload {
  name?: string
  points?: number
  price?: number
  isRecommended?: boolean
  isActive?: boolean
  androidProductId?: string | null
  iosProductId?: string | null
  order?: number
  note?: string | null
  [key: string]: unknown
}

export interface PointProductOrderInput {
  id: string
  order: number
}

export async function getPointProducts(params: Record<string, unknown> = {}) {
  const response = await api.get('/store/point-products', { params })
  return unwrapArray<PointProduct>(response.data, ['items', 'products', 'pointProducts']).map((item) => ({
    ...item,
    id: ensureStringId(item?.id, 'point-product'),
  }))
}

export async function createPointProduct(payload: PointProductPayload) {
  const response = await api.post('/store/point-products', payload)
  const data = response.data as PointProduct
  const id = ensureStringId(data?.id, 'point-product')
  return { ...data, id }
}

export async function updatePointProduct(productId: string, payload: PointProductPayload) {
  const response = await api.put(`/store/point-products/${productId}`, payload)
  const data = response.data as PointProduct
  const id = ensureStringId(data?.id ?? productId, 'point-product')
  return { ...data, id }
}

export async function deletePointProduct(productId: string) {
  await api.delete(`/store/point-products/${productId}`)
}

export async function syncPointProductOrder(items: PointProductOrderInput[]) {
  await api.post('/store/point-products/reorder', { items })
}
