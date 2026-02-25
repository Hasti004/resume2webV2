/**
 * Resume data layer — ONLY place that should call Supabase for resume/intake/parsing.
 * Re-exports from repository implementation.
 */
export {
  setIntake,
  createResume,
  createProjectFromSource,
  setDraftSource,
  getDraftById,
  getLatestDraft,
  createDraft,
  getResumeMeta,
  getResumeSource,
  saveParsedResult,
  parseWithGemini,
  parseResumeWithGemini,
  setTemplateId,
  getResumeTemplateId,
  loadResumeDoc,
  getResumeUpdatedAt,
  saveAll,
  markLastOpened,
  listDraftsForUser,
  aiEdit,
} from "@/repositories/resumeRepo";
export type {
  ResumeRow,
  ResumeDraft,
  ResumeSource,
  ResumeBasics,
  ResumeBlock,
  ParsedResumeResult,
  ResumeDoc,
  CreateProjectSource,
  ResumeListItem,
  ParseResult,
  AiEditInput,
  AiEditResult,
} from "@/repositories/resumeRepo";
