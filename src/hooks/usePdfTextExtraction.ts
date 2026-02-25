import { useState } from "react";
import type { PdfExtractError, PdfExtractMeta } from "@/lib/pdf/extractPdfText";
import { extractPdfText } from "@/lib/pdf/extractPdfText";

export type PdfExtractStatus = "idle" | "extracting" | "success" | "error";

export function usePdfTextExtraction() {
  const [state, setState] = useState<{
    status: PdfExtractStatus;
    text?: string;
    error?: PdfExtractError;
    meta?: PdfExtractMeta;
  }>({ status: "idle" });

  async function run(file: File) {
    setState({ status: "extracting" });
    const res = await extractPdfText(file);
    if (res.ok) {
      setState({ status: "success", text: res.text, meta: res.meta });
    } else {
      setState({ status: "error", error: res.error, meta: res.meta });
    }
    return res;
  }

  function reset() {
    setState({ status: "idle" });
  }

  return { ...state, run, reset };
}
