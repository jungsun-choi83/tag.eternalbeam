-- 견주 스캔 SMS 발송 간격 제한(동일 trigger 기준). 서비스 롤 API만 씁니다.

create table if not exists public.owner_scan_sms_log (
  id uuid primary key default gen_random_uuid(),
  tag_id text not null,
  trigger text not null check (trigger in ('view', 'notify')),
  created_at timestamptz not null default now()
);

create index if not exists owner_scan_sms_log_tag_trigger_created_idx
  on public.owner_scan_sms_log (tag_id, trigger, created_at desc);

alter table public.owner_scan_sms_log enable row level security;
