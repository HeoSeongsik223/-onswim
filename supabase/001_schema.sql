-- Run only on a NEW, dedicated Supabase project. Review before execution.
create extension if not exists pgcrypto;
create type public.shop_status as enum ('draft','pending_review','approved','rejected','suspended');
create type public.ad_order_status as enum ('pending_payment','paid','cancelled','refunded');
create type public.campaign_status as enum ('scheduled','active','paused','expired','cancelled');
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,display_name text,created_at timestamptz not null default now());
create table public.regions(id bigint generated always as identity primary key,parent_id bigint references public.regions(id),slug text not null unique,name text not null);
create table public.shops(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles(id),region_id bigint not null references public.regions(id),name text not null,slug text not null unique,address text not null,phone text,description text,status public.shop_status not null default 'draft',created_at timestamptz not null default now());
create table public.shop_services(id uuid primary key default gen_random_uuid(),shop_id uuid not null references public.shops(id) on delete cascade,name text not null,price_krw integer not null check(price_krw>=0),duration_minutes integer check(duration_minutes>0));
create table public.shop_images(id uuid primary key default gen_random_uuid(),shop_id uuid not null references public.shops(id) on delete cascade,storage_path text not null,sort_order integer not null default 0);
create table public.shop_documents(id uuid primary key default gen_random_uuid(),shop_id uuid not null references public.shops(id) on delete cascade,document_type text not null,storage_path text not null,review_status text not null default 'pending',created_at timestamptz not null default now());
create table public.ad_products(id uuid primary key default gen_random_uuid(),name text not null,price_krw integer not null check(price_krw>=0),duration_days integer not null check(duration_days>0),placement text not null,is_active boolean not null default false);
create table public.ad_slots(id uuid primary key default gen_random_uuid(),region_id bigint not null references public.regions(id),placement text not null,capacity integer not null check(capacity>0),unique(region_id,placement));
create table public.ad_orders(id uuid primary key default gen_random_uuid(),shop_id uuid not null references public.shops(id),product_id uuid not null references public.ad_products(id),amount_krw integer not null check(amount_krw>=0),status public.ad_order_status not null default 'pending_payment',created_at timestamptz not null default now());
create table public.payments(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.ad_orders(id),pg_payment_id text unique,status text not null,amount_krw integer not null check(amount_krw>=0),paid_at timestamptz);
create table public.ad_campaigns(id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.ad_orders(id),slot_id uuid not null references public.ad_slots(id),starts_at timestamptz not null,ends_at timestamptz not null,status public.campaign_status not null default 'scheduled',check(ends_at>starts_at));
create table public.ad_events(id bigint generated always as identity primary key,campaign_id uuid not null references public.ad_campaigns(id),event_type text not null check(event_type in ('impression','phone_click','detail_click')),created_at timestamptz not null default now());
create table public.reports(id uuid primary key default gen_random_uuid(),shop_id uuid not null references public.shops(id),reason text not null,status text not null default 'pending',created_at timestamptz not null default now());
create table public.admin_audit_logs(id bigint generated always as identity primary key,actor_id uuid references public.profiles(id),action text not null,target_id uuid,created_at timestamptz not null default now());
create table public.payment_webhook_events(id text primary key,provider text not null,received_at timestamptz not null default now());
-- Default deny on all public tables. Add only audited, task-specific policies.
do $$ declare t record; begin for t in select tablename from pg_tables where schemaname='public' loop execute format('alter table public.%I enable row level security',t.tablename); end loop; end $$;
create policy "approved shops public read" on public.shops for select to anon,authenticated using(status='approved');
create policy "regions public read" on public.regions for select to anon,authenticated using(true);
create policy "active ad products public read" on public.ad_products for select to anon,authenticated using(is_active=true);
-- Private shop data, orders, payments, documents and ad_events remain inaccessible via Data API.
-- Owner write APIs, admin approval, webhook verification, and ad scheduling are intentionally NOT implemented yet.
