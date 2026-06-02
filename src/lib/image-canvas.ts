/** Lädt ein Bild (inkl. SVG) auf ein Canvas. */
export function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  if (file.type === "image/svg+xml") {
    return file.text().then((svgContent) => {
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
      return loadImageElementToCanvas(dataUrl);
    });
  }
  const url = URL.createObjectURL(file);
  return loadImageElementToCanvas(url).finally(() => URL.revokeObjectURL(url));
}

function loadImageElementToCanvas(src: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export type ImageTransform =
  | "rotate90"
  | "rotate180"
  | "rotate270"
  | "flipH"
  | "flipV";

export function applyTransform(
  source: HTMLCanvasElement,
  transform: ImageTransform,
): HTMLCanvasElement {
  const { width, height } = source;
  const rotated =
    transform === "rotate90" || transform === "rotate270";
  const canvas = document.createElement("canvas");
  canvas.width = rotated ? height : width;
  canvas.height = rotated ? width : height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.translate(canvas.width / 2, canvas.height / 2);

  switch (transform) {
    case "rotate90":
      ctx.rotate(Math.PI / 2);
      break;
    case "rotate180":
      ctx.rotate(Math.PI);
      break;
    case "rotate270":
      ctx.rotate(-Math.PI / 2);
      break;
    case "flipH":
      ctx.scale(-1, 1);
      break;
    case "flipV":
      ctx.scale(1, -1);
      break;
  }

  ctx.drawImage(source, -width / 2, -height / 2);
  return canvas;
}

/** 24-Bit BMP aus Canvas (Browser unterstützen BMP nicht per toBlob). */
function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelDataSize, true);

  let offset = 54;
  const { data } = imageData;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      bytes[offset++] = data[i]!;
      bytes[offset++] = data[i + 1]!;
      bytes[offset++] = data[i + 2]!;
    }
    const padding = rowSize - width * 3;
    for (let p = 0; p < padding; p++) bytes[offset++] = 0;
  }

  return new Blob([buffer], { type: "image/bmp" });
}

const ENCODE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export type EncodableMime = (typeof ENCODE_MIMES)[number];

export function isEncodableMime(mime: string): mime is EncodableMime {
  return (ENCODE_MIMES as readonly string[]).includes(mime);
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality = 0.92,
): Promise<Blob> {
  if (mime === "image/bmp") {
    return Promise.resolve(canvasToBmpBlob(canvas));
  }
  if (!isEncodableMime(mime)) {
    return Promise.reject(new Error("Unsupported output format"));
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        if (mime === "image/avif") {
          canvas.toBlob(
            (fallback) =>
              fallback
                ? resolve(fallback)
                : reject(new Error("AVIF encoding not supported")),
            "image/webp",
            quality,
          );
          return;
        }
        reject(new Error("Conversion failed"));
      },
      mime,
      quality,
    );
  });
}

export const CONVERT_FORMATS = [
  { value: "image/jpeg", key: "jpg", ext: "jpg" },
  { value: "image/png", key: "png", ext: "png" },
  { value: "image/webp", key: "webp", ext: "webp" },
  { value: "image/gif", key: "gif", ext: "gif" },
  { value: "image/avif", key: "avif", ext: "avif" },
  { value: "image/bmp", key: "bmp", ext: "bmp" },
] as const;
