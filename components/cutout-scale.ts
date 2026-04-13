"use client";

/** Center-draw image on square canvas; factor scales subject vs fit-in-square baseline (0.5–1.5). */
export async function scaleCutoutToPng(blob: Blob, factor: number): Promise<Blob> {
  if (Math.abs(factor - 1) < 0.02) return blob;

  const img = await createImageBitmap(blob);
  try {
    const maxSide = Math.max(img.width, img.height, 512);
    const size = Math.min(1024, Math.round(maxSide * 1.25));
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.clearRect(0, 0, size, size);

    const baseFit = Math.min(size / img.width, size / img.height);
    const fit = baseFit * factor;
    const w = img.width * fit;
    const h = img.height * fit;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

    const out = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG export failed"))), "image/png");
    });
    return out;
  } finally {
    img.close();
  }
}
