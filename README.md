딱친(TokFriends) 서비스를 위한 웹 기반 관리자 패널입니다.

## 주요 기능

- 🔐 **관리자 인증 및 RBAC 권한 관리**
- 👥 **사용자 관리** (조회, 제재, 상태 변경)
- 📊 **대시보드** (핵심 지표, 트렌드 차트)
- 🚨 **신고 관리** (처리, 상태 변경, 담당자 배정)
- 🛡️ **금칙어 관리** (CRUD, CSV 일괄 처리)
- 📢 **공지사항 관리** (생성, 수정, 활성화)
- 📝 **감사 로그** (모든 관리 활동 추적)
- 🌓 **다크/라이트 모드**

## 기술 스택

- **API (tok‑friends)** : NestJS 10, Prisma ORM, PostgreSQL, JWT 인증, Swagger 문서화
- **Frontend (admin‑web)** : Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui 컴포넌트, Recharts

## 설치 및 실행

### 사전 요구사항

- Node.js 20.x
- PostgresQL (또는 Neon 계정)
- Git

### 로컬 개발 환경 설정

1. **프로젝트 복제**

   ```bash
   git clone [repository-url]
   cd tokfriends-admin

2. Frontend (admin‑web) 설정

cd admin-web

# 환경변수 설정
cp .env.example .env

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

3. 접속

Frontend : http://localhost:3000

Backend API : http://localhost:4000

Swagger 문서 : http://localhost:4000/docs

Render 배포 가이드

admin‑web 배포

Render 대시보드에서 “New Static Site” 또는 “New Web Service”를 생성합니다. GitHub 저장소를 연결하고 다음과 같이 설정합니다.

Name : tokfriends-admin-web

Root Directory : admin-web

Environment : Node

Build Command : npm ci && npm run build

Start Command : npm run start

환경변수 추가 :

NEXT_PUBLIC_API_BASE_URL : tok‑friends API의 URL

초기 로그인

처음 실행 시 기본 관리자 계정이 생성됩니다. 아래 계정으로 로그인한 뒤 비밀번호를 즉시 변경하세요.

이메일 : admin@local

비밀번호 : Admin123!

주요 기능 사용법
사용자 관리

1.좌측 메뉴에서 “사용자 관리”를 클릭합니다.

2.이메일 또는 닉네임으로 검색할 수 있습니다.

3.사용자 행 우측의 “정지” 버튼을 클릭하여 제재하거나, 정지된 사용자는 “활성화” 버튼으로 복구할 수 있습니다.

신고 관리

1.좌측 메뉴에서 “신고 관리”를 클릭합니다.

2.상태 필터(대기중/처리완료/반려)를 선택합니다.

3.각 신고에 대해 “처리완료” 또는 “반려” 버튼을 클릭합니다.

금칙어 관리

1.좌측 메뉴에서 “금칙어 관리”를 클릭합니다.

2.우측 상단의 “금칙어 추가” 버튼으로 새로운 금칙어를 추가합니다.

3.각 금칙어의 심각도(LOW/MEDIUM/HIGH)를 선택합니다.

4.CSV 업로드/다운로드를 지원합니다.

공지사항 관리

1.좌측 메뉴에서 “공지사항”을 클릭합니다.

2.우측 상단의 “공지사항 추가” 버튼으로 새 공지를 작성합니다.

3.토글 스위치로 공지를 활성/비활성화할 수 있습니다.

문제 해결
데이터베이스 연결 오류

1.DATABASE_URL이 올바른지 확인합니다.

2.PostgresQL 서버가 실행 중인지 확인합니다.

3.SSL 설정이 필요한 경우 연결 문자열 끝에 ?sslmode=require를 추가합니다.

CORS 오류

1.tok‑friends API의 CORS_ORIGIN 환경변수를 확인합니다.

2.Frontend URL이 정확하게 지정되었는지 확인합니다.

인증 오류

1.JWT 토큰이 만료되었는지 확인합니다.

2.로그아웃 후 다시 로그인합니다.

라이선스

MIT License

지원

문제가 발생하면 Issue를 생성하거나 관리자에게 문의하세요.
