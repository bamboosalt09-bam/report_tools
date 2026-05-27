"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Loader2,
  ImageDown,
  RotateCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { FileDropzone } from "@/components/file-dropzone";
import {
  convertImage,
  detectAvifSupport,
  getOutputName,
  type ImageConvertResult,
  type ImageFormat,
} from "@/lib/converters/image";

interface FormatOption {
  value: ImageFormat;
  label: string;
  lossy: boolean;
  hint?: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { value: "jpeg", label: "JPG", lossy: true, hint: "사진에 적합 · 가장 호환성 좋음" },
  { value: "png", label: "PNG", lossy: false, hint: "투명 배경 · 무손실" },
  { value: "webp", label: "WebP", lossy: true, hint: "용량 작음 · 모던 웹" },
  { value: "avif", label: "AVIF", lossy: true, hint: "최신 · 최고 압축률" },
];

type ResultRow = {
  file: File;
  status: "pending" | "converting" | "done" | "error";
  result?: ImageConvertResult;
  error?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ImageConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const [quality, setQuality] = useState(90);
  const [maxWidth, setMaxWidth] = useState<string>("");
  const [maxHeight, setMaxHeight] = useState<string>("");
  const [rotate, setRotate] = useState<0 | 90 | 180 | 270>(0);
  const [isConverting, setIsConverting] = useState(false);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [avifSupported, setAvifSupported] = useState<boolean | null>(null);

  useEffect(() => {
    detectAvifSupport().then(setAvifSupported);
  }, []);

  const currentFormat = FORMAT_OPTIONS.find((f) => f.value === format);
  const showQuality = currentFormat?.lossy ?? false;
  const avifSelected = format === "avif";
  const avifUnsupported = avifSelected && avifSupported === false;

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error("변환할 이미지를 먼저 추가하세요");
      return;
    }
    if (avifUnsupported) {
      toast.error("AVIF가 이 브라우저에서 지원되지 않습니다 (WebP 권장)");
      return;
    }

    setIsConverting(true);
    setResults(files.map((file) => ({ file, status: "pending" })));

    const collected: ResultRow[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setResults((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "converting" } : r))
      );
      try {
        const result = await convertImage(file, {
          format,
          quality,
          maxWidth: maxWidth ? parseInt(maxWidth) : undefined,
          maxHeight: maxHeight ? parseInt(maxHeight) : undefined,
          rotate,
        });
        const row: ResultRow = { file, status: "done", result };
        collected.push(row);
        setResults((prev) => prev.map((r, idx) => (idx === i ? row : r)));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "변환 실패";
        toast.error(`${file.name} — ${msg}`);
        const row: ResultRow = { file, status: "error", error: msg };
        setResults((prev) => prev.map((r, idx) => (idx === i ? row : r)));
      }
    }

    setIsConverting(false);
    const successCount = collected.length;
    if (successCount > 0) {
      toast.success(`${successCount}개 변환 완료`);
    }
  };

  const handleDownloadOne = (row: ResultRow) => {
    if (!row.result) return;
    saveAs(row.result.blob, getOutputName(row.file.name, row.result.format));
  };

  const handleDownloadAll = async () => {
    const done = results.filter((r) => r.status === "done" && r.result);
    if (done.length === 0) return;
    if (done.length === 1) {
      handleDownloadOne(done[0]);
      return;
    }
    const zip = new JSZip();
    done.forEach((r) =>
      zip.file(getOutputName(r.file.name, r.result!.format), r.result!.blob)
    );
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `images-${Date.now()}.zip`);
  };

  const totalSizeOriginal = results
    .filter((r) => r.status === "done")
    .reduce((sum, r) => sum + (r.result?.originalSize ?? 0), 0);
  const totalSizeConverted = results
    .filter((r) => r.status === "done")
    .reduce((sum, r) => sum + (r.result?.outputSize ?? 0), 0);
  const savings =
    totalSizeOriginal > 0
      ? Math.round((1 - totalSizeConverted / totalSizeOriginal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <FileDropzone
        accept="image/*,.heic,.heif"
        files={files}
        onFilesChange={(f) => {
          setFiles(f);
          setResults([]);
        }}
        label="이미지를 끌어오거나 선택"
        hint="JPG, PNG, WebP, AVIF, HEIC 지원 · 여러 장 가능"
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="format">변환 포맷</Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as ImageFormat)}
              >
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="font-medium">{opt.label}</span>
                      {opt.hint && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {opt.hint}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {avifUnsupported && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  이 브라우저에서 AVIF 인코딩을 지원하지 않습니다
                </p>
              )}
            </div>

            {showQuality && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>품질</Label>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {quality}%
                  </span>
                </div>
                <Slider
                  value={[quality]}
                  onValueChange={(v) => setQuality(v[0])}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>최대 크기 (선택, 비율 유지)</Label>
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                type="number"
                placeholder="최대 너비 (px)"
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
              />
              <Input
                type="number"
                placeholder="최대 높이 (px)"
                value={maxHeight}
                onChange={(e) => setMaxHeight(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              비워두면 원본 크기를 유지합니다
            </p>
          </div>

          <div className="space-y-2">
            <Label>회전</Label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 90, 180, 270].map((angle) => (
                <Button
                  key={angle}
                  variant={rotate === angle ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRotate(angle as 0 | 90 | 180 | 270)}
                >
                  {angle === 0 ? (
                    "원본"
                  ) : (
                    <>
                      <RotateCw className="mr-1 h-3.5 w-3.5" />
                      {angle}°
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleConvert}
            disabled={isConverting || files.length === 0 || avifUnsupported}
            className="w-full"
            size="lg"
          >
            {isConverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                변환 중...
              </>
            ) : (
              <>
                <ImageDown className="mr-2 h-4 w-4" />
                {files.length > 0
                  ? `${files.length}개 이미지 변환하기`
                  : "변환하기"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">변환 결과</p>
                {totalSizeOriginal > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(totalSizeOriginal)} →{" "}
                    {formatBytes(totalSizeConverted)} (
                    <span className={savings > 0 ? "text-emerald-600" : "text-amber-600"}>
                      {savings > 0 ? `-${savings}%` : `+${Math.abs(savings)}%`}
                    </span>
                    )
                  </p>
                )}
              </div>
              <Button
                onClick={handleDownloadAll}
                size="sm"
                disabled={!results.some((r) => r.status === "done")}
              >
                <Download className="mr-1 h-4 w-4" />
                {results.filter((r) => r.status === "done").length > 1
                  ? "전체 다운로드 (ZIP)"
                  : "다운로드"}
              </Button>
            </div>

            <ul className="space-y-2">
              {results.map((row, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 rounded-md border border-border bg-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {row.file.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      {row.status === "pending" && <Badge variant="outline">대기</Badge>}
                      {row.status === "converting" && (
                        <Badge variant="secondary">
                          <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />
                          변환 중
                        </Badge>
                      )}
                      {row.status === "done" && row.result && (
                        <>
                          <Badge variant="outline">
                            {row.result.outputWidth}×{row.result.outputHeight}
                          </Badge>
                          <span>
                            {formatBytes(row.result.originalSize)} →{" "}
                            {formatBytes(row.result.outputSize)}
                          </span>
                        </>
                      )}
                      {row.status === "error" && (
                        <Badge variant="outline" className="border-red-500/40 text-red-700 dark:text-red-400">
                          {row.error}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {row.status === "done" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadOne(row)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex gap-3 text-sm">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="space-y-1 text-muted-foreground">
              <p>
                <strong className="text-foreground">JPG</strong>는 사진에,{" "}
                <strong className="text-foreground">PNG</strong>는 투명 배경이
                필요할 때,{" "}
                <strong className="text-foreground">WebP</strong>는 용량을
                줄이고 싶을 때 사용하세요.
              </p>
              <p>HEIC(아이폰 사진)는 자동으로 JPG로 변환된 후 처리됩니다.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        모든 변환은 브라우저에서 처리되며 파일이 서버로 전송되지 않습니다.
      </p>
    </div>
  );
}
