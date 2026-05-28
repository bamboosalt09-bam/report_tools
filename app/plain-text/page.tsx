import { PageHeader } from "@/components/page-header";
import { PlainTextCleaner } from "@/components/tools/plain-text-cleaner";

export const metadata = {
  title: "서식 지우기",
  description: "웹에서 복사한 글의 HTML, 폰트, 링크 서식을 제거합니다.",
};

export default function PlainTextPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader
        title="서식 지우기"
        description="뉴스, 블로그, PDF에서 복사한 글을 보고서에 붙여넣기 좋은 순수 텍스트로 정리합니다."
      />
      <div className="mt-8">
        <PlainTextCleaner />
      </div>
    </div>
  );
}
