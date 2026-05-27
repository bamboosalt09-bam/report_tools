import { PageHeader } from "@/components/page-header";
import { PromptDetail } from "@/components/prompts/prompt-detail";

export const metadata = {
  title: "프롬프트 상세",
};

export default async function PromptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        title="프롬프트 상세"
        description="공유된 프롬프트를 확인하고 복사할 수 있습니다."
      />
      <div className="mt-8">
        <PromptDetail promptId={id} />
      </div>
    </div>
  );
}
