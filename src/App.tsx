import { Outlet, Route, Routes } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Home } from "@/pages/Home";
import { ImageCompress } from "@/pages/ImageCompress";
import { ImageConvert } from "@/pages/ImageConvert";
import { ImageCrop } from "@/pages/ImageCrop";
import { ImageFavicon } from "@/pages/ImageFavicon";
import { ImageResize } from "@/pages/ImageResize";
import { ImageRotate } from "@/pages/ImageRotate";
import { ImageStripMetadata } from "@/pages/ImageStripMetadata";
import { ImageSvgOptimize } from "@/pages/ImageSvgOptimize";
import { Images } from "@/pages/Images";
import { FilesHub } from "@/pages/FilesHub";
import { FilesConvert } from "@/pages/FilesConvert";
import { FilesBase64 } from "@/pages/FilesBase64";
import { FilesDiff } from "@/pages/FilesDiff";
import { FilesFormat } from "@/pages/FilesFormat";
import { Pdf } from "@/pages/Pdf";
import { PdfMerge } from "@/pages/PdfMerge";
import { PdfSplit } from "@/pages/PdfSplit";
import { PdfConvert } from "@/pages/PdfConvert";
import { PdfToPdf } from "@/pages/PdfToPdf";
import { PdfCompress } from "@/pages/PdfCompress";
import { PdfRotate } from "@/pages/PdfRotate";
import { PdfExtract } from "@/pages/PdfExtract";
import { PdfUnlock } from "@/pages/PdfUnlock";
import { PdfImagesToPdf } from "@/pages/PdfImagesToPdf";

function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="images" element={<Images />} />
        <Route path="images/convert" element={<ImageConvert />} />
        <Route path="images/compress" element={<ImageCompress />} />
        <Route path="images/resize" element={<ImageResize />} />
        <Route path="images/crop" element={<ImageCrop />} />
        <Route path="images/rotate" element={<ImageRotate />} />
        <Route path="images/strip-metadata" element={<ImageStripMetadata />} />
        <Route path="images/favicon" element={<ImageFavicon />} />
        <Route path="images/svg-optimize" element={<ImageSvgOptimize />} />
        <Route path="pdf" element={<Pdf />} />
        <Route path="pdf/merge" element={<PdfMerge />} />
        <Route path="pdf/split" element={<PdfSplit />} />
        <Route path="pdf/convert" element={<PdfConvert />} />
        <Route path="pdf/to-pdf" element={<PdfToPdf />} />
        <Route path="pdf/compress" element={<PdfCompress />} />
        <Route path="pdf/rotate" element={<PdfRotate />} />
        <Route path="pdf/extract" element={<PdfExtract />} />
        <Route path="pdf/unlock" element={<PdfUnlock />} />
        <Route path="pdf/images-to-pdf" element={<PdfImagesToPdf />} />
        <Route path="files" element={<FilesHub />} />
        <Route path="files/convert" element={<FilesConvert />} />
        <Route path="files/base64" element={<FilesBase64 />} />
        <Route path="files/diff" element={<FilesDiff />} />
        <Route path="files/format" element={<FilesFormat />} />
      </Route>
    </Routes>
  );
}

export default App;
