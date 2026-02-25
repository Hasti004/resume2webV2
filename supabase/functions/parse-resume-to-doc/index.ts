// @ts-nocheck — Supabase Edge Functions run on Deno.
// Real implementation: resume_files → extract text → Gemini → validate → save basics + blocks.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import JSZip from "npm:jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STORAGE_BUCKET = "resumes";
const RESUMES_TABLE = "resumes";
const RESUME_BLOCKS_TABLE = "resume_blocks";
const RESUME_FILES_TABLE = "resume_files";

const BlockSchema = z.object({
  type: z.string().min(1),
  title: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});
const GeminiResultSchema = z.object({
  basics: z.record(z.unknown()),
  blocks: z.array(BlockSchema),
});

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function errResponse(stage: string, error: string, status = 500) {
  console.error(`[parse-resume-to-doc] ${stage}:`, error);
  return jsonResponse({ ok: false, stage, error }, status);
}

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/** Extract text from DOCX (word/document.xml <w:t>). */
async function extractDocxText(bytes: Uint8Array): Promise<string> {
  const zip = await JSZip.loadAsync(bytes);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) throw new Error("Missing word/document.xml in DOCX");
  return docXml
    .replace(/<w:t[^>]*>([^<]*)<\/w:t>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract text from PDF using jsr:@pdf/pdftext. */
async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const { pdfText } = await import("jsr:@pdf/pdftext@1.3.2");
  const pages = await pdfText(bytes);
  const text =
    typeof pages === "object" && pages !== null
      ? Object.keys(pages)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => (pages as Record<string, string>)[k])
          .join("\n")
      : "";
  const trimmed = (text ?? "").trim();
  if (trimmed.length < 20) throw new Error("PDF text extraction returned too little text.");
  return trimmed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const resumeId = (body?.resumeId ?? body?.body?.resumeId ?? "").toString().trim();

  if (body?.ping === true || body?.body?.ping === true) {
    return jsonResponse({ ok: true, pong: true });
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!resumeId || !UUID_REGEX.test(resumeId)) {
    return errResponse("input", "Valid resumeId (UUID) required", 400);
  }

  let supabase: ReturnType<typeof createClient>;
  try {
    const url = getEnv("SUPABASE_URL");
    const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    supabase = createClient(url, key);
  } catch (e) {
    return errResponse("config", String(e), 500);
  }

  // Stage: load file (prefer resume_files, fallback to resumes.file_path / source_text)
  console.log("[parse-resume-to-doc] stage: load file");
  let sourceText: string | undefined;
  let bytes: Uint8Array | null = null;
  let storagePath = "";
  let mimeType = "";
  try {
    const { data: resumeRow, error: resumeErr } = await supabase
      .from(RESUMES_TABLE)
      .select("id, source_text, file_path")
      .eq("id", resumeId)
      .maybeSingle();
    if (resumeErr || !resumeRow) {
      return errResponse("load file", "Resume not found", 400);
    }

    const r = resumeRow as { source_text?: string | null; file_path?: string | null };
    const { data: fileRows, error: fileErr } = await supabase
      .from(RESUME_FILES_TABLE)
      .select("storage_path, mime_type")
      .eq("resume_id", resumeId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!fileErr && Array.isArray(fileRows) && fileRows.length > 0) {
      const row = fileRows[0] as { storage_path?: string; mime_type?: string };
      storagePath = row?.storage_path ?? "";
      mimeType = (row?.mime_type ?? "").toLowerCase();
      if (storagePath) {
        const { data: fileData, error: downloadErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .download(storagePath);
        if (!downloadErr && fileData) {
          bytes = new Uint8Array(await fileData.arrayBuffer());
          console.log("[parse-resume-to-doc] file from resume_files, size:", bytes.length, "mime:", mimeType);
        }
      }
    }

    if (!bytes && r.source_text?.trim()) {
      sourceText = r.source_text.trim();
      console.log("[parse-resume-to-doc] using resumes.source_text, length:", sourceText.length);
      bytes = null;
    } else if (!bytes && r.file_path?.trim()) {
      storagePath = r.file_path;
      mimeType = "";
      const { data: fileData, error: downloadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(storagePath);
      if (downloadErr || !fileData) {
        return errResponse("load file", downloadErr?.message ?? "Could not download file", 400);
      }
      bytes = new Uint8Array(await fileData.arrayBuffer());
      console.log("[parse-resume-to-doc] file from resumes.file_path, size:", bytes.length);
    }

    if (bytes) {
      console.log("[parse-resume-to-doc] stage: extract text");
      const ext = storagePath.split(".").pop()?.toLowerCase() ?? "";
      if (mimeType === "application/pdf" || ext === "pdf") {
        sourceText = await extractPdfText(bytes);
      } else if (mimeType === "text/plain" || ext === "txt") {
        sourceText = new TextDecoder("utf-8").decode(bytes).trim();
      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        ext === "docx"
      ) {
        sourceText = await extractDocxText(bytes);
      } else {
        return errResponse("extract text", `Unsupported type: ${mimeType || ext}. Use PDF, TXT, or DOCX.`, 400);
      }
      if (!sourceText || sourceText.length < 20) {
        return errResponse("extract text", "Extracted text is empty or too short", 400);
      }
      console.log("[parse-resume-to-doc] extracted text length:", sourceText.length);
    }
  } catch (e) {
    return errResponse("load file", String(e), 500);
  }

  if (typeof sourceText !== "string" || !sourceText.trim()) {
    return errResponse("load file", "No resume file or pasted text. Upload a file or paste text.", 400);
  }

  // Stage: gemini
  console.log("[parse-resume-to-doc] stage: gemini");
  let parsed: z.infer<typeof GeminiResultSchema>;
  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const prompt = `You are a resume parser. Extract structured data from the following resume text.
Output ONLY valid JSON. No markdown, no code fences. Use this exact structure:
{
  "basics": {
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "headline": "string or null",
    "summary": "string or null",
    "linkedin": "string or null",
    "github": "string or null",
    "portfolio": "string or null"
  },
  "blocks": [
    { "type": "summary", "title": "optional", "data": { "text": "..." } },
    { "type": "experience", "title": "Work Experience", "data": { "items": [...] } },
    { "type": "education", "title": "Education", "data": { "items": [...] } },
    { "type": "skills", "title": "Skills", "data": { "items": [...] } }
  ]
}
Infer block types from content. Keep "data" flexible (objects or arrays as needed).

Resume text:
---
${sourceText.slice(0, 50000)}
---`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API: ${res.status} ${errText.slice(0, 200)}`);
    }

    const json = await res.json();
    const text =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ??
      json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!text) throw new Error("Empty response from Gemini");

    let raw: unknown;
    try {
      raw = JSON.parse(text.trim());
    } catch {
      throw new Error("Gemini returned invalid JSON");
    }

    const result = GeminiResultSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.message}`);
    }
    parsed = result.data;
  } catch (e) {
    return errResponse("gemini", String(e), 500);
  }

  // Stage: save
  console.log("[parse-resume-to-doc] stage: save");
  try {
    const { data: existingMeta } = await supabase
      .from(RESUMES_TABLE)
      .select("meta")
      .eq("id", resumeId)
      .maybeSingle();
    const currentMeta =
      existingMeta?.meta != null && typeof existingMeta.meta === "object"
        ? (existingMeta.meta as Record<string, unknown>)
        : {};

    const { error: updateError } = await supabase
      .from(RESUMES_TABLE)
      .update({
        basics: parsed.basics,
        meta: { ...currentMeta, parsed: true },
        updated_at: new Date().toISOString(),
      })
      .eq("id", resumeId);

    if (updateError) throw new Error(updateError.message);

    const { error: deleteError } = await supabase
      .from(RESUME_BLOCKS_TABLE)
      .delete()
      .eq("resume_id", resumeId);
    if (deleteError) throw new Error(deleteError.message);

    if (parsed.blocks.length > 0) {
      const rows = parsed.blocks.map((b, i) => ({
        resume_id: resumeId,
        type: b.type,
        title: b.title ?? null,
        content: b.data ?? {},
        sort_order: i,
      }));
      const { error: insertError } = await supabase.from(RESUME_BLOCKS_TABLE).insert(rows);
      if (insertError) throw new Error(insertError.message);
    }
  } catch (e) {
    return errResponse("save", String(e), 500);
  }

  const blocksCount = parsed.blocks.length;
  console.log("[parse-resume-to-doc] done, blocksCount:", blocksCount);
  return jsonResponse({ ok: true, blocksCount });
});
