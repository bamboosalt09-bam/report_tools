"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardCopy, Keyboard, RotateCcw, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  convertEnglishKeysToKorean,
  convertKoreanToEnglishKeys,
  guessKeyboardConversion,
} from "@/lib/korean-keyboard";

type ConvertMode = "auto" | "to-korean" | "to-english";

const examples = [
  { label: "dkssudgktpdy", value: "dkssudgktpdy" },
  { label: "ㅗ디ㅣㅐ", value: "ㅗ디ㅣㅐ" },
  { label: "rhk제", value: "rhk제" },
];

function convertByMode(input: string, mode: ConvertMode): string {
  if (mode === "to-korean") return convertEnglishKeysToKorean(input);
  if (mode === "to-english") return convertKoreanToEnglishKeys(input);

  return guessKeyboardConversion(input) === "to-korean"
    ? convertEnglishKeysToKorean(input)
    : convertKoreanToEnglishKeys(input);
}

export function KeyboardLayoutConverter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ConvertMode>("auto");
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => convertByMode(input, mode), [input, mode]);
  const detectedMode = useMemo(() => guessKeyboardConversion(input), [input]);

  const copyOutput = async () => {
    if (!output.trim()) {
      toast.error("복사할 변환 결과가 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success("변환 결과를 복사했습니다.");
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("브라우저 복사 권한을 확인하세요.");
    }
  };

  const reset = () => {
    setInput("");
    setCopied(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            한영 오타 변환
          </CardTitle>
          <CardDescription>
            키보드 입력 언어를 잘못 둔 채 친 문장을 한글 또는 영문 키 입력으로 되돌립니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "auto" ? "secondary" : "outline"}
              onClick={() => setMode("auto")}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              자동 추정
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "to-korean" ? "secondary" : "outline"}
              onClick={() => setMode("to-korean")}
            >
              영문 키 → 한글
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "to-english" ? "secondary" : "outline"}
              onClick={() => setMode("to-english")}
            >
              한글 → 영문 키
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="keyboard-input">입력</Label>
              <textarea
                id="keyboard-input"
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setCopied(false);
                }}
                placeholder="예: dkssudgktpdy 또는 ㅗ디ㅣㅐ"
                className="min-h-[260px] w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-base leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="keyboard-output">변환 결과</Label>
                <span className="text-xs text-muted-foreground">
                  {mode === "auto"
                    ? detectedMode === "to-korean"
                      ? "자동: 영문 키 → 한글"
                      : "자동: 한글 → 영문 키"
                    : mode === "to-korean"
                      ? "영문 키 → 한글"
                      : "한글 → 영문 키"}
                </span>
              </div>
              <textarea
                id="keyboard-output"
                value={output}
                readOnly
                className="min-h-[260px] w-full resize-y rounded-md border border-input bg-muted/40 px-3 py-3 text-base leading-relaxed outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {examples.map((example) => (
                <Button
                  key={example.value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInput(example.value)}
                >
                  {example.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                초기화
              </Button>
              <Button onClick={copyOutput}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    결과 복사
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
