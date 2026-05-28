"use client";

import { useState } from "react";
import {
  Loader2,
  FileDown,
  Combine,
  Scissors,
  ImagePlus,
  RotateCw,
  FilePlus,
  Info,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import JSZip from "jszip";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FileDropzone } from "@/components/file-dropzone";
import {
  mergePdfs,
  splitPdf,
  splitPdfPerPage,
  rotatePdf,
  imagesToPdf,
  getPdfPageCount,
  compressPdfAsImages,
  compressPdfPreservingText,
  type PreserveTextCompressionStats,
} from "@/lib/converters/pdf";

type CompressionMode = "preserveText" | "rasterize";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}

// 병합 탭
function MergeTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [working, setWorking] = useState(false);

  const handle = async () => {
    if (files.length < 2) {
      toast.error("최소 2개 이상의 PDF가 필요합니다");
      return;
    }
    setWorking(true);
    try {
      const blob = await mergePdfs(files);
      saveAs(blob, `merged-${Date.now()}.pdf`);
      toast.success(`${files.length}개 PDF 병합 완료`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "병합 실패");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        accept="application/pdf,.pdf"
        files={files}
        onFilesChange={setFiles}
        label="병합할 PDF 파일을 끌어오세요"
        hint="추가한 순서대로 병합됩니다 · 최소 2개 이상"
      />
      <Button onClick={handle} disabled={working || files.length < 2} className="w-full" size="lg">
        {working ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            병합 중...
          </>
        ) : (
          <>
            <Combine className="mr-2 h-4 w-4" />
            PDF 병합하기
          </>
        )}
      </Button>
    </div>
  );
}

// 분할 탭 (페이지 선택)
function SplitTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [mode, setMode] = useState<"range" | "perPage">("range");
  const [ranges, setRanges] = useState("");
  const [working, setWorking] = useState(false);

  const handleFilesChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setPageCount(null);
    if (newFiles[0]) {
      try {
        const count = await getPdfPageCount(newFiles[0]);
        setPageCount(count);
      } catch (err) {
        toast.error(
          `PDF 정보를 읽을 수 없습니다: ${
            err instanceof Error ? err.message : "오류"
          }`
        );
      }
    }
  };

  const handleSplit = async () => {
    if (!files[0]) {
      toast.error("PDF 파일을 선택하세요");
      return;
    }
    setWorking(true);
    try {
      if (mode === "range") {
        if (!ranges.trim()) {
          toast.error("페이지 범위를 입력하세요");
          return;
        }
        const blob = await splitPdf(files[0], ranges);
        saveAs(blob, `split-${files[0].name}`);
        toast.success("페이지 추출 완료");
      } else {
        const pages = await splitPdfPerPage(files[0]);
        if (pages.length === 1) {
          saveAs(pages[0].blob, pages[0].name);
        } else {
          const zip = new JSZip();
          pages.forEach((p) => zip.file(p.name, p.blob));
          const z = await zip.generateAsync({ type: "blob" });
          saveAs(z, `${files[0].name.replace(/\.pdf$/i, "")}-pages.zip`);
        }
        toast.success(`${pages.length}개 페이지를 개별 PDF로 분할 완료`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "분할 실패");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        accept="application/pdf,.pdf"
        multiple={false}
        files={files}
        onFilesChange={handleFilesChange}
        label="분할할 PDF 파일을 업로드하세요"
      />

      {pageCount !== null && (
        <p className="text-sm text-muted-foreground">
          총 <span className="font-semibold text-foreground">{pageCount}</span>{" "}
          페이지
        </p>
      )}

      <div className="space-y-2">
        <Label>분할 방식</Label>
        <Select value={mode} onValueChange={(v) => setMode(v as "range" | "perPage")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="range">페이지 범위 추출</SelectItem>
            <SelectItem value="perPage">각 페이지를 개별 PDF로 (ZIP)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "range" && (
        <div className="space-y-2">
          <Label htmlFor="ranges">추출할 페이지</Label>
          <Input
            id="ranges"
            placeholder="예: 1-3, 5, 7-10"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            쉼표(,)로 구분, 하이픈(-)으로 범위 지정
          </p>
        </div>
      )}

      <Button
        onClick={handleSplit}
        disabled={
          working ||
          files.length === 0 ||
          (mode === "range" && !ranges.trim())
        }
        className="w-full"
        size="lg"
      >
        {working ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            처리 중...
          </>
        ) : (
          <>
            <Scissors className="mr-2 h-4 w-4" />
            분할하기
          </>
        )}
      </Button>
    </div>
  );
}

// 회전 탭
function RotateTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [angle, setAngle] = useState<90 | 180 | 270>(90);
  const [ranges, setRanges] = useState("");
  const [working, setWorking] = useState(false);

  const handleFilesChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setPageCount(null);
    if (newFiles[0]) {
      try {
        setPageCount(await getPdfPageCount(newFiles[0]));
      } catch {
        setPageCount(null);
      }
    }
  };

  const handleRotate = async () => {
    if (!files[0]) return;
    setWorking(true);
    try {
      const blob = await rotatePdf(
        files[0],
        angle,
        ranges.trim() || undefined
      );
      saveAs(blob, `rotated-${files[0].name}`);
      toast.success("회전 완료");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "회전 실패");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        accept="application/pdf,.pdf"
        multiple={false}
        files={files}
        onFilesChange={handleFilesChange}
        label="회전할 PDF 파일을 업로드하세요"
      />
      {pageCount !== null && (
        <p className="text-sm text-muted-foreground">
          총 <span className="font-semibold text-foreground">{pageCount}</span>{" "}
          페이지
        </p>
      )}

      <div className="space-y-2">
        <Label>회전 각도</Label>
        <div className="grid grid-cols-3 gap-2">
          {[90, 180, 270].map((a) => (
            <Button
              key={a}
              variant={angle === a ? "default" : "outline"}
              size="sm"
              onClick={() => setAngle(a as 90 | 180 | 270)}
            >
              <RotateCw className="mr-1 h-3.5 w-3.5" />
              {a}°
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rotate-ranges">회전할 페이지 (선택)</Label>
        <Input
          id="rotate-ranges"
          placeholder="비워두면 전체, 예: 1-3, 5"
          value={ranges}
          onChange={(e) => setRanges(e.target.value)}
        />
      </div>

      <Button
        onClick={handleRotate}
        disabled={working || files.length === 0}
        className="w-full"
        size="lg"
      >
        {working ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            처리 중...
          </>
        ) : (
          <>
            <RotateCw className="mr-2 h-4 w-4" />
            회전하기
          </>
        )}
      </Button>
    </div>
  );
}

// 이미지 → PDF 탭
function ImagesToPdfTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<"fit" | "A4" | "Letter">("fit");
  const [working, setWorking] = useState(false);

  const handle = async () => {
    if (files.length === 0) {
      toast.error("이미지를 먼저 추가하세요");
      return;
    }
    setWorking(true);
    try {
      const blob = await imagesToPdf(files, {
        pageSize,
        margin: pageSize === "fit" ? 0 : 20,
      });
      saveAs(blob, `images-${Date.now()}.pdf`);
      toast.success(`${files.length}개 이미지를 PDF로 변환 완료`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "변환 실패");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        accept="image/*"
        files={files}
        onFilesChange={setFiles}
        label="이미지를 끌어오세요"
        hint="JPG, PNG, WebP 등 · 추가 순서대로 페이지가 생성됩니다"
      />
      <div className="space-y-2">
        <Label htmlFor="pageSize">페이지 크기</Label>
        <Select
          value={pageSize}
          onValueChange={(v) => setPageSize(v as "fit" | "A4" | "Letter")}
        >
          <SelectTrigger id="pageSize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fit">이미지 크기에 맞춤</SelectItem>
            <SelectItem value="A4">A4 (210×297mm)</SelectItem>
            <SelectItem value="Letter">Letter (216×279mm)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={handle}
        disabled={working || files.length === 0}
        className="w-full"
        size="lg"
      >
        {working ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            변환 중...
          </>
        ) : (
          <>
            <ImagePlus className="mr-2 h-4 w-4" />
            PDF로 변환하기
            <FileDown className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

function CompressTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<CompressionMode>("preserveText");
  const [dpi, setDpi] = useState(120);
  const [quality, setQuality] = useState(72);
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [result, setResult] = useState<{
    before: number;
    after: number;
    mode: CompressionMode;
    stats?: PreserveTextCompressionStats;
  } | null>(null);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setProgress(null);
    setResult(null);
  };

  const handleCompress = async () => {
    if (!files[0]) {
      toast.error("압축할 PDF 파일을 선택하세요");
      return;
    }

    setWorking(true);
    setProgress(null);
    setResult(null);

    try {
      const compression =
        mode === "preserveText"
          ? await compressPdfPreservingText(files[0], {
              dpi,
              imageQuality: quality,
              onProgress: setProgress,
            })
          : {
              blob: await compressPdfAsImages(files[0], {
                dpi,
                imageQuality: quality,
                onProgress: setProgress,
              }),
              stats: undefined,
            };

      const { blob, stats } = compression;
      const outputName = `compressed-${files[0].name.replace(/\.pdf$/i, "")}.pdf`;

      saveAs(blob, outputName);
      setResult({ before: files[0].size, after: blob.size, mode, stats });

      const savedRatio =
        files[0].size > 0
          ? Math.max(0, 100 - (blob.size / files[0].size) * 100)
          : 0;

      if (stats?.keptOriginalFile) {
        toast.info("원본보다 작아지지 않아 파일 크기를 유지했습니다.");
      } else {
        toast.success(`PDF 압축 완료 · 약 ${savedRatio.toFixed(1)}% 절감`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "압축 실패");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileDropzone
        accept="application/pdf,.pdf"
        multiple={false}
        files={files}
        onFilesChange={handleFilesChange}
        label="압축할 PDF 파일을 업로드하세요"
        hint="기본값은 텍스트를 보존하고 이미지만 압축합니다"
      />

      <div className="grid gap-2 rounded-md border p-1 sm:grid-cols-2">
        <Button
          type="button"
          variant={mode === "preserveText" ? "secondary" : "ghost"}
          onClick={() => {
            setMode("preserveText");
            setResult(null);
            setProgress(null);
          }}
        >
          텍스트 보존
        </Button>
        <Button
          type="button"
          variant={mode === "rasterize" ? "secondary" : "ghost"}
          onClick={() => {
            setMode("rasterize");
            setResult(null);
            setProgress(null);
          }}
        >
          전체 이미지화
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3 rounded-md border p-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="compress-dpi">이미지 기준 DPI</Label>
            <Input
              id="compress-dpi"
              inputMode="numeric"
              value={dpi}
              onChange={(event) =>
                setDpi(clampNumber(Number(event.target.value), 72, 300))
              }
              className="h-8 w-20 text-right"
            />
          </div>
          <Slider
            value={[dpi]}
            min={72}
            max={300}
            step={1}
            onValueChange={(value) => setDpi(value[0] ?? dpi)}
          />
          <p className="text-xs text-muted-foreground">
            텍스트 보존 모드에서는 이미지 픽셀을 300 DPI 기준으로 줄입니다.
          </p>
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="compress-quality">이미지 품질</Label>
            <Input
              id="compress-quality"
              inputMode="numeric"
              value={quality}
              onChange={(event) =>
                setQuality(clampNumber(Number(event.target.value), 10, 100))
              }
              className="h-8 w-20 text-right"
            />
          </div>
          <Slider
            value={[quality]}
            min={10}
            max={100}
            step={1}
            onValueChange={(value) => setQuality(value[0] ?? quality)}
          />
          <p className="text-xs text-muted-foreground">
            낮을수록 더 작아지고, 높을수록 이미지와 글자 가장자리가 덜 깨집니다.
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
        {mode === "preserveText"
          ? "텍스트 보존 모드는 PDF의 텍스트, 벡터 도형, 링크 구조는 그대로 두고 직접 처리 가능한 JPEG 이미지 리소스만 압축합니다. PNG, 마스크가 있는 이미지, 특수 인코딩 이미지는 건너뜁니다."
          : "전체 이미지화 모드는 페이지를 통째로 이미지화합니다. 용량은 더 줄어들 수 있지만 텍스트 선택, 검색, 벡터 도형의 확대 선명도는 원본보다 떨어질 수 있습니다."}
      </div>

      {progress && (
        <p className="text-sm text-muted-foreground">
          {progress.total}
          {mode === "preserveText" ? "개 이미지 중 " : "페이지 중 "}
          <span className="font-medium text-foreground">{progress.current}</span>
          {mode === "preserveText" ? "개 처리 완료" : "페이지 처리 완료"}
        </p>
      )}

      {result && (
        <div className="space-y-3 rounded-md border p-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            <p>
              원본{" "}
              <span className="font-semibold">{formatBytes(result.before)}</span>
            </p>
            <p>
              압축 후{" "}
              <span className="font-semibold">{formatBytes(result.after)}</span>
            </p>
            <p>
              절감률{" "}
              <span className="font-semibold">
                {Math.max(0, 100 - (result.after / result.before) * 100).toFixed(
                  1
                )}
                %
              </span>
            </p>
          </div>
          {result.stats && (
            <div className="grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-3">
              <p>
                압축 이미지{" "}
                <span className="font-medium text-foreground">
                  {result.stats.recompressedImages}/{result.stats.totalImages}
                </span>
              </p>
              <p>건너뜀 {result.stats.skippedImages}</p>
              <p>
                이미지 용량{" "}
                {formatBytes(result.stats.beforeImageBytes)} →{" "}
                {formatBytes(result.stats.afterImageBytes)}
              </p>
              {result.stats.keptOriginalFile && (
                <p className="sm:col-span-3">
                  원본보다 결과 파일이 작아지지 않아 원본 파일을 그대로 저장했습니다.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <Button
        onClick={handleCompress}
        disabled={working || files.length === 0}
        className="w-full"
        size="lg"
      >
        {working ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            압축 중...
          </>
        ) : (
          <>
            <Archive className="mr-2 h-4 w-4" />
            {mode === "preserveText" ? "텍스트 보존 압축하기" : "PDF 압축하기"}
            <FileDown className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

export function PdfTools() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="merge" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="merge">
            <Combine className="mr-1.5 h-4 w-4 hidden sm:inline" />
            병합
          </TabsTrigger>
          <TabsTrigger value="split">
            <Scissors className="mr-1.5 h-4 w-4 hidden sm:inline" />
            분할
          </TabsTrigger>
          <TabsTrigger value="rotate">
            <RotateCw className="mr-1.5 h-4 w-4 hidden sm:inline" />
            회전
          </TabsTrigger>
          <TabsTrigger value="compress">
            <Archive className="mr-1.5 h-4 w-4 hidden sm:inline" />
            압축
          </TabsTrigger>
          <TabsTrigger value="images">
            <FilePlus className="mr-1.5 h-4 w-4 hidden sm:inline" />
            이미지
          </TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="pt-6">
            <TabsContent value="merge" className="mt-0">
              <MergeTab />
            </TabsContent>
            <TabsContent value="split" className="mt-0">
              <SplitTab />
            </TabsContent>
            <TabsContent value="rotate" className="mt-0">
              <RotateTab />
            </TabsContent>
            <TabsContent value="compress" className="mt-0">
              <CompressTab />
            </TabsContent>
            <TabsContent value="images" className="mt-0">
              <ImagesToPdfTab />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex gap-3 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              모든 처리는 브라우저에서 진행되며 파일이 서버로 전송되지 않습니다.
              비밀번호로 보호된 PDF는 자동으로 보호가 해제됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
