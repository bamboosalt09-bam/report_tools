import { PDFDocument, PageSizes, degrees } from "pdf-lib";

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfJsPromise: Promise<PdfJsModule> | null = null;

async function getPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url
      ).toString();

      return pdfjs;
    });
  }

  return pdfJsPromise;
}

export async function mergePdfs(files: File[]): Promise<Blob> {
  if (files.length === 0) throw new Error("병합할 PDF 파일이 없습니다");
  const merged = await PDFDocument.create();
  for (const file of files) {
    try {
      const bytes = await file.arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    } catch (err) {
      throw new Error(
        `${file.name} 로드 실패: ${err instanceof Error ? err.message : "오류"}`
      );
    }
  }
  const out = await merged.save();
  return new Blob([new Uint8Array(out)], { type: "application/pdf" });
}

export function parsePageRanges(input: string, total: number): number[] {
  const result = new Set<number>();
  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    throw new Error("페이지 범위를 입력하세요");
  }
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      const n = parseInt(part);
      if (n >= 1 && n <= total) result.add(n - 1);
    } else if (/^\d+-\d+$/.test(part)) {
      const [a, b] = part.split("-").map((n) => parseInt(n));
      if (isNaN(a) || isNaN(b)) {
        throw new Error(`잘못된 페이지 범위: ${part}`);
      }
      const start = Math.min(a, b);
      const end = Math.max(a, b);
      for (let i = start; i <= end; i++) {
        if (i >= 1 && i <= total) result.add(i - 1);
      }
    } else {
      throw new Error(`잘못된 페이지 범위: "${part}" (예: 1-3, 5, 7-10)`);
    }
  }
  if (result.size === 0) {
    throw new Error(`선택된 페이지가 없습니다 (전체 ${total}페이지)`);
  }
  return Array.from(result).sort((a, b) => a - b);
}

export async function splitPdf(file: File, ranges: string): Promise<Blob> {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = src.getPageCount();
  const indices = parsePageRanges(ranges, total);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  const bytesOut = await out.save();
  return new Blob([new Uint8Array(bytesOut)], { type: "application/pdf" });
}

/**
 * PDF의 각 페이지를 개별 PDF 파일로 분할
 */
export async function splitPdfPerPage(
  file: File
): Promise<{ name: string; blob: Blob }[]> {
  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = src.getPageCount();
  const baseName = file.name.replace(/\.pdf$/i, "");
  const results: { name: string; blob: Blob }[] = [];

  for (let i = 0; i < total; i++) {
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(src, [i]);
    out.addPage(page);
    const data = await out.save();
    const pageNum = String(i + 1).padStart(String(total).length, "0");
    results.push({
      name: `${baseName}-${pageNum}.pdf`,
      blob: new Blob([new Uint8Array(data)], { type: "application/pdf" }),
    });
  }

  return results;
}

/**
 * PDF의 모든 페이지를 지정 각도만큼 회전 (90, 180, 270)
 */
export async function rotatePdf(
  file: File,
  angle: 90 | 180 | 270,
  ranges?: string
): Promise<Blob> {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const indices = ranges
    ? parsePageRanges(ranges, total)
    : Array.from({ length: total }, (_, i) => i);
  const pages = doc.getPages();

  for (const i of indices) {
    const page = pages[i];
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }

  const out = await doc.save();
  return new Blob([new Uint8Array(out)], { type: "application/pdf" });
}

export async function getPdfPageCount(file: File): Promise<number> {
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

export interface CompressPdfOptions {
  dpi: number;
  imageQuality: number;
  onProgress?: (progress: { current: number; total: number }) => void;
}

async function canvasToJpegBytes(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<ArrayBuffer> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("JPEG 압축에 실패했습니다")),
      "image/jpeg",
      quality
    );
  });

  return blob.arrayBuffer();
}

export async function compressPdf(
  file: File,
  options: CompressPdfOptions
): Promise<Blob> {
  const dpi = Math.min(Math.max(options.dpi, 72), 300);
  const imageQuality = Math.min(Math.max(options.imageQuality, 10), 100) / 100;
  const pdfjs = await getPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const source = await loadingTask.promise;
  const output = await PDFDocument.create();
  const maxCanvasSide = 8000;

  try {
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber++) {
      const page = await source.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      let scale = dpi / 72;
      const longestSide =
        Math.max(baseViewport.width, baseViewport.height) * scale;

      if (longestSide > maxCanvasSide) {
        scale *= maxCanvasSide / longestSide;
      }

      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));

      const context = canvas.getContext("2d", { alpha: false });
      if (!context) {
        throw new Error("Canvas 컨텍스트를 가져올 수 없습니다");
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvas,
        canvasContext: context,
        viewport,
      }).promise;

      const jpegBytes = await canvasToJpegBytes(canvas, imageQuality);
      const image = await output.embedJpg(jpegBytes);
      const outputPage = output.addPage([
        baseViewport.width,
        baseViewport.height,
      ]);

      outputPage.drawImage(image, {
        x: 0,
        y: 0,
        width: baseViewport.width,
        height: baseViewport.height,
      });

      canvas.width = 1;
      canvas.height = 1;
      page.cleanup();
      options.onProgress?.({ current: pageNumber, total: source.numPages });
    }

    const bytes = await output.save();
    return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  } finally {
    await source.destroy();
  }
}

export interface ImagesToPdfOptions {
  pageSize?: keyof typeof PageSizes | "fit";
  margin?: number;
}

export async function imagesToPdf(
  files: File[],
  options: ImagesToPdfOptions = {}
): Promise<Blob> {
  if (files.length === 0) throw new Error("이미지가 없습니다");
  const { pageSize = "fit", margin = 0 } = options;
  const doc = await PDFDocument.create();

  for (const file of files) {
    try {
      const bytes = await file.arrayBuffer();
      const isPng = file.type === "image/png" || /\.png$/i.test(file.name);
      const isJpg =
        file.type === "image/jpeg" || /\.(jpe?g)$/i.test(file.name);

      let embed;
      if (isPng) {
        embed = await doc.embedPng(bytes);
      } else if (isJpg) {
        embed = await doc.embedJpg(bytes);
      } else {
        const converted = await convertToJpegBytes(file);
        embed = await doc.embedJpg(converted);
      }

      let pageWidth: number;
      let pageHeight: number;
      if (pageSize === "fit") {
        pageWidth = embed.width + margin * 2;
        pageHeight = embed.height + margin * 2;
      } else {
        [pageWidth, pageHeight] = PageSizes[pageSize];
      }

      const page = doc.addPage([pageWidth, pageHeight]);
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - margin * 2;
      const scale = Math.min(maxW / embed.width, maxH / embed.height);
      const drawW = embed.width * scale;
      const drawH = embed.height * scale;
      page.drawImage(embed, {
        x: (pageWidth - drawW) / 2,
        y: (pageHeight - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    } catch (err) {
      throw new Error(
        `${file.name} 처리 실패: ${err instanceof Error ? err.message : "오류"}`
      );
    }
  }

  const out = await doc.save();
  return new Blob([new Uint8Array(out)], { type: "application/pdf" });
}

async function convertToJpegBytes(file: File): Promise<ArrayBuffer> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`${file.name} 로드 실패`));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 컨텍스트를 가져올 수 없습니다");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("JPEG 변환 실패"))),
        "image/jpeg",
        0.92
      );
    });
    return blob.arrayBuffer();
  } finally {
    URL.revokeObjectURL(url);
  }
}
