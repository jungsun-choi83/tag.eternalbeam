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

notify pgrst, 'reload schema';

create table if not exists public.tag_scans (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null,
  kind text not null check (kind in ('view', 'notify')),
  created_at timestamptz not null default now()
);

create index if not exists tag_scans_tag_id_idx on public.tag_scans (tag_id);
create index if not exists tag_scans_created_at_idx on public.tag_scans (created_at desc);

-- Storage: public bucket (SQL로 생성하거나 대시보드에서 동일하게 생성)
insert into storage.buckets (id, name, public)
values ('pet-assets', 'pet-assets', true)
on conflict (id) do update set public = excluded.public;
