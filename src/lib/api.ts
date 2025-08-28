// admin-web/src/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

/**
 * BASE URL 설정
 * - Vercel 환경변수에서 가져오고, 없으면 하드코딩된 URL로 fallback
 * - 끝 슬래시는 제거해 경로 중복 방지
 */
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://tok-friends-api.onrender.com'
const API_BASE_URL = RAW_BASE.replace(/\/+$/, '')

/**
 * axios 인스턴스
 * - withCredentials: true  (쿠키 기반 인증 겸용)
 * - Content-Type: application/json
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * 토큰 도우미
 * - 기존 프로젝트의 access_token/refresh_token 키와
 *   새로 제안한 tokfriends_admin_token 모두를 지원
 */
const TOKEN_KEY = 'tokfriends_admin_token'
const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(ACCESS_KEY) ||
    null
  )
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

/**
 * 요청 인터셉터
 * - Authorization: Bearer <token> 자동 첨부
 */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

/**
 * 응답 인터셉터
 * - 401 발생 시 1회 자동 재시도
 * - refresh_token 이 있으면 /auth/refresh 호출을 시도
 *   (백엔드가 이 엔드포인트/포맷을 제공하지 않으면 로그인 페이지로 보내기)
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest: any = error.config
    const status = error.response?.status

    // 토큰 만료 등으로 401이면서, 아직 재시도 안 했을 때
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          // 리프레시 토큰 없으면 바로 로그아웃
          clearAuthStorage()
          if (typeof window !== 'undefined') window.location.href = '/login'
          return Promise.reject(error)
        }

        // 표준 리프레시 요청 (백엔드가 지원해야 함)
        // 필요 시 본문 키 이름을 서버 구현에 맞게 조정
        const res = await api.post('/auth/refresh', { refresh_token: refreshToken })

        const newAccess = res?.data?.access_token || res?.data?.token
        const newRefresh = res?.data?.refresh_token

        if (newAccess) setAccessToken(newAccess)
        if (newRefresh) setRefreshToken(newRefresh)

        // 원 요청의 Authorization 갱신 후 재시도
        originalRequest.headers = originalRequest.headers || {}
        if (newAccess) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        // 리프레시 실패 → 완전 로그아웃
        clearAuthStorage()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

/**
 * 선택: 로그인/로그아웃 헬퍼
 * - 페이지/훅에서 직접 사용할 수 있음
 */
export function saveLoginResult(payload: any) {
  // 백엔드 응답의 다양한 형태 대응
  // e.g. { token, user } 또는 { access_token, refresh_token, user }
  const token = payload?.token || payload?.access_token
  const refresh = payload?.refresh_token
  const user = payload?.user

  if (token) setAccessToken(token)
  if (refresh) setRefreshToken(refresh)
  if (typeof window !== 'undefined' && user) {
    localStorage.setItem('user', JSON.stringify(user))
  }
}

export function logoutToLogin() {
  clearAuthStorage()
  if (typeof window !== 'undefined') window.location.href = '/login'
}

/**
 * API 헬퍼 함수들
 */

// 로그인
export async function loginAdmin(email: string, password: string) {
  const response = await api.post('/auth/login/email', { email, password })
  const result = response.data
  
  if (result.token || result.access_token) {
    saveLoginResult(result)
    return { success: true, data: result }
  }
  
  return { success: false, error: 'Invalid login response' }
}

// 대시보드 메트릭 (MetricsModule 추가 후 사용)
export async function getDashboardMetrics() {
  try {
    const response = await api.get('/metrics/dashboard')
    return response.data
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error)
    // 더미 데이터 반환
    return {
      users: { total: 0, active: 0, suspended: 0 },
      reports: { total: 0, pending: 0 },
      bannedWords: 0,
      activeAnnouncements: 0,
      newUsers: { day: 0, week: 0, month: 0 },
    }
  }
}

// 사용자 목록
export async function getUsers(params?: {
  page?: number
  limit?: number
  search?: string
  status?: string
}) {
  const response = await api.get('/admin/users', { params })
  return response.data
}

// 신고 목록
export async function getReports(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  const response = await api.get('/admin/reports', { params })
  return response.data
}

// 최근 신고 (RecentReports 컴포넌트용)
export async function getRecentReports(limit = 20) {
  try {
    const response = await api.get(`/admin/reports/recent?limit=${limit}`)
    return Array.isArray(response.data) ? response.data : response.data.items || []
  } catch (error) {
    console.error('Failed to fetch recent reports:', error)
    // 더미 데이터 반환
    return [
      { id: "1", nickname: "tester1", reason: "스팸 의심", status: "PENDING", createdAt: new Date().toISOString() },
      { id: "2", nickname: "tester2", reason: "부적절한 닉네임", status: "RESOLVED", createdAt: new Date().toISOString() },
    ]
  }
}
