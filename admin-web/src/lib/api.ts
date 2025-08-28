// admin-web/src/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

/**
 * BASE URL 설정 - 하드코딩으로 수정
 */
const RAW_BASE = 'https://tok-friends-api.onrender.com'
const API_BASE_URL = RAW_BASE.replace(/\/+$/, '')

/**
 * axios 인스턴스
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

/**
 * 토큰 도우미
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
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest: any = error.config
    const status = error.response?.status

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          clearAuthStorage()
          if (typeof window !== 'undefined') window.location.href = '/login'
          return Promise.reject(error)
        }

        const res = await api.post('/auth/refresh', { refresh_token: refreshToken })
        const newAccess = res?.data?.access_token || res?.data?.token
        const newRefresh = res?.data?.refresh_token

        if (newAccess) setAccessToken(newAccess)
        if (newRefresh) setRefreshToken(newRefresh)

        originalRequest.headers = originalRequest.headers || {}
        if (newAccess) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`
        }
        return api(originalRequest)
      } catch (refreshError) {
        clearAuthStorage()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

/**
 * 로그인/로그아웃 헬퍼
 */
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

export function logoutToLogin() {
  clearAuthStorage()
  if (typeof window !== 'undefined') window.location.href = '/login'
}

/**
 * API 헬퍼 함수들
 */
export async function getDashboardMetrics() {
  try {
    const response = await api.get('/metrics/dashboard')
    return response.data
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error)
    return {
      users: { total: 0, active: 0, suspended: 0 },
      reports: { total: 0, pending: 0 },
      bannedWords: 0,
      activeAnnouncements: 0,
      newUsers: { day: 0, week: 0, month: 0 },
    }
  }
}
