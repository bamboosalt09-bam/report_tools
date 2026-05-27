export type ImageFormat = "jpeg" | "png" | "webp" | "avif";

export interface ImageConvertOptions {
  format: ImageFormat;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  rotate?: 0 | 90 | 180 | 270;
}

export interface ImageConvertResult {
  blob: Blob;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  originalSize: number;
  outputSize: number;
  format: ImageFormat;
}

const MIME_MAP: Record<ImageFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

const EXT_MAP: Record<ImageFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
};

export function getOutputName(original: string, format: ImageFormat): string {
  const base = original.replace(/\.[^.]+$/, "");
  return `${base}.${EXT_MAP[format]}`;
}

export function getFormatLabel(format: ImageFormat): string {
  return EXT_MAP[format].toUpperCase();
}

async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error("이미지를 불러올 수 없습니다 (손상되었거나 미지원 포맷)"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function normalizeHeic(file: File): Promise<Blob> {
  const isHeic =
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.(heic|heif)$/i.test(file.name);
  if (!isHeic) return file;
  try {
    const { heicTo } = await import("heic-to");
    return await heicTo({ blob: file, type: "image/jpeg", quality: 0.95 });
  } catch (err) {
    throw new Error(
      `HEIC 변환 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
    );
  }
}

function calculateSize(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  if (!maxWidth && !maxHeight) return { width, height };
  const wRatio = maxWidth ? maxWidth / width : Infinity;
  const hRatio = maxHeight ? maxHeight / height : Infinity;
  const ratio = Math.min(wRatio, hRatio, 1);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

let avifSupportCache: boolean | null = null;

export async function detectAvifSupport(): Promise<boolean> {
  if (avifSupportCache !== null) return avifSupportCache;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/avif", 0.5);
    });
    avifSupportCache = !!blob;
    return avifSupportCache;
  } catch {
    avifSupportCache = false;
    return false;
  }
}

export async function convertImage(
  file: File,
  options: ImageConvertOptions
): Promise<ImageConvertResult> {
  const sourceBlob = await normalizeHeic(file);
  const img = await loadImage(sourceBlob);

  const originalWidth = img.naturalWidth;
  const originalHeight = img.naturalHeight;

  // 회전 적용 시 width/height 스왑
  const rotated = (options.rotate ?? 0) % 180 !== 0;
  const baseWidth = rotated ? originalHeight : originalWidth;
  const baseHeight = rotated ? originalWidth : originalHeight;

  const { width: outputWidth, height: outputHeight } = calculateSize(
    baseWidth,
    baseHeight,
    options.maxWidth,
    options.maxHeight
  );

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D 컨텍스트를 가져올 수 없습니다");

  if (options.format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputWidth, outputHeight);
  }

  // 회전 변환
  const angle = ((options.rotate ?? 0) * Math.PI) / 180;
  if (angle !== 0) {
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate(angle);
    const drawWidth = rotated ? outputHeight : outputWidth;
    const drawHeight = rotated ? outputWidth : outputHeight;
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  } else {
    ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
  }

  const mime = MIME_MAP[options.format];
  const quality =
    options.format === "png" ? undefined : (options.quality ?? 90) / 100;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) {
          if (options.format === "avif") {
            reject(
              new Error(
                "이 브라우저에서 AVIF 인코딩을 지원하지 않습니다 (WebP 권장)"
              )
            );
          } else {
            reject(new Error(`${options.format.toUpperCase()} 인코딩 실패`));
          }
        } else {
          resolve(b);
        }
      },
      mime,
      quality
    );
  });

  return {
    blob,
    originalWidth,
    originalHeight,
    outputWidth,
    outputHeight,
    originalSize: file.size,
    outputSize: blob.size,
    format: options.format,
  };
}
