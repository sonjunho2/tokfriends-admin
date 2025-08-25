# TokFriends Admin Panel

딱친(TokFriends) 서비스를 위한 웹 기반 관리자 패널입니다.

## 주요 기능

- 🔐 관리자 인증 및 RBAC 권한 관리
- 👥 사용자 관리 (조회, 제재, 상태 변경)
- 📊 대시보드 (핵심 지표, 트렌드 차트)
- 🚨 신고 관리 (처리, 상태 변경, 담당자 배정)
- 🛡️ 금칙어 관리 (CRUD, CSV 일괄 처리)
- 📢 공지사항 관리 (생성, 수정, 활성화)
- 📝 감사 로그 (모든 관리 활동 추적)
- 🌓 다크/라이트 모드

## 기술 스택

### Backend (admin-api)
- NestJS 10
- Prisma 5 ORM
- PostgreSQL (Neon)
- JWT 인증
- Swagger API 문서화

### Frontend (admin-web)
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui 컴포넌트
- Recharts 차트

## 설치 및 실행

### 사전 요구사항
- Node.js 20.x
- PostgreSQL 또는 Neon 계정
- Git

### 로컬 개발 환경 설정

#### 1. 프로젝트 복제
```bash
git clone [repository-url]
cd tokfriends-admin
```

#### 2. Backend (admin-api) 설정
```bash
cd admin-api

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어 DATABASE_URL을 실제 PostgreSQL 연결 문자열로 변경

# 의존성 설치
npm install

# 데이터베이스 마이그레이션
npm run prisma:migrate:deploy

# 시드 데이터 생성
npm run seed

# 개발 서버 실행
npm run start:dev
```

#### 3. Frontend (admin-web) 설정
```bash
cd ../admin-web

# 환경변수 설정
cp .env.example .env

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

#### 4. 접속
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api/admin
- Swagger 문서: http://localhost:8080/docs

### Docker를 사용한 실행
```bash
# 전체 스택 실행
docker-compose up -d

# 중지
docker-compose down
```

## Render 배포 가이드

### 1. admin-api 배포
1. Render 대시보드에서 "New Web Service" 생성
2. GitHub 저장소 연결
3. 설정:
   - Name: `tokfriends-admin-api`
   - Root Directory: `admin-api`
   - Environment: `Node`
   - Build Command: `npm ci && npm run prisma:generate && npm run build`
   - Start Command: `npm run prisma:migrate:deploy && npm run start:prod`
4. 환경변수 추가:
   - `DATABASE_URL`: Neon PostgreSQL 연결 문자열
   - `JWT_ACCESS_SECRET`: 안전한 랜덤 문자열
   - `JWT_REFRESH_SECRET`: 안전한 랜덤 문자열
   - `CORS_ORIGIN`: Frontend URL
   - `NODE_ENV`: `production`
   - `PORT`: `8080`

### 2. admin-web 배포
1. Render 대시보드에서 "New Static Site" 또는 "New Web Service" 생성
2. GitHub 저장소 연결
3. 설정:
   - Name: `tokfriends-admin-web`
   - Root Directory: `admin-web`
   - Environment: `Node`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start`
4. 환경변수 추가:
   - `NEXT_PUBLIC_API_BASE_URL`: admin-api의 URL

## 초기 로그인

- 이메일: `admin@local`
- 비밀번호: `Admin123!`

⚠️ **보안 주의사항**: 첫 로그인 후 반드시 비밀번호를 변경하세요.

## 주요 기능 사용법

### 사용자 관리
1. 좌측 메뉴에서 "사용자 관리" 클릭
2. 검색: 이메일 또는 닉네임으로 검색
3. 제재: 사용자 행 우측의 "정지" 버튼 클릭
4. 활성화: 정지된 사용자의 "활성화" 버튼 클릭

### 신고 관리
1. 좌측 메뉴에서 "신고 관리" 클릭
2. 상태 필터: 대기중/처리완료/반려 선택
3. 처리: "처리완료" 또는 "반려" 버튼 클릭

### 금칙어 관리
1. 좌측 메뉴에서 "금칙어 관리" 클릭
2. 추가: 우측 상단 "금칙어 추가" 버튼
3. 심각도: LOW/MEDIUM/HIGH 선택
4. CSV 업로드/다운로드 지원

### 공지사항 관리
1. 좌측 메뉴에서 "공지사항" 클릭
2. 추가: 우측 상단 "공지사항 추가" 버튼
3. 활성화: 토글 스위치로 즉시 활성/비활성

## 문제 해결

### 데이터베이스 연결 오류
- DATABASE_URL이 올바른지 확인
- PostgreSQL 서버가 실행 중인지 확인
- SSL 설정이 필요한 경우 `?sslmode=require` 추가

### CORS 오류
- admin-api의 CORS_ORIGIN 환경변수 확인
- Frontend URL이 올바르게 설정되었는지 확인

### 인증 오류
- JWT 토큰이 만료되었는지 확인
- 로그아웃 후 다시 로그인

## 라이선스

MIT License

## 지원

문제가 발생하면 Issue를 생성하거나 관리자에게 문의하세요.