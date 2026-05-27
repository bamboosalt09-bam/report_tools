import { PageHeader } from "@/components/page-header";
import { PromptCommunity } from "@/components/prompts/prompt-community";

export const metadata = {
  title: "프롬프트 커뮤니티",
  description:
    "사용자가 직접 만든 AI 프롬프트를 공유하고 복사해서 사용할 수 있습니다.",
};

export default function PromptsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="프롬프트 커뮤니티"
        description="이메일 인증을 마친 사용자만 프롬프트를 등록할 수 있습니다. 공개된 프롬프트는 누구나 둘러보고 복사할 수 있습니다."
      />
      <div className="mt-8">
        <PromptCommunity />
      </div>
    </div>
  );
}
