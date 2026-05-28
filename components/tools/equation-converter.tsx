"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Check, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  convertHwpToLatexEquation,
  convertLatexToHwpEquation,
} from "@/lib/math/hwp-equation";

type EquationMode = "latex-to-hwp" | "hwp-to-latex";

const examples: Record<EquationMode, string> = {
  "latex-to-hwp":
    "\\frac{a+b}{c} + \\sqrt{x^2+1} + \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}",
  "hwp-to-latex": "{a+b} over {c} + sqrt {x^2+1} + sum _{i=1} ^{n} i",
};

function getModeLabel(mode: EquationMode): { input: string; output: string } {
  return mode === "latex-to-hwp"
    ? { input: "LaTeX", output: "한글 수식" }
    : { input: "한글 수식", output: "LaTeX" };
}

export function EquationConverter() {
  const [mode, setMode] = useState<EquationMode>("latex-to-hwp");
  const [input, setInput] = useState(examples["latex-to-hwp"]);
  const [copied, setCopied] = useState(false);

  const labels = getModeLabel(mode);
  const output = useMemo(() => {
    return mode === "latex-to-hwp"
      ? convertLatexToHwpEquation(input)
      : convertHwpToLatexEquation(input);
  }, [input, mode]);

  const handleModeChange = (nextMode: string) => {
    const typedMode = nextMode as EquationMode;
    setMode(typedMode);
    setInput(examples[typedMode]);
    setCopied(false);
  };

  const handleSwap = () => {
    setMode((current) =>
      current === "latex-to-hwp" ? "hwp-to-latex" : "latex-to-hwp"
    );
    setInput(output);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success("변환 결과를 복사했습니다.");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("브라우저 복사 권한을 확인하세요.");
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList>
              <TabsTrigger value="latex-to-hwp">LaTeX → 한글</TabsTrigger>
              <TabsTrigger value="hwp-to-latex">한글 → LaTeX</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleSwap}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              방향 전환
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setInput(examples[mode]);
                setCopied(false);
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              예시
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{labels.input}</CardTitle>
              <Badge variant="outline">입력</Badge>
            </div>
            <CardDescription>
              분수, 루트, 첨자, 그리스 문자, 행렬 일부를 변환합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setCopied(false);
              }}
              className="min-h-[360px] w-full resize-y rounded-md border border-input bg-background px-3 py-3 font-mono text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              spellCheck={false}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{labels.output}</CardTitle>
              <Badge variant="secondary">결과</Badge>
            </div>
            <CardDescription>
              한글 수식편집기 또는 AI 프롬프트에 붙여넣을 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              value={output}
              readOnly
              className="min-h-[360px] w-full resize-y rounded-md border border-input bg-muted/40 px-3 py-3 font-mono text-sm leading-relaxed outline-none"
              spellCheck={false}
            />
            <Button onClick={handleCopy} className="w-full">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  결과 복사
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
