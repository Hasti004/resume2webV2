import { supabase } from "@/integrations/supabase/client";
import type { IntakeProfile } from "@/features/intake/types";

const RESUMES_TABLE = "resumes";
const RESUME_BLOCKS_TABLE = "resume_blocks";
const PARSE_EDGE_FUNCTION = "parse-resume-to-doc";
const AI_EDIT_EDGE_FUNCTION = "ai-edit-resume-doc";

export interface ResumeRow {
  id: string;
  user_id: string;
  title?: string;
  template_id?: string | null;
  meta?: { intake?: IntakeProfile; parsed?: boolean; selectedTemplateId?: string; [key: string]: unknown };
  basics?: Record<string, unknown> | null;
  source_text?: string | null;
  file_path?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Draft = resume identity only. No blocks/parsing required. Used by editor orchestrator. */
export interface ResumeDraft {
  id: string;
  userId: string;
  templateId: string | null;
  status: "draft" | "published" | "archived";
  updatedAt: string;
}

export interface ResumeSource {
  sourceText: string | null;
  filePath: string | null;
  intakeContext: IntakeProfile | null;
}

export interface ResumeBasics {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface ResumeBlock {
  id?: string;
  type: string;
  content: Record<string, unknown>;
  sort_order?: number;
}

/** Full document for the editor: basics + blocks + templateId */
export interface ResumeDoc {
  basics: ResumeBasics;
  blocks: ResumeBlock[];
  templateId: string | null;
}

export interface ParsedResumeResult {
  basics: ResumeBasics;
  blocks: ResumeBlock[];
}

/**
 * Upsert resume meta (including intake). Expects resumes table with meta jsonb.
 * Schema: id, user_id, title?, meta? (jsonb), created_at?, updated_at?
 */
export async function setIntake(resumeId: string, intakeProfile: IntakeProfile): Promise<void> {
  const { data: existing } = await supabase
    .from(RESUMES_TABLE)
    .select("meta")
    .eq("id", resumeId)
    .maybeSingle();

  const currentMeta =
    existing?.meta != null && typeof existing.meta === "object"
      ? (existing.meta as Record<string, unknown>)
      : {};
  const { error } = await supabase
    .from(RESUMES_TABLE)
    .update({
      meta: { ...currentMeta, intake: intakeProfile },
      updated_at: new Date().toISOString(),
    })
    .eq("id", resumeId);

  if (error) throw error;
}

const RESUME_STORAGE_BUCKET = "resumes";

/**
 * Create a new resume and return its id. Used after intake completion.
 * Inserts only user_id and title so it works even if meta/other columns are missing.
 */
export async function createResume(userId: string, title?: string): Promise<string> {
  const { data, error } = await supabase
    .from(RESUMES_TABLE)
    .insert({
      user_id: userId,
      title: title ?? "Untitled Resume",
    })
    .select("id")
    .single();

  if (error) throw error;
  if (!data?.id) throw new Error("No id returned from createResume");
  return data.id as string;
}

function rowToDraft(row: { id: string; user_id: string; template_id?: string | null; updated_at?: string | null }): ResumeDraft {
  return {
    id: row.id,
    userId: row.user_id,
    templateId: typeof row.template_id === "string" && row.template_id.trim() ? row.template_id : null,
    status: "draft",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

/**
 * Get draft by id. Returns null if not found. Does not check ownership (orchestrator checks).
 */
export async function getDraftById(resumeId: string): Promise<ResumeDraft | null> {
  if (!resumeId?.trim()) return null;
  const { data, error } = await supabase
    .from(RESUMES_TABLE)
    .select("id, user_id, template_id, updated_at")
    .eq("id", resumeId.trim())
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToDraft(data as { id: string; user_id: string; template_id?: string | null; updated_at?: string | null });
}

/**
 * Get the latest draft for a user (by updated_at desc). Returns null if none.
 */
export async function getLatestDraft(userId: string): Promise<ResumeDraft | null> {
  if (!userId?.trim()) return null;
  const { data, error } = await supabase
    .from(RESUMES_TABLE)
    .select("id, user_id, template_id, updated_at")
    .eq("user_id", userId.trim())
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToDraft(data as { id: string; user_id: string; template_id?: string | null; updated_at?: string | null });
}

/**
 * Create a new draft for the user. Always returns a draft (never null).
 */
export async function createDraft(userId: string): Promise<ResumeDraft> {
  const id = await createResume(userId);
  const draft = await getDraftById(id);
  if (!draft) throw new Error("createDraft: draft not found after insert");
  return draft;
}

export type CreateProjectSource = { file?: File; text?: string };

/**
 * Set source (file or text) on an existing draft. Used when ensureDraftAndRoute already created/selected the draft.
 */
export async function setDraftSource(
  resumeId: string,
  userId: string,
  source: CreateProjectSource
): Promise<void> {
  if (source.file) {
    const safeName = source.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${userId}/${resumeId}/${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(RESUME_STORAGE_BUCKET)
      .upload(filePath, source.file, { upsert: true });
    if (uploadError) throw uploadError;
    const { error: updateError } = await supabase
      .from(RESUMES_TABLE)
      .update({ file_path: filePath })
      .eq("id", resumeId);
    if (updateError) throw updateError;
    return;
  }
  if (source.text != null && source.text.trim()) {
    const { error: updateError } = await supabase
      .from(RESUMES_TABLE)
      .update({ source_text: source.text.trim() })
      .eq("id", resumeId);
    if (updateError) throw updateError;
    return;
  }
  throw new Error("Provide a file or non-empty text.");
}

/**
 * Create a resume project from uploaded file or pasted text. Stores source for parse-resume-to-doc.
 * If existingResumeId is provided, uses that draft and only sets source (no new row). Otherwise creates a new draft.
 * Returns the resume id. Does not parse; caller may call parseWithGemini(resumeId) and navigate.
 */
export async function createProjectFromSource(
  userId: string,
  source: CreateProjectSource,
  existingResumeId?: string | null
): Promise<string> {
  const resumeId = existingResumeId?.trim()
    ? existingResumeId
    : await createResume(userId);
  if (existingResumeId?.trim()) {
    await setDraftSource(resumeId, userId, source);
    return resumeId;
  }
  if (source.file) {
    const safeName = source.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${userId}/${resumeId}/${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(RESUME_STORAGE_BUCKET)
      .upload(filePath, source.file, { upsert: true });
    if (uploadError) throw uploadError;
    const { error: updateError } = await supabase
      .from(RESUMES_TABLE)
      .update({ file_path: filePath })
      .eq("id", resumeId);
    if (updateError) throw updateError;
    return resumeId;
  }
  if (source.text != null && source.text.trim()) {
    const { error: updateError } = await supabase
      .from(RESUMES_TABLE)
      .update({ source_text: source.text.trim() })
      .eq("id", resumeId);
    if (updateError) throw updateError;
    return resumeId;
  }
  throw new Error("Provide a file or non-empty text.");
}

/**
 * Load resume meta (including intake) for the editor. Used when state is missing (e.g. refresh).
 */
export async function getResumeMeta(resumeId: string): Promise<ResumeRow["meta"] | null> {
  const { data, error } = await supabase
    .from(RESUMES_TABLE)
    .select("meta")
    .eq("id", resumeId)
    .maybeSingle();

  if (error) throw error;
  return (data?.meta as ResumeRow["meta"]) ?? null;
}

/**
 * Get the selected template id for a resume (for redirect logic after scanning).
 */
export async function getResumeTemplateId(resumeId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from(RESUMES_TABLE)
    .select("template_id")
    .eq("id", resumeId)
    .maybeSingle();

  if (error) throw error;
  const id = data?.template_id;
  return typeof id === "string" && id.trim() ? id : null;
}

/**
 * Set the selected template for a resume. Updates template_id and updated_at.
 * Call from Template Selection only; no Supabase in pages.
 */
export async function setTemplateId(resumeId: string, templateId: string): Promise<void> {
  if (!resumeId?.trim()) {
    throw new Error("Resume ID is required.");
  }
  if (!templateId?.trim()) {
    throw new Error("Template ID is required.");
  }

  const { data, error } = await supabase
    .from(RESUMES_TABLE)
    .update({
      template_id: templateId.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", resumeId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("Resume not found. It may have been deleted.");
    }
    throw new Error(error.message || "Failed to save template selection.");
  }
  if (!data) {
    throw new Error("Resume not found.");
  }
}

/** List item for dashboard: id, title, updated_at, status */
export interface ResumeListItem {
  id: string;
  title: string;
  updatedAt: string;
  status: string;
}

/**
 * Save full document (basics + blocks) to DB. Replaces all blocks for this resume.
 * Use for editor autosave or explicit save. Does not change template_id or meta.
 */
export async function saveAll(resumeId: string, doc: ResumeDoc): Promise<void> {
  const { error: updateError } = await supabase
    .from(RESUMES_TABLE)
    .update({
      basics: doc.basics ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", resumeId);

  if (updateError) throw updateError;

  await supabase.from(RESUME_BLOCKS_TABLE).delete().eq("resume_id", resumeId);

  if (doc.blocks?.length) {
    const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const rows = doc.blocks.map((b, i) => {
      const id = b.id && uuidLike.test(String(b.id)) ? b.id : undefined;
      return {
        ...(id ? { id } : {}),
        resume_id: resumeId,
        type: b.type,
        content: b.content ?? {},
        sort_order: b.sort_order ?? i,
      };
    });
    const { error: insertError } = await supabase.from(RESUME_BLOCKS_TABLE).insert(rows);
    if (insertError) throw insertError;
  }
}

/**
 * Mark resume as last opened by the user (e.g. meta.lastOpenedAt). Used for dashboard ordering.
 */
export async function markLastOpened(resumeId: string, _userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from(RESUMES_TABLE)
    .select("meta")
    .eq("id", resumeId)
    .maybeSingle();

  const currentMeta =
    existing?.meta != null && typeof existing.meta === "object"
      ? (existing.meta as Record<string, unknown>)
      : {};
  const { error } = await supabase
    .from(RESUMES_TABLE)
    .update({
      meta: { ...currentMeta, lastOpenedAt: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq("id", resumeId);

  if (error) throw error;
}

/**
 * List resumes for the current user (dashboard). Ordered by updated_at desc.
 */
export async function listDraftsForUser(userId: string): Promise<ResumeListItem[]> {
  if (!userId?.trim()) return [];
  const { data, error } = await supabase
    .from(RESUMES_TABLE)
    .select("id, title, updated_at, status")
    .eq("user_id", userId.trim())
    .order("updated_at", { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as { id: string; title?: string | null; updated_at?: string | null; status?: string | null }[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title ?? "Untitled Resume",
    updatedAt: typeof r.updated_at === "string" ? r.updated_at : new Date().toISOString(),
    status: r.status ?? "draft",
  }));
}

/**
 * Get server updated_at for a resume (for restore / conflict check).
 */
export async function getResumeUpdatedAt(resumeId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from(RESUMES_TABLE)
    .select("updated_at")
    .eq("id", resumeId)
    .maybeSingle();

  if (error) throw error;
  const at = data?.updated_at;
  return typeof at === "string" ? at : null;
}

/**
 * Load full resume document for the editor: basics, blocks, templateId.
 */
export async function loadResumeDoc(resumeId: string): Promise<ResumeDoc> {
  const { data: resumeRow, error: resumeError } = await supabase
    .from(RESUMES_TABLE)
    .select("basics, template_id")
    .eq("id", resumeId)
    .maybeSingle();

  if (resumeError) throw resumeError;
  if (!resumeRow) throw new Error("Resume not found");

  const { data: blockRows, error: blocksError } = await supabase
    .from(RESUME_BLOCKS_TABLE)
    .select("id, type, content, sort_order")
    .eq("resume_id", resumeId)
    .order("sort_order", { ascending: true });

  if (blocksError) throw blocksError;

  const basics =
    resumeRow.basics != null && typeof resumeRow.basics === "object"
      ? (resumeRow.basics as ResumeBasics)
      : {};
  const blocks: ResumeBlock[] = (blockRows ?? []).map((r: { id: string; type: string; content: unknown; sort_order: number }) => ({
    id: r.id,
    type: r.type,
    content: (r.content as Record<string, unknown>) ?? {},
    sort_order: r.sort_order,
  }));
  const templateId =
    typeof resumeRow.template_id === "string" && resumeRow.template_id.trim()
      ? resumeRow.template_id
      : null;

  return { basics, blocks, templateId };
}

/**
 * Get resume source text/path and intake context for parsing. Used by Scanning page.
 */
export async function getResumeSource(resumeId: string): Promise<ResumeSource> {
  const { data, error } = await supabase
    .from(RESUMES_TABLE)
    .select("meta, source_text, file_path")
    .eq("id", resumeId)
    .maybeSingle();

  if (error) throw error;
  const row = data as { meta?: ResumeRow["meta"]; source_text?: string | null; file_path?: string | null } | null;
  const meta = row?.meta;
  const intake =
    meta && typeof meta === "object" && "intake" in meta
      ? (meta as ResumeRow["meta"])?.intake ?? null
      : null;
  return {
    sourceText: row?.source_text ?? null,
    filePath: row?.file_path ?? null,
    intakeContext: intake ?? null,
  };
}

/**
 * Save parsed result: resume basics, resume_blocks, and set meta.parsed = true.
 */
export async function saveParsedResult(
  resumeId: string,
  result: ParsedResumeResult
): Promise<void> {
  const { data: existing } = await supabase
    .from(RESUMES_TABLE)
    .select("meta")
    .eq("id", resumeId)
    .maybeSingle();

  const currentMeta =
    existing?.meta != null && typeof existing.meta === "object"
      ? (existing.meta as Record<string, unknown>)
      : {};
  const { error: updateError } = await supabase
    .from(RESUMES_TABLE)
    .update({
      basics: result.basics,
      meta: { ...currentMeta, parsed: true },
      updated_at: new Date().toISOString(),
    })
    .eq("id", resumeId);

  if (updateError) throw updateError;

  await supabase.from(RESUME_BLOCKS_TABLE).delete().eq("resume_id", resumeId);

  if (result.blocks.length > 0) {
    const rows = result.blocks.map((b, i) => ({
      resume_id: resumeId,
      type: b.type,
      content: b.content,
      sort_order: b.sort_order ?? i,
    }));
    const { error: insertError } = await supabase.from(RESUME_BLOCKS_TABLE).insert(rows);
    if (insertError) throw insertError;
  }
}

export interface ParseResult {
  success: true;
  durationMs?: number;
}

const parseInFlight = new Map<string, Promise<ParseResult>>();

/**
 * Call Edge Function parse-resume-to-doc. Function loads source from DB, calls Gemini, saves basics + blocks.
 * Returns structured result. Prevents duplicate concurrent calls for the same resumeId.
 */
export async function parseWithGemini(resumeId: string): Promise<ParseResult> {
  const id = resumeId?.trim();
  if (!id) {
    throw new Error("Resume ID is required.");
  }

  const existing = parseInFlight.get(id);
  if (existing) return existing;

  const promise = (async (): Promise<ParseResult> => {
    try {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        error?: string;
        code?: string;
        durationMs?: number;
        basicsCount?: number;
        blocksCount?: number;
      }>(PARSE_EDGE_FUNCTION, { body: { resumeId: id } });

      if (data?.error) {
        const msg = data.error;
        const code = data.code;
        throw new Error(code ? `${msg} (${code})` : msg);
      }
      if (error) {
        throw new Error(error.message || "Parse request failed.");
      }
      if (data?.ok !== true) {
        throw new Error("Parsing did not complete. Please try again or skip to manual edit.");
      }
      return { success: true as const, durationMs: data?.durationMs };
    } finally {
      parseInFlight.delete(id);
    }
  })();

  parseInFlight.set(id, promise);
  return promise;
}

/** @deprecated Use parseWithGemini. Kept for backward compatibility. */
export async function parseResumeWithGemini(resumeId: string): Promise<void> {
  return parseWithGemini(resumeId);
}

export interface AiEditInput {
  basics: ResumeBasics;
  blocks: ResumeBlock[];
  instruction: string;
  scope: string;
  selectedBlockId?: string | null;
}

export interface AiEditResult {
  basicsProposed: ResumeBasics;
  blocksProposed: ResumeBlock[];
}

/**
 * Call Edge Function ai-edit-resume-doc. Returns proposed basics and blocks; never overwrites. Apply only after user accepts.
 */
export async function aiEdit(input: AiEditInput): Promise<AiEditResult> {
  const { basics, blocks, instruction, scope, selectedBlockId } = input;
  if (!instruction?.trim()) throw new Error("Instruction is required.");
  const payload = {
    basics: basics ?? {},
    blocks: blocks ?? [],
    instruction: instruction.trim(),
    scope: scope?.trim() || "full",
    selectedBlockId: selectedBlockId?.trim() || undefined,
  };
  const { data, error } = await supabase.functions.invoke<AiEditResult>(
    AI_EDIT_EDGE_FUNCTION,
    { body: payload }
  );
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data) {
    throw new Error((data as { error: string }).error ?? "AI edit failed");
  }
  const result = data as AiEditResult;
  if (!result || typeof result.basicsProposed !== "object" || !Array.isArray(result.blocksProposed)) {
    throw new Error("Invalid AI edit response: expected basicsProposed and blocksProposed.");
  }
  return result;
}
