-- 견주 웹 푸시 구독 + 발송 간격 로그 (서비스 롤 API 전용)

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

create table if not exists public.owner_webpush_sent_log (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null,
  trigger text not null check (trigger in ('view', 'notify')),
  created_at timestamptz not null default now()
);

create index if not exists owner_webpush_sent_log_tag_trigger_created_idx
  on public.owner_webpush_sent_log (tag_id, trigger, created_at desc);

alter table public.owner_webpush_sent_log enable row level security;
