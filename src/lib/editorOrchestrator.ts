/**
 * Single entry point for all editor/draft routing.
 * Invariant: If the user can see an editor screen, a draft MUST already exist.
 * No parsing checks, no validation checks — only draft identity and template.
 */

import { getDraftById, getLatestDraft, createDraft } from "@/lib/resumeRepo";

export type EditorIntent = "open-editor" | "open-template";

export interface EnsureDraftInput {
  userId: string | null | undefined;
  requestedResumeId?: string | null;
  intent: EditorIntent;
}

export interface EnsureDraftResult {
  resumeId: string;
  templateId: string | null;
  nextRoute: string;
}

/**
 * Ensures a draft exists and returns where to go.
 * Step 1: No auth → nextRoute = '/auth'.
 * Step 2: Resolve draft: requestedResumeId (if owned by user) → latest draft → create new.
 * Step 3: nextRoute by intent and templateId:
 *   - intent === 'open-template' → /dashboard/editor/:id/template
 *   - templateId exists → /dashboard/editor/:id
 *   - templateId missing → /dashboard/editor/:id/template
 */
export async function ensureDraftAndRoute(input: EnsureDraftInput): Promise<EnsureDraftResult> {
  const { userId, requestedResumeId, intent } = input;

  if (!userId?.trim()) {
    return { resumeId: "", templateId: null, nextRoute: "/auth" };
  }

  let draft = null;
  if (requestedResumeId?.trim()) {
    const found = await getDraftById(requestedResumeId.trim());
    if (found && found.userId === userId) draft = found;
  }
  if (!draft) {
    draft = await getLatestDraft(userId);
  }
  if (!draft) {
    draft = await createDraft(userId);
  }

  const id = draft.id;
  const templateId = draft.templateId;

  if (intent === "open-template") {
    return { resumeId: id, templateId, nextRoute: `/dashboard/editor/${id}/template` };
  }
  if (templateId) {
    return { resumeId: id, templateId, nextRoute: `/dashboard/editor/${id}` };
  }
  return { resumeId: id, templateId: null, nextRoute: `/dashboard/editor/${id}/template` };
}
