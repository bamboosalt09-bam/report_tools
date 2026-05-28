import Link from "next/link";
import {
  Image as ImageIcon,
  FileType,
  FileText,
  Sparkles,
  ArrowRight,
  Zap,
  ShieldCheck,
  Calculator,
  Eraser,
  CalendarDays,
  Keyboard,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tools = [
  {
    href: "/text-counter",
    title: "글자수·바이트 검사",
    description:
      "공백 포함·미포함 글자수, 단어수, 나이스 기준 바이트 수를 한 번에 확인합니다.",
    icon: FileText,
  },
  {
    href: "/prompts",
    title: "프롬프트 커뮤니티",
    description:
      "사용자가 직접 만든 AI 프롬프트를 공유하고 복사해서 사용할 수 있습니다.",
    icon: Sparkles,
  },
  {
    href: "/convert/pdf",
    title: "PDF 도구",
    description:
      "PDF 병합·분할·회전·압축, 이미지에서 PDF 생성. 페이지별 분할도 가능합니다.",
    icon: FileType,
  },
  {
    href: "/convert/image",
    title: "이미지 변환",
    description:
      "JPG, PNG, WebP, AVIF, HEIC 간 변환과 리사이징, 회전을 지원합니다.",
    icon: ImageIcon,
  },
  {
    href: "/writing-tools",
    title: "문서 보조",
    description:
      "한영 오타 변환과 한글 더미 텍스트 생성을 한 곳에서 처리합니다.",
    icon: Keyboard,
  },
  {
    href: "/math",
    title: "수식 변환",
    description:
      "LaTeX 수식과 한글 수식편집기 문법을 서로 변환하고 바로 복사합니다.",
    icon: Calculator,
  },
  {
    href: "/plain-text",
    title: "서식 지우기",
    description:
      "웹에서 복사한 글의 배경색, 링크, 폰트 서식을 제거하고 순수 텍스트로 정리합니다.",
    icon: Eraser,
  },
  {
    href: "/date-calculator",
    title: "날짜 계산기",
    description:
      "+30일, 이번 주 금요일, 월말 날짜와 ISO 주차를 바로 계산하고 복사합니다.",
    icon: CalendarDays,
  },
];

const features = [
  {
    icon: Zap,
    title: "입력 즉시 계산",
    description:
      "붙여넣는 순간 공백 포함·미포함, 단어수, 바이트 수를 바로 계산합니다.",
  },
  {
    icon: ShieldCheck,
    title: "100% 브라우저 처리",
    description:
      "텍스트와 파일은 서버로 전송하지 않습니다. 모든 작업은 본인 컴퓨터에서만 진행합니다.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          글자수 검사와 파일 작업을
          <br />
          <span className="text-primary">한 곳에서 빠르게</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
          공백 포함·미포함 글자수, 단어수, 나이스 바이트 검사부터
          <br className="hidden md:block" />
          이미지 변환과 PDF 작업까지 설치 없이 처리하세요.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/text-counter">
              글자수 검사하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/prompts">프롬프트 둘러보기</Link>
          </Button>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-16">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          제공 도구
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className="group">
                <Card className="h-full transition-all hover:border-foreground/30 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <CardTitle className="mt-3 flex items-center justify-between text-base">
                      <span>{tool.title}</span>
                      <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </CardTitle>
                    <CardDescription className="leading-relaxed">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trust badges */}
      <section className="pb-24">
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="flex gap-4 rounded-lg border border-border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
