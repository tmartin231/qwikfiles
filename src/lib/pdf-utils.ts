import { PDFDocument } from "pdf-lib";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

if (typeof pdfjsWorker === "string") {
  GlobalWorkerOptions.workerSrc = pdfjsWorker;
} else {
  GlobalWorkerOptions.workerSrc = (pdfjsWorker as URL).toString();
}

export async function extractPdfPages(
  buffer: ArrayBuffer,
  startPage: number,
  endPage: number,
): Promise<Uint8Array> {
  const src = await PDFDocument.load(buffer);
  const total = src.getPageCount();
  const start = Math.max(1, Math.min(startPage, total));
  const end = Math.max(start, Math.min(endPage, total));
  const indices = Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);

  const dst = await PDFDocument.create();
  const pages = await dst.copyPages(src, indices);
  pages.forEach((page) => dst.addPage(page));
  return dst.save();
}

export async function getPdfPageCount(buffer: ArrayBuffer): Promise<number> {
  const doc = await PDFDocument.load(buffer);
  return doc.getPageCount();
}

/** Entsperrt passwortgeschützte PDFs via pdf.js (Seiten werden neu gerendert). */
export async function unlockPdf(
  buffer: ArrayBuffer,
  password: string,
): Promise<Uint8Array> {
  const pdf = await getDocument({
    data: buffer.slice(0),
    password,
  }).promise;

  const outDoc = await PDFDocument.create();

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, canvas, viewport }).promise;
    const jpegBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!jpegBlob) continue;
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    const embedded = await outDoc.embedJpg(jpegBytes);
    const { width, height } = embedded.scale(1);
    const newPage = outDoc.addPage([width, height]);
    newPage.drawImage(embedded, { x: 0, y: 0, width, height });
  }

  if (outDoc.getPageCount() === 0) {
    throw new Error("PDF could not be decrypted");
  }

  return outDoc.save();
}
