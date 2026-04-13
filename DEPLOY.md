# tag.eternalbeam.com 배포 (Vercel · GitHub · Supabase · 예스닉)

저장소에는 CI·Vercel 메타만 포함되어 있습니다. **도메인 연결·비밀키는 각 서비스 대시보드**에서 한 번씩 설정해야 합니다.

## 0. 도메인에 예전 앱·예전 화면이 뜰 때 (가장 흔한 원인)

DNS가 Vercel을 가리키더라도, **도메인이 “예전에 만든 다른 Vercel 프로젝트”에 붙어 있으면** 지금 이 저장소 코드가 아닌 배포가 열립니다. 아래 순서로 맞춥니다.

1. [Vercel Dashboard](https://vercel.com/dashboard) 상단 **Domains** 메뉴에서 `tag.eternalbeam.com`을 검색합니다.
2. 어떤 **프로젝트 이름**에 연결돼 있는지 확인합니다.
3. **이 GitHub 저장소(`tag.eternalbeam`)를 배포하는 프로젝트가 아니라면:**
   - 그 **예전 프로젝트** → **Settings → Domains** → `tag.eternalbeam.com` **제거(Remove)**
   - **새/올바른 프로젝트**(이 레포를 Import한 것) → **Settings → Domains** → `tag.eternalbeam.com` **추가**
4. 같은 화면에서 **Git 연결**이 이 저장소인지, **Production Branch**가 `main`(또는 실제 쓰는 브랜치)인지 확인합니다.
5. **Deployments**에서 최신 커밋이 **Production**으로 올라갔는지 보고, 필요하면 **Redeploy**합니다.

한 Vercel 계정에 동일 도메인은 **프로젝트 하나에만** 붙을 수 있습니다. 예전 프로젝트에서 빼야 새 프로젝트에 넣을 수 있습니다.

## 1. 예스닉 (DNS)

1. Vercel 프로젝트에 먼저 도메인을 추가합니다 (아래 2번). Vercel이 **권장 DNS 레코드**(CNAME 등)를 보여줍니다.
2. 예스닉 관리자에서 `eternalbeam.com` DNS 설정으로 들어갑니다.
3. **서브도메인 `tag`** 용으로 Vercel이 안내한 값을 넣습니다. 일반적인 예:
   - **유형:** CNAME  
   - **호스트/이름:** `tag` (또는 패널에 따라 `tag.eternalbeam.com`)  
   - **값/목적지:** Vercel에 표시된 대상 (예: `cname.vercel-dns.com` 또는 프로젝트별 호스트)
4. 전파까지 수 분~48시간 걸릴 수 있습니다. Vercel **Domains**에서 “Valid Configuration”이 될 때까지 기다립니다.

## 2. Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → GitHub에서 이 저장소를 연결합니다.
2. **Settings → Domains** → `tag.eternalbeam.com` 추가 후 DNS를 예스닉에 맞춥니다.
3. **Settings → Environment Variables** (Production에 설정)

| 이름 | 값 |
|------|-----|
| `NEXT_PUBLIC_APP_URL` | `https://tag.eternalbeam.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** 키 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (선택) anon 키 |
| `SUPABASE_PET_BUCKET` | `pet-assets` (변경 시 동일 값) |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 **라이브** 클라이언트 키(실결제 시) |
| `TOSS_SECRET_KEY` | 토스 **라이브** 시크릿 |
| `TOSS_PAYMENT_AMOUNT` | 원하는 결제 금액(원) |
| `TAG_OWNER_RESET_SECRET` | (선택) 아래「견주 링크 분실」용. 없으면 해당 API는 비활성 |

4. **Redeploy** 한 번 실행합니다.

### 견주 `?owner=` 링크를 잃었을 때 (운영자 전용)

1. Vercel에 **`TAG_OWNER_RESET_SECRET`** 에 **길고 예측 불가능한 문자열**을 넣고 재배포합니다.
2. 아래처럼 **HTTPS POST**로만 호출합니다 (브라우저 주소창이 아님).

```bash
curl -sS -X POST "https://tag.eternalbeam.com/api/pet/owner-reset" \
  -H "Content-Type: application/json" \
  -d "{\"tagId\":\"demo\",\"secret\":\"여기에_TAG_OWNER_RESET_SECRET_값\"}"
```

3. 응답이 `{"ok":true,"tagId":"demo"}` 이면 해당 태그의 **`owner_key`가 비워진** 상태입니다. 이후 **`/tag/demo/register`** 로 다시 들어가 처음처럼 등록하면 **새 견주 링크**가 발급됩니다.

**주의:** 이 비밀값을 아는 사람은 누구나 해당 태그의 견주 링크를 무력화할 수 있으므로, **본인만 아는 값**으로 두고 Git·채팅에 올리지 마세요.

`NEXT_PUBLIC_APP_URL`은 결제 성공/실패 리다이렉트 등 서버가 만드는 절대 URL에 쓰이므로 **반드시** 프로덕션 도메인으로 맞춥니다.

## 3. GitHub

1. 저장소를 Vercel에 연결하면 푸시 시 자동 배포됩니다.
2. **CI에서 빌드**하려면 저장소 **Settings → Secrets and variables → Actions**에 다음을 추가합니다 (값은 Supabase 대시보드와 동일).

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

비밀키가 없으면 CI의 `npm run build` 단계에서 스킵하도록 바꿀 수 있습니다. 필요하면 워크플로를 수정하세요.

## 4. Supabase

1. **Project Settings → API**  
   - URL·anon·`service_role` 키를 복사해 Vercel 환경 변수에 넣습니다.
2. **Authentication → URL Configuration** (Auth를 쓰는 경우)  
   - **Site URL:** `https://tag.eternalbeam.com`  
   - **Redirect URLs:** `https://tag.eternalbeam.com/**` 등 실제 사용하는 경로 추가  
   이 앱은 주로 서버(service role)로 접근하지만, 나중에 클라이언트 Auth를 쓸 때를 대비해 맞춰 두는 것이 좋습니다.
3. **SQL**  
   - `supabase/schema.sql` 또는 `supabase/migrations/` 내용이 프로젝트에 적용돼 있는지 확인합니다.

## 5. 토스페이먼츠 (실결제 시)

- 토스 대시보드에서 **허용 도메인 / 웹훅 URL**에 `https://tag.eternalbeam.com` 관련 URL이 필요한지 확인합니다.
- 테스트 키(`test_ck_` 등)는 로컬용으로 두고, 프로덕션 Vercel에는 라이브 키만 넣는 것을 권장합니다.
