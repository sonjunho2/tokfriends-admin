// tokfriends-admin/src/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type Opts = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  auth?: boolean; // true면 Authorization 헤더 자동 첨부
};

// 기본 호출 유틸
export async function api(path: string, opts: Opts = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 보호 API 호출 시 토큰 첨부
  if (opts.auth && typeof window !== 'undefined') {
    const token = localStorage.getItem('tokfriends_admin_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include', // 쿠키 기반도 겸용
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const msg = json?.message || res.statusText;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return json;
}

// 로그인
export async function loginWithEmail(email: string, password: string) {
  const data = await api('/auth/login/email', {
    method: 'POST',
    body: { email, password },
  });
  // 토큰 저장 (백엔드가 token을 body로 준 경우)
  if (data?.token && typeof window !== 'undefined') {
    localStorage.setItem('tokfriends_admin_token', data.token);
  }
  return data;
}

// 예시 보호 API
export async function getMe() {
  return api('/users/me', { auth: true }); // 실제 보호 엔드포인트에 맞게 조정
}
