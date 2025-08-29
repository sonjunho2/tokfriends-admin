// tokfriends-admin/admin-web/src/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios'

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

/** ✅ 레이아웃/페이지에서 사용하는 표준 로그아웃 (layout.tsx가 import) */
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
    // eslint-disable-next-line no-console
    console.info(
      '[TokFriends Admin] ->',
      (config.method || 'GET').toUpperCase(),
      config.baseURL + (config.url || ''),
      '| auth =',
      short
    )
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const status = error.response?.status
    const message = (error.response?.data as any)?.message || error.message || ''

    if (status === 401) {
      // eslint-disable-next-line no-console
      console.warn(
        '[TokFriends Admin] 401 from',
        error.config?.baseURL + error.config?.url,
        '| message =',
        message
      )
      // refresh 플로우가 없다면 즉시 재로그인
      logoutToLogin()
    } else if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.error('[TokFriends Admin] API error @', API_BASE_URL, error)
    }
    return Promise.reject(error)
  }
)

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

export async function getDashboardMetrics() {
  const res = await api.get('/metrics/dashboard')
  return res.data
}
