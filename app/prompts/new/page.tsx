import { PageHeader } from "@/components/page-header";
import { PromptSubmitForm } from "@/components/prompts/prompt-submit-form";

export const metadata = {
  title: "프롬프트 등록",
  description: "이메일 인증을 마친 사용자가 새 프롬프트를 등록합니다.",
};

export default function NewPromptPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader
        title="프롬프트 등록"
        description="다른 사용자가 바로 복사해 쓸 수 있도록 제목, 설명, 본문을 구체적으로 작성하세요."
      />
      <div className="mt-8">
        <PromptSubmitForm />
      </div>
    </div>
  );
}
