# Resume2Web — Full Project Audit & Backend Setup

## PART 1 — Project Audit Summary

### Routes under /dashboard (from App.tsx)
| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard` | Dashboard | ✅ Exists |
| `/dashboard/create` | CreateResume | ✅ Exists |
| `/dashboard/scanning` | ResumeScanning | ✅ Exists (query: `resumeId`) |
| `/dashboard/edit` | EditSite | ✅ Exists |
| `/dashboard/editor` | DashboardEditorRedirect | ✅ Exists → redirects to editor/:id or template |
| `/dashboard/editor/:resumeId` | DashboardEditorPage | ✅ Exists (hub: template / edit links) |
| `/dashboard/editor/:resumeId/edit` | EditorEditPage | ✅ Exists (full editor with Basics/Content/AI + Preview) |
| `/dashboard/editor/:resumeId/template` | TemplateSelection | ✅ Exists |
| `/dashboard/templates` | TemplatesRedirect | ✅ Exists |
| `/dashboard/publish` | PublishSite | ✅ Exists |
| `/dashboard/sync` | SyncAccounts | ✅ Exists |
| `/dashboard/upgrade` | Upgrade | ✅ Exists |

### Create page
- **File:** `src/pages/CreateResume.tsx`
- **Behavior:** Upload (file) or paste (text / LaTeX); calls `createProjectFromSource(userId, { file } | { text })`; stores `resumeId` in state; Continue button navigates to **template**.
- **Issue:** Spec says "navigate to scanning" after create. Currently navigates to **template**; scanning is never used in the main flow.

### Scanning page
- **File:** `src/pages/ResumeScanning.tsx`
- **Behavior:** Reads `resumeId` from `?resumeId=`. Calls `parseWithGemini(resumeId)` (Edge Function); progress UI; on success redirects to `/dashboard/editor/:resumeId/template`; on error offers Retry / Skip to editor.
- **Wired:** No direct Supabase; uses `resumeRepo.parseWithGemini`. ✅

### Template selection page
- **File:** `src/pages/TemplateSelection.tsx`
- **Behavior:** `ensureDraftAndRoute` on mount; on "Use Template" calls `setTemplateId(resumeId, template.id)` then `navigate(/dashboard/editor/:resumeId/edit)`.
- **Wired:** Correct. ✅

### Editor page
- **File:** `src/pages/EditorEditPage.tsx`
- **Behavior:** Loads doc via `loadResumeDoc(resumeId)` → `setDoc(resumeId, doc)`; store is single source of truth; Basics/Content/AI panels + Preview; saves `resumeId` to `localStorage` (LAST_OPENED_RESUME_ID_KEY).
- **Missing:** No `saveAll` call; no autosave; store has `dirty`/`saving` but nothing persists to DB from editor. No `markLastOpened` in repo.

### Dashboard list
- **ProjectList:** `src/components/ProjectList.tsx` — uses empty array `projects = []`; not wired to any API. Placeholder.
- **ProjectCardGrid:** `src/components/ProjectCardGrid.tsx` — uses `MOCK_PROJECTS`; duplicate concept; not wired to DB.

### resumeRepo
- **File:** `src/repositories/resumeRepo.ts` (re-exported from `src/lib/resumeRepo.ts`)
- **Present:** `setIntake`, `createResume`, `createProjectFromSource`, `setDraftSource`, `getDraftById`, `getLatestDraft`, `createDraft`, `getResumeMeta`, `getResumeSource`, `saveParsedResult`, `parseWithGemini`, `parseResumeWithGemini`, `setTemplateId`, `getResumeTemplateId`, `loadResumeDoc`, `aiEdit`.
- **Missing:** `saveAll` (persist basics + blocks from editor), `markLastOpened` (e.g. touch `updated_at` when opening), and a **list** function for dashboard (e.g. `listDraftsForUser(userId)`).

### Supabase client
- **File:** `src/integrations/supabase/client.ts`
- **Behavior:** Creates client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; uses placeholders if missing so app still loads. ✅

### Migrations
- **Files:** `20250208000000_resume_parsing.sql`, `20250208100000_resumes_full_schema.sql`, `20250208200000_profiles_onboarding.sql`, `resumes_meta.sql`
- **resumes:** id, user_id, title, meta, source_text, file_path, basics, template_id, created_at, updated_at. No `status` column. No trigger for `updated_at`.
- **resume_blocks:** id, resume_id, type, content, sort_order, created_at. No `title`, no `updated_at`, no trigger.
- **profiles:** id (FK auth.users), onboarding_completed, created_at, updated_at. No `onboarding_completed_at`.
- **resume_files:** Table does not exist.
- **admin_roles:** Table does not exist.
- **RLS:** Commented out in migrations; not enabled.

### Storage usage
- **Bucket:** `resumes` — used in `resumeRepo` for upload in `setDraftSource` / `createProjectFromSource` (path: `userId/resumeId/filename`). No bucket creation or RLS in migrations; must be done in dashboard or manual SQL.

### Onboarding feature
- **Present:** `OnboardingGate`, `OnboardingModal`, `useOnboarding`, profileRepo `getProfile` / `setOnboardingCompleted`. Gate wraps app in `App.tsx`; shows modal when user logged in and profile has not `onboarding_completed`. ✅
- **Profile table:** Has `onboarding_completed`; no `onboarding_completed_at` (requested in spec).

---

## PART 2 — Missing / Incorrect / Duplicate / Incomplete

| Item | Status |
|------|--------|
| Create → Scanning | **Incorrect:** Create continues to template; should go to scanning so parse runs. |
| Dashboard list (ProjectList) | **Missing:** Not wired to DB; needs `listDraftsForUser` and use it. |
| ProjectCardGrid | **Duplicated:** Second list with mock data; remove or unify with ProjectList. |
| saveAll | **Missing:** No way to persist editor basics+blocks to DB. |
| markLastOpened | **Missing:** Not in repo; editor only sets localStorage. |
| Autosave / local cache | **Incomplete:** Store has dirty/saving but no save trigger. |
| resume_blocks.updated_at | **Missing:** No column, no trigger. |
| resumes.status | **Missing:** Spec asked for status text. |
| profiles.onboarding_completed_at | **Missing:** Spec asked for timestamp. |
| resume_files table | **Missing:** Spec required. |
| admin_roles table | **Optional:** Spec said "if exists". |
| RLS & triggers | **Missing:** Not enabled; no updated_at triggers. |
| Parse Edge Function retry | **Missing:** No retry if Gemini returns invalid JSON. |
| AI-edit Edge Function retry | **Missing:** No retry for invalid JSON. |
| Direct Supabase in components | **Correct:** Only in resumeRepo and profileRepo; no component calls supabase directly. ✅ |

---

## PART 3 — SQL Migration

See file: `supabase/migrations/20250209000000_full_schema_rls_triggers.sql` (generated below).

---

## PART 4 — Edge Function Code

- **parse-resume-to-doc:** Add retry loop (e.g. 2 retries) around Gemini call + JSON parse + Zod validate.
- **ai-edit-resume-doc:** Add same retry logic; keep Zod and CORS. Code changes applied in repo.

---

## PART 5 — resumeRepo Updates

- Add `saveAll(resumeId, doc)` — update `resumes.basics`, replace `resume_blocks` for that resume, set `updated_at`.
- Add `markLastOpened(resumeId)` — update `resumes.updated_at` for the given resume.
- Add `listDraftsForUser(userId)` — return list of drafts (id, title, updated_at, template_id) for dashboard.
- Re-export from `@/lib/resumeRepo`.
- Wire ProjectList to `listDraftsForUser` (and optionally remove or unify ProjectCardGrid — audit says "remove or wire same source").

---

## PART 6 — Manual Setup Steps (What You Must Do)

### SECTION A — Developer manual steps
1. **Supabase bucket:** Create storage bucket `resumes` in Supabase Dashboard (Storage).
2. **Storage policies:** Allow authenticated upload/read for `resumes` (e.g. user can read/write under own `user_id/` path).
3. **Environment variables:** Set in app `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. **Gemini API key:** In Supabase project: Settings → Edge Functions → Secrets → set `GEMINI_API_KEY`.
5. **Deploy Edge Functions:** `supabase functions deploy parse-resume-to-doc`, `supabase functions deploy ai-edit-resume-doc`.
6. **RLS:** After applying migration, enable RLS on `resumes`, `resume_blocks`, `profiles` (policies are in migration); test with a user.
7. **Domain / redirects:** If using custom domain for auth or app, configure in Supabase Auth URL and site URL.

### SECTION B — What Cursor will generate
- Single SQL migration file (schema + RLS + triggers).
- Edge function updates (retry logic in parse-resume-to-doc and ai-edit-resume-doc).
- resumeRepo: `saveAll`, `markLastOpened`, `listDraftsForUser`.
- Wiring: ProjectList using `listDraftsForUser`; Create → navigate to scanning; optional autosave hook using `saveAll`.

### SECTION C — What must be tested manually
- Upload file on Create → Continue → Scanning page runs → redirect to template → choose template → redirect to edit.
- Paste text on Create → same flow (scanning parses source_text).
- Editor: load resume, edit basics/content, trigger save (e.g. Save button or autosave), reload page and confirm data persisted.
- Dashboard: list shows real resumes with correct `updated_at`.
- Onboarding: complete flow and confirm modal does not show again.
- AI panel: send instruction, accept/reject edits, confirm preview updates.
- RLS: confirm users only see their own resumes and blocks.

---

## PART 7 — Testing Checklist

- [ ] Create (upload) → scanning → template → edit (full flow).
- [ ] Create (paste) → scanning → template → edit.
- [ ] Editor: load doc, change basics, save, reload → data persisted.
- [ ] Editor: change blocks, save, reload → blocks persisted.
- [ ] Dashboard: ProjectList shows user's resumes with updated_at.
- [ ] Template selection saves and redirects to /edit.
- [ ] Parse Edge Function: success and failure (invalid file) paths.
- [ ] AI edit Edge Function: success and reject all.
- [ ] Onboarding: first login → modal → complete → not shown again.
- [ ] No redirect to dashboard unless resumeId invalid or error.
