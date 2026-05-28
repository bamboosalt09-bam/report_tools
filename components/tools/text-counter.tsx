"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCopy, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextStats {
  charsWithSpaces: number;
  charsWithoutSpaces: number;
  words: number;
  neisBytes: number;
  lines: number;
  asciiBytes: number;
  nonAsciiChars: number;
  newlineBytes: number;
}

function countGraphemes(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text)).length;
  }
  return Array.from(text).length;
}

function countNeisBytes(text: string): Pick<
  TextStats,
  "neisBytes" | "asciiBytes" | "nonAsciiChars" | "newlineBytes"
> {
  let neisBytes = 0;
  let asciiBytes = 0;
  let nonAsciiChars = 0;
  let newlineBytes = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === "\r") {
      if (text[i + 1] === "\n") i++;
      neisBytes += 2;
      newlineBytes += 2;
      continue;
    }

    if (char === "\n") {
      neisBytes += 2;
      newlineBytes += 2;
      continue;
    }

    const codePoint = text.codePointAt(i) ?? 0;
    if (codePoint > 0xffff) i++;

    if (codePoint <= 0x7f) {
      neisBytes += 1;
      asciiBytes += 1;
    } else {
      neisBytes += 3;
      nonAsciiChars += 1;
    }
  }

  return { neisBytes, asciiBytes, nonAsciiChars, newlineBytes };
}

function getTextStats(text: string): TextStats {
  const charsWithSpaces = countGraphemes(text);
  const charsWithoutSpaces = countGraphemes(text.replace(/\s/g, ""));
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length;
  const byteStats = countNeisBytes(text);

  return {
    charsWithSpaces,
    charsWithoutSpaces,
    words,
    lines,
    ...byteStats,
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

const BYTE_LIMIT_STORAGE_KEY = "report-tools-neis-byte-limit";
const DEFAULT_BYTE_LIMIT = 1500;
const byteLimitPresets = [500, 1000, 1500, 2000];

function normalizeLimitInput(value: string): string {
  return value.replace(/[^\d]/g, "").slice(0, 7);
}

export function TextCounter() {
  const [text, setText] = useState("");
  const [limit, setLimit] = useState(String(DEFAULT_BYTE_LIMIT));
  const stats = useMemo(() => getTextStats(text), [text]);

  const byteLimit = Number.parseInt(limit, 10);
  const hasLimit = Number.isFinite(byteLimit) && byteLimit > 0;
  const ratio = hasLimit ? Math.min((stats.neisBytes / byteLimit) * 100, 100) : 0;
  const remaining = hasLimit ? byteLimit - stats.neisBytes : null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedLimit = window.localStorage.getItem(BYTE_LIMIT_STORAGE_KEY);
      if (savedLimit) {
        setLimit(normalizeLimitInput(savedLimit));
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasLimit) {
      window.localStorage.setItem(BYTE_LIMIT_STORAGE_KEY, String(byteLimit));
    }
  }, [byteLimit, hasLimit]);

  const handleCopySummary = async () => {
    const summary = [
      `공백 포함: ${stats.charsWithSpaces}`,
      `공백 미포함: ${stats.charsWithoutSpaces}`,
      `단어수: ${stats.words}`,
      `나이스 기준 바이트: ${stats.neisBytes}`,
      hasLimit ? `설정 제한: ${byteLimit} byte` : "설정 제한: 없음",
      remaining === null
        ? "제한 상태: 미설정"
        : remaining < 0
          ? `제한 상태: ${Math.abs(remaining)} byte 초과`
          : `제한 상태: ${remaining} byte 남음`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      toast.success("검사 결과를 복사했습니다");
    } catch {
      toast.error("복사 권한을 확인하세요");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="검사할 내용을 붙여넣으세요."
            className="min-h-[260px] w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-base leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Label htmlFor="byte-limit">나이스 바이트 제한</Label>
              <Input
                id="byte-limit"
                inputMode="numeric"
                value={limit}
                onChange={(event) =>
                  setLimit(normalizeLimitInput(event.target.value))
                }
                className="w-36"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {byteLimitPresets.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={limit === String(preset) ? "secondary" : "outline"}
                    size="xs"
                    onClick={() => setLimit(String(preset))}
                  >
                    {formatNumber(preset)}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                제출처 기준에 맞게 제한값을 직접 바꿀 수 있습니다.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopySummary}>
                <ClipboardCopy className="mr-2 h-4 w-4" />
                결과 복사
              </Button>
              <Button variant="ghost" onClick={() => setText("")}>
                <RotateCcw className="mr-2 h-4 w-4" />
                초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="공백 포함" value={stats.charsWithSpaces} unit="자" />
        <StatCard title="공백 미포함" value={stats.charsWithoutSpaces} unit="자" />
        <StatCard title="단어수" value={stats.words} unit="개" />
        <StatCard title="나이스 기준" value={stats.neisBytes} unit="byte" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            나이스 바이트 제한
            {hasLimit && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {formatNumber(byteLimit)} byte 기준
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={
                remaining !== null && remaining < 0
                  ? "h-full bg-destructive transition-all"
                  : "h-full bg-primary transition-all"
              }
              style={{ width: `${ratio}%` }}
            />
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              현재 {formatNumber(stats.neisBytes)} byte
            </span>
            {remaining !== null && (
              <span
                className={
                  remaining < 0 ? "font-medium text-destructive" : "text-muted-foreground"
                }
              >
                {remaining < 0
                  ? `${formatNumber(Math.abs(remaining))} byte 초과`
                  : `${formatNumber(remaining)} byte 남음`}
              </span>
            )}
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <p>줄 수: {formatNumber(stats.lines)}</p>
            <p>ASCII/공백/특수: {formatNumber(stats.asciiBytes)} byte</p>
            <p>한글·비ASCII: {formatNumber(stats.nonAsciiChars)}자</p>
          </div>
          <p className="text-xs text-muted-foreground">
            계산 기준: 영문·숫자·공백·일반 특수문자 1 byte, 한글 및 비ASCII 문자 3 byte, 줄바꿈 2 byte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  unit,
}: {
  title: string;
  value: number;
  unit: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">
          {formatNumber(value)}
          <span className="ml-1 text-sm font-medium text-muted-foreground">
            {unit}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
