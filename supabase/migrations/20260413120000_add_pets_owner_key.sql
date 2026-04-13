-- 견주 관리 URL (?owner=)용. 기존 DB에도 안전하게 적용됩니다.
alter table public.pets add column if not exists owner_key text;

-- PostgREST 스키마 캐시 갱신 (컬럼 추가 직후 API가 인식하도록)
notify pgrst, 'reload schema';
