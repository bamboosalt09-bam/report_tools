import { PageHeader } from "@/components/page-header";
import { ImageConverter } from "@/components/converters/image-converter";

export const metadata = {
  title: "이미지 변환",
  description: "JPG, PNG, WebP, AVIF, HEIC 간 자유로운 변환과 리사이징.",
};

export default function ImageConvertPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        title="이미지 변환"
        description="JPG, PNG, WebP, AVIF, HEIC 포맷 간 변환과 리사이징을 지원합니다. 여러 장 동시 변환 가능."
      />
      <div className="mt-8">
        <ImageConverter />
      </div>
    </div>
  );
}
