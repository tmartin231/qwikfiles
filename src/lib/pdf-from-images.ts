import { decodeImageFile } from "@/lib/image-utils";
import { PDFDocument } from "pdf-lib";

export async function createMultiPagePdfFromImages(
  files: File[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const prepared = await decodeImageFile(file);
    const bytes = new Uint8Array(await prepared.arrayBuffer());
    const isPng = prepared.type === "image/png";
    const embedded = isPng
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);

    const { width, height } = embedded.scale(1);
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embedded, { x: 0, y: 0, width, height });
  }

  return pdfDoc.save();
}
