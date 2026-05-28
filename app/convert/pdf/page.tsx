import { PageHeader } from "@/components/page-header";
import { PdfTools } from "@/components/converters/pdf-tools";

export const metadata = {
  title: "PDF 도구",
  description: "PDF 병합, 분할, 회전, 압축, 이미지에서 PDF 만들기.",
};

export default function PdfPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        title="PDF 도구"
        description="PDF 병합·분할·회전·압축, 이미지를 PDF로 변환할 수 있습니다."
      />
      <div className="mt-8">
        <PdfTools />
      </div>
    </div>
  );
}
