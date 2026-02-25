import pdfToText from "react-pdftotext";
import { withTimeout, TimeoutError } from "@/lib/async/withTimeout";

export type PdfExtractErrorCode =
  | "PDF_PASSWORD"
  | "PDF_CORRUPT"
  | "PDF_UNSUPPORTED"
  | "PDF_EXTRACTION_FAILED"
  | "TIMEOUT"
  | "UNKNOWN";

export type PdfExtractError = {
  code: PdfExtractErrorCode;
  messageUser: string;
  messageDev: string;
  cause?: unknown;
};

export type PdfExtractMeta = {
  fileName: string;
  fileSize: number;
  fileType: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  pagesAttempted?: number | null;
  charCount: number;
};

export type PdfExtractResult =
  | { ok: true; text: string; meta: PdfExtractMeta }
  | { ok: false; error: PdfExtractError; meta: PdfExtractMeta };

export type ExtractPdfTextOpts = {
  timeoutMs?: number;
  minChars?: number;
  maxChars?: number;
};

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_MIN_CHARS = 200;
const DEFAULT_MAX_CHARS = 200_000;

/**
 * Normalize raw PDF-extracted text: CRLF→LF, remove nulls, collapse spaces (keep newlines), trim lines, collapse 3+ blank lines to 2.
 * Optional unit tests (when Vitest is added): CRLF→LF, collapses blank lines, removes null chars.
 */
export function normalizePdfText(input: string): string {
  if (typeof input !== "string") return "";
  let s = input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "");
  s = s.replace(/[^\S\n]+/g, " ");
  s = s
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

function mapPdfError(e: unknown): PdfExtractError {
  const msg = e instanceof Error ? e.message : String(e);
  const msgLower = msg.toLowerCase();

  if (
    msgLower.includes("password") ||
    msgLower.includes("encrypted") ||
    msgLower.includes("decrypt")
  ) {
    return {
      code: "PDF_PASSWORD",
      messageUser: "This PDF is password-protected. Please use an unlocked version or paste the text.",
      messageDev: msg,
      cause: e,
    };
  }
  if (
    msgLower.includes("invalid pdf") ||
    msgLower.includes("corrupt") ||
    msgLower.includes("format error")
  ) {
    return {
      code: "PDF_CORRUPT",
      messageUser: "This PDF appears corrupted or invalid. Try re-exporting or use a different file.",
      messageDev: msg,
      cause: e,
    };
  }
  if (
    msgLower.includes("worker") ||
    msgLower.includes("globalworkeroptions") ||
    msgLower.includes("pdf.js")
  ) {
    return {
      code: "PDF_UNSUPPORTED",
      messageUser: "PDF worker is not configured. Please contact support or try another browser.",
      messageDev: `PDF worker config required: ${msg}. See docs/pdf-extraction.md.`,
      cause: e,
    };
  }
  if (e instanceof TimeoutError) {
    return {
      code: "TIMEOUT",
      messageUser: "PDF extraction took too long. Try a smaller file or paste the text instead.",
      messageDev: msg,
      cause: e,
    };
  }
  return {
    code: "UNKNOWN",
    messageUser: "We couldn't extract text from this PDF. Please upload a text-based PDF (selectable text) or paste the content.",
    messageDev: msg,
    cause: e,
  };
}

/**
 * Extract plain text from a PDF file (client-side, text-based PDFs only; no OCR).
 */
export async function extractPdfText(
  file: File,
  opts?: ExtractPdfTextOpts
): Promise<PdfExtractResult> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const minChars = opts?.minChars ?? DEFAULT_MIN_CHARS;
  const maxChars = opts?.maxChars ?? DEFAULT_MAX_CHARS;

  const fileType = file.type || "";
  const fileName = file.name || "unknown.pdf";
  const fileSize = file.size ?? 0;

  if (fileType !== "application/pdf" && !fileName.toLowerCase().endsWith(".pdf")) {
    const meta: PdfExtractMeta = {
      fileName,
      fileSize,
      fileType,
      startedAt: Date.now(),
      endedAt: Date.now(),
      durationMs: 0,
      charCount: 0,
    };
    return {
      ok: false,
      error: {
        code: "PDF_UNSUPPORTED",
        messageUser: "Please select a PDF file.",
        messageDev: `Expected application/pdf or .pdf extension, got ${fileType} / ${fileName}`,
      },
      meta,
    };
  }

  if (fileSize <= 0) {
    const meta: PdfExtractMeta = {
      fileName,
      fileSize: 0,
      fileType,
      startedAt: Date.now(),
      endedAt: Date.now(),
      durationMs: 0,
      charCount: 0,
    };
    return {
      ok: false,
      error: {
        code: "PDF_EXTRACTION_FAILED",
        messageUser: "The selected file is empty.",
        messageDev: "file.size <= 0",
      },
      meta,
    };
  }

  const startedAt = Date.now();

  try {
    const rawPromise = pdfToText(file);
    const raw = await withTimeout(rawPromise, timeoutMs, "PDF extraction");
    const normalized = normalizePdfText(raw);
    const endedAt = Date.now();
    const durationMs = endedAt - startedAt;

    let text = normalized;
    if (text.length > maxChars) {
      text = text.slice(0, maxChars) + "\n\n[TRUNCATED]";
    }

    const meta: PdfExtractMeta = {
      fileName,
      fileSize,
      fileType,
      startedAt,
      endedAt,
      durationMs,
      pagesAttempted: null,
      charCount: text.length,
    };

    if (text.length < minChars) {
      return {
        ok: false,
        error: {
          code: "PDF_EXTRACTION_FAILED",
          messageUser:
            "We couldn't extract readable text from this PDF. Please upload a text-based PDF (selectable text) or a DOCX.",
          messageDev: `Extracted only ${text.length} chars (min ${minChars}). Likely scanned/image-only PDF.`,
        },
        meta,
      };
    }

    return { ok: true, text, meta };
  } catch (e) {
    const endedAt = Date.now();
    const meta: PdfExtractMeta = {
      fileName,
      fileSize,
      fileType,
      startedAt,
      endedAt,
      durationMs: endedAt - startedAt,
      pagesAttempted: null,
      charCount: 0,
    };
    const error = mapPdfError(e);
    return { ok: false, error, meta };
  }
}
