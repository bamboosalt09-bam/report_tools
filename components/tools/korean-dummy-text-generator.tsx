"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardCopy, FileText, RefreshCw, Shuffle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  dummyTextCategories,
  getDummyTextCategory,
  type DummyTextCategory,
} from "@/lib/korean-dummy-text";

type OutputFormat = "paragraph" | "lines" | "bullets";

function clampCount(value: string): number {
  const parsed = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), 30);
}

function shuffleItems(items: string[]): string[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

function pickItems(category: DummyTextCategory, count: number, shuffle: boolean) {
  const pool = shuffle ? shuffleItems(category.items) : category.items;
  const selected: string[] = [];

  for (let index = 0; index < count; index++) {
    selected.push(pool[index % pool.length]);
  }

  return selected;
}

function formatItems(items: string[], format: OutputFormat): string {
  if (format === "lines") return items.join("\n");
  if (format === "bullets") return items.map((item) => `- ${item}`).join("\n");

  return items.join(" ");
}

function buildText(
  category: DummyTextCategory,
  count: number,
  format: OutputFormat,
  shuffle = false
): string {
  return formatItems(pickItems(category, count, shuffle), format);
}

export function KoreanDummyTextGenerator() {
  const [categoryId, setCategoryId] = useState("report");
  const [count, setCount] = useState("5");
  const [format, setFormat] = useState<OutputFormat>("paragraph");
  const [output, setOutput] = useState(() =>
    buildText(getDummyTextCategory("report"), 5, "paragraph")
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const category = useMemo(() => getDummyTextCategory(categoryId), [categoryId]);
  const countValue = clampCount(count);

  const generate = (shuffle = false) => {
    const nextOutput = buildText(category, countValue, format, shuffle);
    setOutput(nextOutput);
    setCopiedKey(null);
  };

  const copy = async (text: string, key: string) => {
    if (!text.trim()) {
      toast.error("복사할 문구가 없습니다.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("문구를 복사했습니다.");
      window.setTimeout(() => setCopiedKey(null), 1400);
    } catch {
      toast.error("브라우저 복사 권한을 확인하세요.");
    }
  };

  const handleCategoryChange = (nextCategoryId: string) => {
    const nextCategory = getDummyTextCategory(nextCategoryId);
    setCategoryId(nextCategoryId);
    setOutput(buildText(nextCategory, countValue, format));
    setCopiedKey(null);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            한글 더미 텍스트 생성
          </CardTitle>
          <CardDescription>
            보고서, 공문, 기획서 양식 점검에 쓸 수 있는 중립 문장과 어구를 추천합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1.5fr_120px_150px]">
            <div className="space-y-2">
              <Label htmlFor="dummy-category">문구 유형</Label>
              <select
                id="dummy-category"
                value={categoryId}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {dummyTextCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {category.description}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dummy-count">문장 수</Label>
              <Input
                id="dummy-count"
                inputMode="numeric"
                value={count}
                onChange={(event) => setCount(String(clampCount(event.target.value)))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dummy-format">출력 형식</Label>
              <select
                id="dummy-format"
                value={format}
                onChange={(event) => setFormat(event.target.value as OutputFormat)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="paragraph">문단</option>
                <option value="lines">줄바꿈</option>
                <option value="bullets">목록</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => generate(false)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              생성
            </Button>
            <Button variant="outline" onClick={() => generate(true)}>
              <Shuffle className="mr-2 h-4 w-4" />
              섞어서 생성
            </Button>
            <Button variant="outline" onClick={() => copy(output, "output")}>
              {copiedKey === "output" ? (
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

          <div className="space-y-2">
            <Label htmlFor="dummy-output">생성 결과</Label>
            <textarea
              id="dummy-output"
              value={output}
              onChange={(event) => {
                setOutput(event.target.value);
                setCopiedKey(null);
              }}
              className="min-h-[240px] w-full resize-y rounded-md border border-input bg-muted/40 px-3 py-3 text-base leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>추천 문구</CardTitle>
          <CardDescription>
            현재 선택한 유형에서 자주 쓰기 좋은 문장을 개별 복사할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {category.items.map((item, index) => {
              const key = `${category.id}-${index}`;

              return (
                <div
                  key={key}
                  className="flex min-h-24 flex-col justify-between gap-3 rounded-md border bg-background p-3"
                >
                  <p className="text-sm leading-relaxed">{item}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="self-end"
                    onClick={() => copy(item, key)}
                  >
                    {copiedKey === key ? (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="mr-1 h-4 w-4" />
                        복사
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
