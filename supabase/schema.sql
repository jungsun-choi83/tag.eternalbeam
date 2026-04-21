-- Run in Supabase SQL editor

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null unique,
  name text not null default '',
  phone text not null default '',
  description text not null default '',
  raw_image_url text,
  cutout_url text,
  final_image_url text,
  style text,
  paid boolean not null default false,
  /** 보호 정보용 대표 사진 (register) */
  image_url text,
  /** QR 스캔 시 view 로그 저장 여부 */
  notify_on_scan boolean not null default false,
  /** 견주 관리 URL (?owner=) 검증 */
  owner_key text,
  created_at timestamptz not null default now()
);

create index if not exists pets_tag_id_idx on public.pets (tag_id);

-- 기존 DB에 컬럼이 없을 때 (한 번만 실행해도 됩니다)
alter table public.pets add column if not exists image_url text;
alter table public.pets add column if not exists notify_on_scan boolean not null default false;
alter table public.pets add column if not exists owner_key text;
alter table public.pets add column if not exists owner_name text;

notify pgrst, 'reload schema';

create table if not exists public.tag_scans (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null,
  kind text not null check (kind in ('view', 'notify')),
  created_at timestamptz not null default now()
);

create index if not exists tag_scans_tag_id_idx on public.tag_scans (tag_id);
create index if not exists tag_scans_created_at_idx on public.tag_scans (created_at desc);

/** 견주 스캔 SMS 발송 간격 제한(동일 trigger 기준) */
create table if not exists public.owner_scan_sms_log (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null,
  trigger text not null check (trigger in ('view', 'notify')),
  created_at timestamptz not null default now()
);

create index if not exists owner_scan_sms_log_tag_trigger_created_idx
  on public.owner_scan_sms_log (tag_id, trigger, created_at desc);

alter table public.owner_scan_sms_log enable row level security;

/** 견주 기기별 웹 푸시 구독 (VAPID, 비용 없음) */
create table if not exists public.owner_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists owner_push_subscriptions_tag_id_idx on public.owner_push_subscriptions (tag_id);

alter table public.owner_push_subscriptions enable row level security;

/** 웹 푸시 발송 간격(태그·종류별) */
create table if not exists public.owner_webpush_sent_log (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null,
  trigger text not null check (trigger in ('view', 'notify')),
  created_at timestamptz not null default now()
);

create index if not exists owner_webpush_sent_log_tag_trigger_created_idx
  on public.owner_webpush_sent_log (tag_id, trigger, created_at desc);

alter table public.owner_webpush_sent_log enable row level security;

-- 발견자가 공유한 위치 (QR 조회 화면)
create table if not exists public.finder_locations (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists finder_locations_tag_id_idx on public.finder_locations (tag_id);
create index if not exists finder_locations_created_at_idx on public.finder_locations (created_at desc);

-- 발견자가 올린 현장 사진
create table if not exists public.finder_photos (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null,
  storage_path text not null,
  public_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists finder_photos_tag_id_idx on public.finder_photos (tag_id);

-- 발견자 메시지
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_tag_id_idx on public.messages (tag_id);
create index if not exists messages_created_at_idx on public.messages (created_at desc);

-- Storage: public bucket (SQL로 생성하거나 대시보드에서 동일하게 생성)
insert into storage.buckets (id, name, public)
values ('pet-assets', 'pet-assets', true)
on conflict (id) do update set public = excluded.public;
