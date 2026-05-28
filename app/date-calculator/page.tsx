import { PageHeader } from "@/components/page-header";
import { ReportDateCalculator } from "@/components/tools/report-date-calculator";

export const metadata = {
  title: "날짜 계산기",
  description: "보고서 일정표에 쓰는 날짜와 주차를 계산합니다.",
};

export default function DateCalculatorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="날짜 계산기"
        description="기준일에서 +30일, 다음 주 금요일, 이번 달 마지막 날, ISO 주차를 바로 복사합니다."
      />
      <div className="mt-8">
        <ReportDateCalculator />
      </div>
    </div>
  );
}
