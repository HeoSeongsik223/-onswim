-- Apply to Onswim only. Administrator membership must be assigned by trusted DB operator.
create table if not exists public.admin_users (
 id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create policy admin_self_read on public.admin_users for select to authenticated using(id=(select auth.uid()));
grant select on public.admin_users to authenticated;

create policy admin_review_shops_read on public.shops for select to authenticated using (
 exists(select 1 from public.admin_users a where a.id=(select auth.uid()))
);
create policy admin_review_shops_update on public.shops for update to authenticated using (
 exists(select 1 from public.admin_users a where a.id=(select auth.uid()))
) with check (
 exists(select 1 from public.admin_users a where a.id=(select auth.uid()))
);

create policy owner_documents_read on public.shop_documents for select to authenticated using (
 exists(select 1 from public.shops s where s.id=shop_id and s.owner_id=(select auth.uid()))
);
create policy owner_documents_insert on public.shop_documents for insert to authenticated with check (
 review_status='pending' and exists(select 1 from public.shops s where s.id=shop_id and s.owner_id=(select auth.uid()) and s.status in ('draft','pending_review'))
);
create policy admin_documents_read on public.shop_documents for select to authenticated using (
 exists(select 1 from public.admin_users a where a.id=(select auth.uid()))
);
create policy admin_documents_update on public.shop_documents for update to authenticated using (
 exists(select 1 from public.admin_users a where a.id=(select auth.uid()))
) with check (
 exists(select 1 from public.admin_users a where a.id=(select auth.uid()))
);
grant select,insert,update on public.shop_documents to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('shop-verification','shop-verification',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
-- Upload key format: shop UUID / user UUID / random filename
create policy shop_verification_owner_upload on storage.objects for insert to authenticated with check (
 bucket_id='shop-verification'
 and (storage.foldername(name))[2]=(select auth.uid())::text
 and exists(select 1 from public.shops s where s.id::text=(storage.foldername(name))[1] and s.owner_id=(select auth.uid()) and s.status in ('draft','pending_review'))
);
create policy shop_verification_owner_read on storage.objects for select to authenticated using (
 bucket_id='shop-verification'
 and (storage.foldername(name))[2]=(select auth.uid())::text
 and exists(select 1 from public.shops s where s.id::text=(storage.foldername(name))[1] and s.owner_id=(select auth.uid()))
);
create policy shop_verification_admin_read on storage.objects for select to authenticated using (
 bucket_id='shop-verification' and exists(select 1 from public.admin_users a where a.id=(select auth.uid()))
);
