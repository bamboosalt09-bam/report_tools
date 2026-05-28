import { PageHeader } from "@/components/page-header";
import { KoreanDummyTextGenerator } from "@/components/tools/korean-dummy-text-generator";

export const metadata = {
  title: "한글 더미 텍스트",
  description:
    "보고서, 공문, 기획서 양식 점검에 쓰기 좋은 한글 더미 문장과 어구를 생성합니다.",
};

export default function DummyTextPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="한글 더미 텍스트"
        description="보고서나 공문 양식을 맞추고 분량을 확인할 때 쓸 수 있는 중립 문장과 어구를 추천합니다."
      />
      <div className="mt-8">
        <KoreanDummyTextGenerator />
      </div>
    </div>
  );
}
