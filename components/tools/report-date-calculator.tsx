"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  RotateCcw,
} from "lucide-react";
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
  if (!year || !month || !day) return new Date();
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

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function mondayOfWeek(date: Date): Date {
  const offset = (date.getDay() + 6) % 7;
  return addDays(date, -offset);
}

function thisWeekFriday(date: Date): Date {
  return addDays(mondayOfWeek(date), 4);
}

function formatDate(date: Date): string {
  return toDateInputValue(date);
}

function formatDateWithWeekday(date: Date): string {
  return `${formatDate(date)} (${weekdays[date.getDay()]})`;
}

function isSameDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getMonthTitle(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function buildCalendarDays(monthDate: Date): Date[] {
  const firstDay = startOfMonth(monthDate);
  const gridStart = addDays(firstDay, -firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
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
  const thisFriday = thisWeekFriday(baseDate);
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
      id: "this-friday",
      title: "이번 주 금요일",
      value: formatDateWithWeekday(thisFriday),
      detail: "기준 주의 금요일",
      copyText: formatDateWithWeekday(thisFriday),
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
  const [calendarMonthValue, setCalendarMonthValue] = useState(() =>
    toDateInputValue(startOfMonth(new Date()))
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const baseDate = useMemo(() => parseDateInput(baseDateValue), [baseDateValue]);
  const today = useMemo(() => new Date(), []);
  const calendarMonth = useMemo(
    () => parseDateInput(calendarMonthValue),
    [calendarMonthValue]
  );
  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth]
  );
  const results = useMemo(() => buildResults(baseDate), [baseDate]);

  const updateBaseDate = (date: Date) => {
    setBaseDateValue(toDateInputValue(date));
    setCalendarMonthValue(toDateInputValue(startOfMonth(date)));
    setCopiedId(null);
  };

  const moveCalendarMonth = (amount: number) => {
    const next = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + amount,
      1
    );
    setCalendarMonthValue(toDateInputValue(next));
  };

  const resetToday = () => updateBaseDate(new Date());

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
        <CardContent className="space-y-5 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <Label htmlFor="base-date">기준일</Label>
              <Input
                id="base-date"
                type="date"
                value={baseDateValue}
                onChange={(event) =>
                  updateBaseDate(parseDateInput(event.target.value))
                }
                className="w-[180px]"
              />
            </div>
            <Button variant="outline" onClick={resetToday}>
              <RotateCcw className="mr-2 h-4 w-4" />
              오늘
            </Button>
          </div>

          <div className="rounded-lg border bg-background p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="이전 달"
                onClick={() => moveCalendarMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm font-semibold">{getMonthTitle(calendarMonth)}</p>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="다음 달"
                onClick={() => moveCalendarMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {weekdays.map((weekday) => (
                <div key={weekday} className="py-1 font-medium">
                  {weekday}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date) => {
                const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                const isSelected = isSameDate(date, baseDate);
                const isToday = isSameDate(date, today);

                return (
                  <button
                    key={toDateInputValue(date)}
                    type="button"
                    onClick={() => updateBaseDate(date)}
                    className={[
                      "flex aspect-square min-h-9 items-center justify-center rounded-md border text-sm transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-transparent hover:border-border hover:bg-accent",
                      !isCurrentMonth && !isSelected
                        ? "text-muted-foreground/45"
                        : "",
                      isToday && !isSelected ? "font-semibold text-primary" : "",
                    ].join(" ")}
                    aria-pressed={isSelected}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
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
