# 온쉼 (가칭) — 전국 웰니스 광고 플랫폼 스타터

This is a **starter scaffold**, not a production-ready marketplace. It does not process payments, accept owner applications, or claim to verify shops.

## Start

1. Install Node.js 22+.
2. `npm install`
3. `npm run dev`
4. Visit `http://localhost:3000`.

## Supabase

Create a **new dedicated project**. Review `supabase/001_schema.sql` and run it on that new project only. Do not execute against an existing SpeedMarket project. Copy `.env.example` to `.env.local` after you are ready to connect Auth. The scaffold deliberately does not access Supabase until authentication, ownership checks, and safe server routes are built.

## Next tasks

- Seed verified national region codes and parent-child relationships.
- Add Supabase SSR authentication, owner-specific RLS, and separate admin authorization.
- Implement document uploads to private buckets, manual eligibility review, and owner dashboard.
- Implement verified PG payments, idempotent webhook processing, ad slot allocation and expiry.
- Test unauthorized access, payment replay, refunds, ad expiry, and shop suspension.

## Legal / operational

Accept only establishments whose actual services and required professional credentials/notifications are legally verified. A business registration certificate alone is insufficient. Obtain counsel review of eligibility, ad contract, refunds, privacy, and payment onboarding before launch.

## Phase 3 — review, documents, public listings
- Apply `supabase/003_review_and_documents.sql` to the **Onswim Production** project only (already applied in the connected project).
- A trusted database operator must grant administrator membership manually: `insert into public.admin_users(id) values ('<verified-auth-user-uuid>');`. Never expose this insert to a browser or public endpoint.
- Verification documents are private, max 10MB, PDF/JPEG/PNG/WEBP; owners can upload their own files, and admins can read via short-lived signed URLs.
- Approved shops are displayed in region lists and detail pages. No shop is auto-approved.
- Configure `.env.local` from `.env.example`; deploy as a separate Vercel project.
- Before launch: implement audit logging, legal verification checklist, report handling, ad payments, and production acceptance testing. Review Korean medical/안마 and other applicable business regulations with qualified counsel.


## 4차 기능
- 업주 임시저장 업소의 서비스명, 가격, 소요시간 등록/삭제
- 업주 사진 업로드 및 삭제 (비공개 shop-gallery bucket, 5MB 제한)
- 승인된 업소 상세페이지의 가격표와 10분 만료 서명 URL 사진
- 지역 목록의 업소명/주소 키워드 검색 (시군구 주소 문자열 검색)
- 승인 후 업주 변경 제한, 관리자 심사 필요
- 광고/결제, 시군구 정규화, 이미지 별도 승인, 운영환경 빌드 검증은 후속 작업


## 5차: 광고 카탈로그 / 관리자 요약
- `/ads`는 Supabase `ad_products`를 서버에서 읽어 예정 광고 상품을 표시합니다.
- 실제 결제 버튼은 비활성화되어 있으며 결제 성공, 자동 광고 활성화 기능은 구현되지 않았습니다.
- 관리자 화면에 업소 상태별 요약 통계를 추가했습니다.
- DB에서는 업주 자신의 주문/결제 조회만 허용하고, 결제/주문 생성 권한은 브라우저에 부여하지 않았습니다.
- 실제 결제 구현에는 PG 계약, 서버 측 결제 검증, 웹훅 서명/멱등성 검증, 환불 및 세금 정책 확정이 필요합니다.
- 홈페이지 빌드 및 배포는 별도 검증이 필요합니다.

## Phase 6: 고객 신고 / 관리자 신고 처리
- `app/components/ReportShop.tsx`: 로그인한 사용자의 업소 신고 제출
- `app/admin/page.tsx`: 관리자 신고 상태 관리 (`open`, `reviewing`, `resolved`, `dismissed`)
- Supabase migration `shop_reporting_moderation` applied to Onswim Production.
- 결제 연동은 아직 미구현. 신고 기능은 실제 사용자 계정으로 E2E 검증 필요.

## 7차 디자인 정리 (2026-10-31)
- 홈 메인 배너, 17개 지역 카드, 이용 안내, 업주센터 진입 영역 반응형 디자인 개선
- 사이트 이름을 온스윔으로 통일
- PG API 키가 없어 결제 기능은 계속 비활성화된 상태
- 이 환경에서는 npm 레지스트리 DNS 접근 실패(EAI_AGAIN)로 의존성 설치 및 빌드 테스트 미완료
- 실제 공개 전 회원가입·업소 등록·심사·사진·신고 흐름 E2E 검증 필요
