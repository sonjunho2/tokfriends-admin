// tokfriends-admin/src/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type Opts = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  auth?: boolean; // 토큰 첨부 여부
};

export async function api(path: string, opts: Opts = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (opts.auth) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tokfriends_admin_token') : null;
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
  try { json = text ? JSON.parse(text) : null; } catch (e) {}

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
  // 토큰 바디로 오면 저장
  if (data?.token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tokfriends_admin_token', data.token);
    }
  }
  return data;
}

// 예시: 보호된 리소스 호출
export async function getProtectedExample() {
  return api('/users/me', { auth: true }); // 실제 보호 엔드포인트로 교체
}
