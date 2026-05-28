import { PageHeader } from "@/components/page-header";
import { KeyboardLayoutConverter } from "@/components/tools/keyboard-layout-converter";

export const metadata = {
  title: "한영 오타 변환기",
  description:
    "키보드 입력 언어를 잘못 둔 채 입력한 문장을 한글 또는 영문 키 입력으로 변환합니다.",
};

export default function KeyboardConverterPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="한영 오타 변환기"
        description="한글과 영어 입력 상태를 잘못 둔 채 작성한 문장을 바로 되돌리고 복사합니다."
      />
      <div className="mt-8">
        <KeyboardLayoutConverter />
      </div>
    </div>
  );
}
