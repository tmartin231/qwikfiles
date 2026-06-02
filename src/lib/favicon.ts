const FAVICON_SIZES = [16, 32, 48, 64, 128, 256] as const;

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function canvasToPngBytes(
  img: HTMLImageElement,
  size: number,
): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, size, size);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("PNG encoding failed");
  return new Uint8Array(await blob.arrayBuffer());
}

/** ICO mit eingebetteten PNGs (Windows Vista+). */
export async function generateFaviconIco(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const pngs: { size: number; data: Uint8Array }[] = [];

  for (const size of FAVICON_SIZES) {
    pngs.push({ size, data: await canvasToPngBytes(img, size) });
  }

  const count = pngs.length;
  const headerSize = 6 + count * 16;
  let dataOffset = headerSize;
  const parts: Uint8Array[] = [];

  const header = new ArrayBuffer(headerSize);
  const view = new DataView(header);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, count, true);

  pngs.forEach((png, i) => {
    const entryOffset = 6 + i * 16;
    const w = png.size >= 256 ? 0 : png.size;
    const h = png.size >= 256 ? 0 : png.size;
    view.setUint8(entryOffset, w);
    view.setUint8(entryOffset + 1, h);
    view.setUint8(entryOffset + 2, 0);
    view.setUint8(entryOffset + 3, 0);
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, png.data.length, true);
    view.setUint32(entryOffset + 12, dataOffset, true);
    dataOffset += png.data.length;
    parts.push(png.data);
  });

  const total = headerSize + parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  out.set(new Uint8Array(header), 0);
  let offset = headerSize;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }

  return new Blob([out], { type: "image/x-icon" });
}
