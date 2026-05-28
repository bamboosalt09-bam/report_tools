import { PageHeader } from "@/components/page-header";
import { DocumentAssistant } from "@/components/tools/document-assistant";

export const metadata = {
  title: "문서 보조",
  description:
    "한영 오타 변환과 한글 더미 텍스트 생성을 한 곳에서 처리합니다.",
};

export default function WritingToolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="문서 보조"
        description="한영 오타를 되돌리고, 보고서나 공문 양식에 맞는 한글 더미 텍스트를 생성합니다."
      />
      <div className="mt-8">
        <DocumentAssistant />
      </div>
    </div>
  );
}
