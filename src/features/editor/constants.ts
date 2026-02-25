export const LAST_OPENED_RESUME_ID_KEY = "lastOpenedResumeId";

/** localStorage key for draft cache per resume (value: { basics, blocks, templateId, updatedAt }). */
export const getLocalDraftKey = (resumeId: string) => `resume-draft-${resumeId}`;

export const LOCAL_SAVE_INTERVAL_MS = 2000;
export const CLOUD_SAVE_DEBOUNCE_MS = 1500;
