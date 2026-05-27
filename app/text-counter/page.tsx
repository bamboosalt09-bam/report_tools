import { PageHeader } from "@/components/page-header";
import { TextCounter } from "@/components/tools/text-counter";

export const metadata = {
  title: "글자수·나이스 바이트 검사",
  description:
    "공백 포함·미포함 글자수, 단어수, 나이스 기준 바이트 수를 한 번에 계산합니다.",
};

export default function TextCounterPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        title="글자수·나이스 바이트 검사"
        description="텍스트를 붙여넣으면 공백 포함·미포함 글자수, 단어수, 나이스 기준 바이트 수를 동시에 확인할 수 있습니다."
      />
      <div className="mt-8">
        <TextCounter />
      </div>
    </div>
  );
}
