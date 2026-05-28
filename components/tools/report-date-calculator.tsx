"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, ClipboardCopy, RotateCcw } from "lucide-react";
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

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

interface DateResult {
  id: string;
  title: string;
  value: string;
  detail: string;
  copyText: string;
}

function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayInputValue(): string {
  return toDateInputValue(new Date());
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function mondayOfWeek(date: Date): Date {
  const offset = (date.getDay() + 6) % 7;
  return addDays(date, -offset);
}

function nextWeekFriday(date: Date): Date {
  return addDays(mondayOfWeek(date), 11);
}

function formatDate(date: Date): string {
  return toDateInputValue(date);
}

function formatDateWithWeekday(date: Date): string {
  return `${formatDate(date)} (${weekdays[date.getDay()]})`;
}

function getIsoWeek(date: Date): { year: number; week: number } {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );

  return { year: target.getUTCFullYear(), week };
}

function formatIsoWeek(date: Date): string {
  const { year, week } = getIsoWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function buildResults(baseDate: Date): DateResult[] {
  const plusThirty = addDays(baseDate, 30);
  const nextFriday = nextWeekFriday(baseDate);
  const monthEnd = endOfMonth(baseDate);
  const weekStart = mondayOfWeek(baseDate);
  const weekEnd = addDays(weekStart, 4);

  return [
    {
      id: "today",
      title: "기준일",
      value: formatDateWithWeekday(baseDate),
      detail: "선택한 기준 날짜",
      copyText: formatDateWithWeekday(baseDate),
    },
    {
      id: "plus-30",
      title: "+30일",
      value: formatDateWithWeekday(plusThirty),
      detail: "기준일에서 30일 뒤",
      copyText: formatDateWithWeekday(plusThirty),
    },
    {
      id: "next-friday",
      title: "다음 주 금요일",
      value: formatDateWithWeekday(nextFriday),
      detail: "기준 주의 다음 주 금요일",
      copyText: formatDateWithWeekday(nextFriday),
    },
    {
      id: "month-end",
      title: "이번 달 마지막 날",
      value: formatDateWithWeekday(monthEnd),
      detail: "기준일이 속한 달의 말일",
      copyText: formatDateWithWeekday(monthEnd),
    },
    {
      id: "iso-week",
      title: "ISO 주차",
      value: formatIsoWeek(baseDate),
      detail: `${formatDateWithWeekday(weekStart)} ~ ${formatDateWithWeekday(
        weekEnd
      )}`,
      copyText: formatIsoWeek(baseDate),
    },
  ];
}

export function ReportDateCalculator() {
  const [baseDateValue, setBaseDateValue] = useState(todayInputValue);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const baseDate = useMemo(() => parseDateInput(baseDateValue), [baseDateValue]);
  const results = useMemo(() => buildResults(baseDate), [baseDate]);

  const copy = async (result: DateResult) => {
    try {
      await navigator.clipboard.writeText(result.copyText);
      setCopiedId(result.id);
      toast.success("날짜를 복사했습니다.");
      window.setTimeout(() => setCopiedId(null), 1400);
    } catch {
      toast.error("브라우저 복사 권한을 확인하세요.");
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <Label htmlFor="base-date">기준일</Label>
            <Input
              id="base-date"
              type="date"
              value={baseDateValue}
              onChange={(event) => setBaseDateValue(event.target.value)}
              className="w-[180px]"
            />
          </div>
          <Button variant="outline" onClick={() => setBaseDateValue(todayInputValue())}>
            <RotateCcw className="mr-2 h-4 w-4" />
            오늘
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {results.map((result) => (
          <Card key={result.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4" />
                {result.title}
              </CardTitle>
              <CardDescription>{result.detail}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-mono text-2xl font-semibold tracking-tight">
                {result.value}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copy(result)}
              >
                {copiedId === result.id ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                    복사
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
