# Report Tools

브라우저에서 쓰는 보고서 보조 도구입니다.

## 기능

- 글자수, 단어수, 나이스 기준 바이트 검사
- 이미지 포맷 변환
- PDF 병합, 분할, 회전
- Supabase 기반 프롬프트 커뮤니티

## 로컬 실행

```bash
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 환경변수

프롬프트 커뮤니티 기능을 사용하려면 `.env.local`에 Supabase 값을 넣어야 합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Supabase의 legacy anon key를 쓰는 경우에는 아래 변수명도 지원합니다.

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Supabase SQL Editor에서 `supabase/schema.sql`을 실행하면 필요한 테이블과 RLS 정책이 생성됩니다.

## 배포

Vercel에서 이 저장소를 import하고 Framework Preset을 `Next.js`로 설정합니다.

환경변수에는 다음 값을 등록합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://rgrlzfkfkzenvovgiush.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```
