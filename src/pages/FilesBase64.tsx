import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { baseName } from "@/lib/image-utils";
import { incrementFeatureUsage } from "@/lib/usage-tracking";
import { Copy, Download } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

type Mode = "encode" | "decode";
type EncodeSource = "text" | "file";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function textToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function tryDecodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function FilesBase64() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("encode");
  const [encodeSource, setEncodeSource] = useState<EncodeSource>("text");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [output, setOutput] = useState("");
  const [decodedBytes, setDecodedBytes] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEncode = useCallback(async () => {
    setError(null);
    try {
      if (encodeSource === "text") {
        if (!textInput) return;
        setOutput(textToBase64(textInput));
        setDecodedBytes(null);
      } else {
        if (!file) return;
        const buffer = await file.arrayBuffer();
        setOutput(bytesToBase64(new Uint8Array(buffer)));
        setDecodedBytes(null);
      }
      incrementFeatureUsage("files.base64");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("files.base64Page.genericError"));
    }
  }, [encodeSource, textInput, file, t]);

  const handleDecode = useCallback(() => {
    setError(null);
    try {
      const cleaned = textInput.replace(/\s/g, "");
      const bytes = base64ToBytes(cleaned);
      const asText = tryDecodeUtf8(bytes);
      setOutput(asText ?? "");
      setDecodedBytes(asText === null ? bytes : null);
      incrementFeatureUsage("files.base64");
    } catch {
      setError(t("files.base64Page.invalidBase64"));
      setDecodedBytes(null);
    }
  }, [textInput, t]);

  const handleDownloadDecoded = useCallback(() => {
    const data = decodedBytes ?? (output ? new TextEncoder().encode(output) : null);
    if (!data) return;
    const blob = new Blob([data.buffer as ArrayBuffer], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "decoded.bin";
    a.click();
    URL.revokeObjectURL(url);
  }, [decodedBytes, output]);

  const copyOutput = useCallback(() => {
    if (output) void navigator.clipboard.writeText(output);
  }, [output]);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <BackLink to="/files" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("files.tools.base64.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("files.tools.base64.description")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("files.base64Page.title")}</CardTitle>
          <CardDescription>{t("files.base64Page.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "encode" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMode("encode");
                setOutput("");
                setDecodedBytes(null);
                setError(null);
              }}
            >
              {t("files.base64Page.encodeMode")}
            </Button>
            <Button
              type="button"
              variant={mode === "decode" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setMode("decode");
                setOutput("");
                setDecodedBytes(null);
                setError(null);
              }}
            >
              {t("files.base64Page.decodeMode")}
            </Button>
          </div>

          {mode === "encode" ? (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={encodeSource === "text" ? "default" : "outline"}
                  onClick={() => {
                    setEncodeSource("text");
                    setFile(null);
                    setOutput("");
                  }}
                >
                  {t("files.base64Page.encodeTextSource")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={encodeSource === "file" ? "default" : "outline"}
                  onClick={() => {
                    setEncodeSource("file");
                    setTextInput("");
                    setOutput("");
                  }}
                >
                  {t("files.base64Page.encodeFileSource")}
                </Button>
              </div>
              {encodeSource === "text" ? (
                <div className="space-y-2">
                  <Label htmlFor="encode-text">{t("files.base64Page.textInputLabel")}</Label>
                  <textarea
                    id="encode-text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={6}
                    placeholder={t("files.base64Page.textInputPlaceholder")}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t("files.base64Page.fileLabel")}</Label>
                  <FileDropzone
                    value={file}
                    onFileChange={(v) => setFile(Array.isArray(v) ? v[0] ?? null : v)}
                    hint={t("files.base64Page.dropzoneHint")}
                    activeHint={t("files.page.dropzoneActive")}
                    removeLabel={t("images.removeFile")}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="b64-input">{t("files.base64Page.base64InputLabel")}</Label>
              <textarea
                id="b64-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={6}
                placeholder={t("files.base64Page.base64InputPlaceholder")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {mode === "decode" && decodedBytes && (
            <p className="text-xs text-muted-foreground">
              {t("files.base64Page.binaryHint")}
            </p>
          )}

          {output !== "" || decodedBytes ? (
            <div className="space-y-2">
              <Label>{t("files.base64Page.outputLabel")}</Label>
              <textarea
                readOnly
                value={output}
                rows={8}
                className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 font-mono text-xs"
              />
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {mode === "encode" ? (
            <Button
              onClick={handleEncode}
              disabled={
                encodeSource === "text" ? !textInput.trim() : !file
              }
            >
              {t("files.base64Page.encodeBtn")}
            </Button>
          ) : (
            <Button onClick={handleDecode} disabled={!textInput.trim()}>
              {t("files.base64Page.decodeBtn")}
            </Button>
          )}
          {(output || decodedBytes) && (
            <>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={copyOutput}
                disabled={!output && !!decodedBytes}
              >
                <Copy className="h-4 w-4" aria-hidden />
                {t("files.base64Page.copyBtn")}
              </Button>
              {mode === "decode" && (decodedBytes || output) && (
                <Button type="button" variant="outline" className="gap-2" onClick={handleDownloadDecoded}>
                  <Download className="h-4 w-4" aria-hidden />
                  {t("files.base64Page.downloadBtn")}
                </Button>
              )}
              {mode === "encode" && output && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const blob = new Blob([output], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download =
                      encodeSource === "file" && file
                        ? `${baseName(file.name)}.base64.txt`
                        : "encoded.base64.txt";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {t("files.page.downloadResult")}
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
