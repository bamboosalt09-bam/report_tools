"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ClipboardCopy, Eraser, RotateCcw } from "lucide-react";
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

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function extractTextFromHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  doc.querySelectorAll("script, style, noscript, svg").forEach((node) => {
    node.remove();
  });

  return doc.body.innerText || doc.body.textContent || "";
}

function normalizePlainText(text: string, removeLineBreaks: boolean): string {
  const normalized = text
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ");

  if (removeLineBreaks) {
    return normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return normalized
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanTextSource(html: string, visibleText: string, removeLineBreaks: boolean): string {
  const source = looksLikeHtml(visibleText) ? visibleText : html;
  const rawText = looksLikeHtml(source) ? extractTextFromHtml(source) : visibleText;

  return normalizePlainText(rawText, removeLineBreaks);
}

export function PlainTextCleaner() {
  const inputRef = useRef<HTMLDivElement>(null);
  const [output, setOutput] = useState("");
  const [removeLineBreaks, setRemoveLineBreaks] = useState(false);
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    return {
      chars: Array.from(output).length,
      lines: output.length === 0 ? 0 : output.split(/\n/).length,
    };
  }, [output]);

  const clean = () => {
    const input = inputRef.current;
    if (!input) return "";

    const cleaned = cleanTextSource(
      input.innerHTML,
      input.innerText,
      removeLineBreaks
    );

    setOutput(cleaned);
    setCopied(false);
    return cleaned;
  };

  const handleCopy = async () => {
    const cleaned = clean();

    if (!cleaned) {
      toast.error("정리할 텍스트를 붙여넣으세요.");
      return;
    }

    try {
      await navigator.clipboard.writeText(cleaned);
      setCopied(true);
      toast.success("순수 텍스트를 복사했습니다.");
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("브라우저 복사 권한을 확인하세요.");
    }
  };

  const handleReset = () => {
    if (inputRef.current) inputRef.current.innerHTML = "";
    setOutput("");
    setCopied(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>붙여넣기</CardTitle>
          <CardDescription>
            뉴스, 블로그, PDF, 웹페이지에서 복사한 내용을 그대로 붙여넣으세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            ref={inputRef}
            contentEditable
            role="textbox"
            aria-label="서식 제거 입력"
            className="min-h-[260px] w-full overflow-auto rounded-md border border-input bg-background px-3 py-3 text-base leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring empty:before:text-muted-foreground empty:before:content-['여기에_붙여넣기']"
            suppressContentEditableWarning
          />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={removeLineBreaks}
                onChange={(event) => setRemoveLineBreaks(event.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              줄바꿈 제거
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={clean}>
                <Eraser className="mr-2 h-4 w-4" />
                서식 지우기
              </Button>
              <Button onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    지우고 복사
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>순수 텍스트</CardTitle>
          <CardDescription>
            글자 {stats.chars.toLocaleString("ko-KR")}자 · 줄{" "}
            {stats.lines.toLocaleString("ko-KR")}개
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="plain-text-output" className="sr-only">
            정리된 텍스트
          </Label>
          <textarea
            id="plain-text-output"
            value={output}
            onChange={(event) => setOutput(event.target.value)}
            className="min-h-[260px] w-full resize-y rounded-md border border-input bg-muted/40 px-3 py-3 text-base leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </CardContent>
      </Card>
    </div>
  );
}
