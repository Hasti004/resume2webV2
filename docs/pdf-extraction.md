# PDF text extraction (client-side)

This app uses **react-pdftotext** (pdf.js under the hood) to extract plain text from PDFs in the browser.

- **Text-based PDFs only:** Works only for PDFs with selectable text (e.g. exported from Google Docs, Word).
- **No OCR:** Scanned or image-only PDFs will not extract meaningful text; the user will see an error suggesting they upload a text-based PDF or paste the content.

## Worker-related errors

If you see errors mentioning **worker**, **GlobalWorkerOptions**, or **pdf.js worker**:

- The bundler must support loading the pdf.js worker (e.g. from `node_modules/pdfjs-dist/build/pdf.worker.*`).
- **Vite:** Ensure the worker is copied or inlined as needed; you may need to configure `worker` in vite.config or add a small wrapper that sets `GlobalWorkerOptions.workerSrc` if the library expects it.
- **Next.js:** Use the same pattern; ensure the worker script is served from `public` or configured in `next.config` so pdf.js can load it. If the error persists, add a clear “PDF worker not configured” message in the UI and point users to this doc.

## Usage

- **Module:** `src/lib/pdf/extractPdfText.ts` — `extractPdfText(file, opts?)` returns `PdfExtractResult`.
- **Hook:** `src/hooks/usePdfTextExtraction.ts` — `usePdfTextExtraction()` returns `{ status, text, error, meta, run, reset }`.
- **Upload flow:** On Create page, when the user selects a PDF file, text is extracted client-side and the project is created with that text (no PDF file upload).
