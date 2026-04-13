/**
 * 브라우저 전용 — 클라이언트 컴포넌트에서만 import 하세요.
 * Vercel 등 서버리스 요청 본문 제한(약 4.5MB)을 피하기 위해 업로드 전에 축소합니다.
 */

const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_JPEG = 0.84;
const CUTOUT_MAX_EDGE = 1200;

function loadBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function drawScaled(bitmap: ImageBitmap, maxEdge: number): { canvas: HTMLCanvasElement } {
  const iw = bitmap.width;
  const ih = bitmap.height;
  const scale = Math.min(1, maxEdge / Math.max(iw, ih, 1));
  const w = Math.max(1, Math.round(iw * scale));
  const h = Math.max(1, Math.round(ih * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d not available");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  return { canvas };
}

/** 사진 업로드·누끼 입력용 — JPEG로 긴 변 기준 축소 */
export async function shrinkPhotoForPetPipeline(
  file: File,
  maxEdge = DEFAULT_MAX_EDGE,
  quality = DEFAULT_JPEG,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    return file;
  }
  try {
    const bigSide = Math.max(bitmap.width, bitmap.height);
    const needBySize = file.size > 1_200_000;
    const needByDim = bigSide > maxEdge;
    if (!needBySize && !needByDim) {
      return file;
    }

    const { canvas } = drawScaled(bitmap, maxEdge);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size === 0) return file;
    const name = (file.name.replace(/\.[^.]+$/, "") || "photo") + ".jpg";
    const out = new File([blob], name, { type: "image/jpeg" });
    return out.size < file.size ? out : file;
  } finally {
    bitmap.close();
  }
}

/** 누끼 PNG(알파 유지) 용량 축소 — 긴 변 기준 리사이즈만 */
export async function shrinkPngBlobForUpload(blob: Blob, maxEdge = CUTOUT_MAX_EDGE): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await loadBitmap(blob);
  } catch {
    return blob;
  }
  try {
    const bigSide = Math.max(bitmap.width, bitmap.height);
    if (blob.size < 600_000 && bigSide <= maxEdge) return blob;

    const { canvas } = drawScaled(bitmap, maxEdge);
    const out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!out || out.size === 0) return blob;
    return out.size < blob.size ? out : blob;
  } finally {
    bitmap.close();
  }
}
