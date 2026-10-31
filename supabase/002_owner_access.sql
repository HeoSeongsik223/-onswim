-- Applied to Onswim Production on 2026-10-31.
-- Region seed and owner access policies.
insert into public.regions(name,slug) values
('서울','seoul'),('부산','busan'),('대구','daegu'),('인천','incheon'),('광주','gwangju'),('대전','daejeon'),('울산','ulsan'),('세종','sejong'),('경기','gyeonggi'),('강원','gangwon'),('충북','chungbuk'),('충남','chungnam'),('전북','jeonbuk'),('전남','jeonnam'),('경북','gyeongbuk'),('경남','gyeongnam'),('제주','jeju') on conflict do nothing;
create policy owner_shops_update on public.shops for update to authenticated
using(owner_id=(select auth.uid()) and status in ('draft','pending_review'))
with check(owner_id=(select auth.uid()) and status in ('draft','pending_review'));
grant select on public.regions to anon,authenticated;
grant select,insert,update on public.shops to authenticated;
grant select on public.shops to anon;
grant select on public.ad_products to anon,authenticated;
