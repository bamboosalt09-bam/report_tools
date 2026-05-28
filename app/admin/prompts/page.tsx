import { AdminPromptManager } from "@/components/admin/admin-prompt-manager";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "프롬프트 관리",
  description: "관리자 계정으로 프롬프트 공개 상태를 관리합니다.",
};

export default function AdminPromptsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="프롬프트 관리"
        description="관리자는 등록된 프롬프트를 전체 조회하고, 부적절한 프롬프트를 숨김 처리하거나 삭제할 수 있습니다."
      />
      <div className="mt-8">
        <AdminPromptManager />
      </div>
    </div>
  );
}
