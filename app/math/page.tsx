import { PageHeader } from "@/components/page-header";
import { EquationConverter } from "@/components/tools/equation-converter";

export const metadata = {
  title: "수식 변환",
  description: "LaTeX와 한글 수식편집기 문법을 서로 변환합니다.",
};

export default function MathPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="수식 변환"
        description="LaTeX 수식을 한글 수식편집기 문법으로 바꾸거나, 한글 수식 문법을 LaTeX로 되돌립니다."
      />
      <div className="mt-8">
        <EquationConverter />
      </div>
    </div>
  );
}
