# Editor orchestrator – manual verification checklist

Use this to confirm the single-draft invariant and routing are correct.

---

## 1. Login → /dashboard/editor → Opens last draft immediately

**Expected:** You land on the editor for your most recent draft (no template picker if that draft already has a template).

**Steps:**
1. Log in.
2. Go to **Dashboard** → click whatever takes you to the editor, or go directly to `/dashboard/editor`.
3. You should be redirected to either:
   - `/dashboard/editor/<id>` (draft has template) → editor summary with “Edit content” / “Pick template”.
   - `/dashboard/editor/<id>/template` (draft has no template) → template picker.

**Code path:** `DashboardEditorRedirect` → `ensureDraftAndRoute({ userId, intent: 'open-editor' })` → no `requestedResumeId` → `getLatestDraft(userId)` → if `templateId` → `nextRoute = /dashboard/editor/:id`, else → template route.

---

## 2. New user → /dashboard/editor → Creates draft → opens template picker

**Expected:** A new draft is created and you see the template picker (no “missing draft” or blank screen).

**Steps:**
1. Use a user that has **no** resumes/drafts (new account or DB cleared for that user).
2. Go to `/dashboard/editor`.
3. You should be redirected to `/dashboard/editor/<new-id>/template` and see the template grid.

**Code path:** `ensureDraftAndRoute` → `getLatestDraft(userId)` → null → `createDraft(userId)` → no `templateId` → `nextRoute = /dashboard/editor/:id/template`.

---

## 3. Pick template → refresh page → Goes straight to editor

**Expected:** After choosing a template and landing in the editor, a full page refresh still shows the editor (no redirect to template picker or auth).

**Steps:**
1. Log in, go to `/dashboard/editor` (or create flow) until you’re on template picker.
2. Pick a template → you land on `/dashboard/editor/<id>/edit` (or `/dashboard/editor/<id>` with “Edit content”).
3. Refresh the page (F5 or Ctrl+R).
4. You should stay on the editor (same URL or same screen); doc loads, no redirect loop.

**Code path:** Draft has `template_id` in DB. If you refresh on `/dashboard/editor/:id`, `DashboardEditorPage` runs `ensureDraftAndRoute` → draft found with `templateId` → `nextRoute = /dashboard/editor/:id` → same as current path → render. If you refresh on `/dashboard/editor/:id/edit`, `EditorEditPage` only calls `loadResumeDoc(resumeId)` → doc (with templateId) loads.

---

## 4. Upload PDF → refresh mid-parse → Draft still opens

**Expected:** You can upload a PDF, get sent to template picker, and if you refresh while parsing is still running, the template picker (or editor) still loads for that draft; no crash or “draft not found”.

**Steps:**
1. Log in, go to `/dashboard/create`.
2. Upload a PDF → you’re redirected to `/dashboard/editor/<id>/template`.
3. While the page is loading (or right after), refresh (F5).
4. You should still see the template picker for that draft (or a brief load then same screen). No “resume not found” or redirect to dashboard.

**Code path:** Create flow calls `ensureDraftAndRoute` → draft created/selected → `createProjectFromSource(..., resumeId)` → `parseWithGemini(resumeId)` fire-and-forget → `navigate(.../template)`. Draft row exists with `file_path` before parse. On refresh, `TemplateSelection` runs `ensureDraftAndRoute({ requestedResumeId: params.resumeId, intent: 'open-template' })` → `getDraftById(resumeId)` returns the draft → `nextRoute` = same path → render.

---

## 5. Delete cache → open editor → Still works

**Expected:** After clearing site data / localStorage / sessionStorage (and optionally cache), opening the editor still works: you get a draft and the correct screen (editor or template picker).

**Steps:**
1. Log in and open the editor once (so you have a draft).
2. Open DevTools → Application (or Storage) → clear **Local storage**, **Session storage** (and optionally “Cache storage” for this origin).
3. Stay logged in (or log in again if auth was in storage).
4. Go to `/dashboard/editor` (or click your usual “Editor” link).
5. You should be redirected to the correct editor or template screen; no white screen or “missing draft”.

**Code path:** Orchestrator does not rely on client cache for draft identity. It always uses `getDraftById` / `getLatestDraft` / `createDraft` (Supabase). Auth is in Supabase session (cookie/storage); after re-auth, `user.id` is available and `ensureDraftAndRoute` runs against the DB.

---

## If all 5 pass

- Draft-is-identity (no parsing/validation gate) is enforced.
- Single entry point `ensureDraftAndRoute` controls where the user lands.
- New users get a draft and template picker; returning users get their latest draft; refresh and mid-parse refresh don’t break the flow; clearing client cache doesn’t break the editor. Architecture is correct.

## Quick reference – routes

| Route | Behavior |
|-------|----------|
| `/dashboard/editor` | `ensureDraftAndRoute` → navigate to last draft’s editor or template. |
| `/dashboard/editor/:id` | Ensure draft `:id` (and ownership) → if no template, redirect to `:id/template`; else render. |
| `/dashboard/editor/:id/template` | Ensure draft `:id` → if wrong id, redirect to correct draft’s template; else render picker. |
| `/dashboard/editor/:id/edit` | Load doc for `:id` and render editor (no orchestrator). |
| `/dashboard/create` | Upload/paste: ensure draft → set source → parse async → navigate to template. Continue: ensure draft → navigate to template. |
