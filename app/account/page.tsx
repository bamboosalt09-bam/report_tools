import { AccountSettings } from "@/components/account/account-settings";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "계정 설정",
  description: "로그인 이메일, 닉네임, 비밀번호를 변경합니다.",
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="계정 설정"
        description="프롬프트 커뮤니티 계정의 닉네임, 이메일 아이디, 비밀번호를 변경합니다."
      />
      <div className="mt-8">
        <AccountSettings />
      </div>
    </div>
  );
}
