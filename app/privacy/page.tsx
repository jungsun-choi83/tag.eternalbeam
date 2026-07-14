import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 · ETERNAL BEAM",
};

export default function PrivacyPage() {
  return (
    <main className="animate-fade-in space-y-8 pb-6">
      <header>
        <Link href="/" className="text-sm text-[#c4a85a] underline underline-offset-4">
          ← 홈
        </Link>
        <h1 className="mt-4 text-2xl font-light text-white">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">시행일: 2026년 7월 14일</p>
      </header>

      <article className="space-y-6 text-[14px] leading-relaxed text-[#b8ae9e]">
        <section className="space-y-2">
          <h2 className="text-base font-medium text-[#f0e6c8]">1. 개인정보처리자</h2>
          <p>
            본 서비스의 개인정보처리자는 <strong className="text-[#ebe4d8]">주식회사 토일렛 아카이브</strong>
            (이하 &quot;회사&quot;)입니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium text-[#f0e6c8]">2. 처리하는 개인정보 항목</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>반려동물 보호 정보: 아이 이름, 보호자 연락처, 보호자 이름(선택), 메모, 대표 사진</li>
            <li>발견자 제공 정보: 위치, 사진, 메시지(이용 시)</li>
            <li>기술 정보: 태그 ID, 스캔 기록, 접속 로그, 알림 구독 정보(선택)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium text-[#f0e6c8]">3. 처리 목적</h2>
          <p>분실·발견 상황에서 보호자 연락, 태그 기반 정보 제공, 스캔 알림, 서비스 운영·보안</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium text-[#f0e6c8]">4. 보관 기간</h2>
          <p>
            보호 정보는 태그 이용 기간 동안 보관하며, 회원 탈퇴·삭제 요청·서비스 종료 시 지체 없이 파기합니다. 관련
            법령에 따른 보관이 필요한 경우 해당 기간 동안 보관할 수 있습니다.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/[0.06] px-4 py-4">
          <h2 className="text-base font-medium text-[#f0e6c8]">5. 개인정보 처리위탁 (클라우드 저장)</h2>
          <p>회사는 안정적인 서비스 제공을 위해 아래와 같이 개인정보 처리업무를 위탁합니다.</p>
          <table className="mt-2 w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/10 text-[#9a9288]">
                <th className="py-2 pr-3">수탁자</th>
                <th className="py-2">위탁 업무</th>
              </tr>
            </thead>
            <tbody className="text-[#c9bfb0]">
              <tr className="border-b border-white/6">
                <td className="py-2.5 pr-3 align-top">Supabase, Inc.</td>
                <td className="py-2.5 align-top">
                  데이터베이스·파일(사진) 클라우드 저장, 백업, 접근 제어. 저장 리전은 Supabase 프로젝트 설정에 따릅니다.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 align-top">Vercel Inc.</td>
                <td className="py-2.5 align-top">웹 애플리케이션 호스팅·전송</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[12px] text-[#8a8278]">
            업로드된 사진·보호 정보는 Supabase Storage 버킷(pet-assets)에 저장됩니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium text-[#f0e6c8]">6. 이용자 권리</h2>
          <p>
            이용자는 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다. 문의는 서비스 내 연락 채널 또는 회사
            고객지원으로 요청해 주세요.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium text-[#f0e6c8]">7. 기기 접근 권한</h2>
          <p>
            사진 업로드(카메라·앨범), 위치 공유(위치), 스캔 알림(브라우저 알림) 기능은 각각 해당 권한 동의 후에만
            사용됩니다. 권한은 기기 설정에서 변경·철회할 수 있습니다.
          </p>
        </section>
      </article>
    </main>
  );
}
