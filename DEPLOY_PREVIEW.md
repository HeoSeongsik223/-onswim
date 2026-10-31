# 온스윔 — 미리보기 배포 준비 (9차)

## 현황
- Supabase 프로젝트: `cyryeqwwccluxwstuilv` (온스윔 독립 프로젝트)
- 실제 Vercel 배포: **미실행**
- 의존성 설치 / Next.js 빌드: **미검증** (실행 환경에서 npm registry DNS `EAI_AGAIN`)
- PG 결제: **미구현/비활성화**
- 데이터베이스: 심사서류 승인 없이 업소 승인 불가능하도록 서버 측 트리거 추가

## Vercel Preview 배포 절차
1. 이 프로젝트를 온스윔 전용 GitHub 저장소에 업로드한다. `.env.local`과 비밀키는 커밋하지 않는다.
2. Vercel에서 **새 프로젝트**를 생성하고 해당 저장소를 Import한다. 기존 SpeedMarket 프로젝트와 연결하지 않는다.
3. Framework Preset: Next.js, Root Directory: `/`.
4. Environment Variables (Preview/Production 각각):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://cyryeqwwccluxwstuilv.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = Supabase 대시보드의 Publishable key
   - `service_role`/`sb_secret` 키는 이 프런트엔드에 넣지 않는다.
5. 첫 배포의 Build Logs에서 `npm install` 및 `next build` 성공을 확인한다. 오류가 있으면 배포 성공으로 취급하지 않는다.
6. Supabase Authentication → URL Configuration에서 미리보기 도메인을 Redirect URLs에 추가한다. 이메일 확인 링크/로그인 리다이렉트를 실제 테스트한다.
7. 관리자 계정은 먼저 일반 사용자로 가입한 후, Supabase의 신뢰된 관리 콘솔에서 해당 `auth.users.id`를 확인해 `public.admin_users`에 수동 등록한다. 프런트엔드에 관리자 등록 API를 만들지 않는다.
8. 비공개 미리보기 환경에서 아래 기능을 테스트하고 승인받은 뒤에만 공개한다.

## 필수 인수 테스트
- [ ] 첫 화면과 17개 지역 이동, 모바일 메뉴/레이아웃
- [ ] 이메일 회원가입, 인증 메일, 로그인/로그아웃
- [ ] 업소 임시저장 및 본인 업소만 업주센터에 표시되는지
- [ ] 타인의 업소 변경/서류 열람 차단
- [ ] 서류 미제출 시 심사 신청 거부
- [ ] 증빙서류 업로드, 관리자 서류 승인, 업소 승인
- [ ] 서류 미승인 시 DB 직접 호출을 통한 업소 승인 거부
- [ ] 승인 전 업소 비공개, 승인 후 상세/가격표/사진 표시
- [ ] 신고 제출 및 관리자 처리
- [ ] 광고 결제 버튼 비활성화 및 실결제 미발생
- [ ] 비공개 문서·사진 URL 접근통제 및 오류 처리
- [ ] 한국 업종별 법적 자격·표시광고 검토 및 개인정보/약관 문서 확인

## 주의
현재 소스는 실행 검증되지 않았고 운영 서비스가 아니다. 결제, 실제 광고 자동 활성화, 관리자 감사기록, 이메일 발송 설정, 개인정보·법적 요건 검증 등은 정식 오픈 전 추가 작업이 필요하다.
