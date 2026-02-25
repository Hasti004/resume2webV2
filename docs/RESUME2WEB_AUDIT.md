# Resume2Web — Full Project Audit & Backend Setup

## PART 1 — Project Audit Summary

### Routes under /dashboard (from App.tsx)

| Route | Component | Status |
|-------|-----------|--------|
| `/dashboard` | Dashboard | ✅ Exists |
| `/dashboard/create` | CreateResume | ✅ Exists |
| `/dashboard/scanning` | ResumeScanning | ✅ Exists (no direct route link from Create) |
| `/dashboard/edit` | EditSite | ✅ Exists |
| `/dashboard/editor` | DashboardEditorRedirect | ✅ Exists |
| `/dashboard/editor/:resumeId` | DashboardEditorPage | ✅ Exists |
| `/dashboard/editor/:resumeId/edit` | EditorEditPage | ✅ Exists |
| `/dashboard/editor/:resumeId/template` | TemplateSelection | ✅ Exists |
| `/dashboard/templates` | TemplatesRedirect | ✅ Exists |
| `/dashboard/publish` | PublishSite | ✅ Exists |
| `/dashboard/sync` | SyncAccounts | ✅ Exists |
| `/dashboard/upgrade` | Upgrade | ✅ Exists |

### Create page (`/dashboard/create`)

- **Exists:** Yes. Upload (file), Paste text, LaTeX CV.
- **Flow:** On Continue → navigates to `/dashboard/editor/:resumeId/template` (skips scanning).
- **Data:** Uses `createProjectFromSource` from `@/lib/resumeRepo`. No direct Supabase in component.

### Scanning page (`/dashboard/scanning`)

- **Exists:** Yes. Query param `resumeId` required.
- **Flow:** Calls `parseWithGemini(resumeId)`; on success → `/dashboard/editor/:resumeId/template`; on missing resumeId → `/dashboard`.
- **Progress UI:** Rotating messages; Loader; error state with Retry / Skip to editor.
- **No direct Supabase:** All via resumeRepo.

### Template selection page (`/dashboard/editor/:resumeId/template`)

- **Exists:** Yes. Uses `ensureDraftAndRoute` (editorOrchestrator), then `setTemplateId` (resumeRepo).
- **On "Use Template":** `setTemplateId(resumeId, template.id)` then `navigate(/dashboard/editor/:resumeId/edit)`.
- **Correct:** Saves template then redirects to edit.

### Editor page (`/dashboard/editor/:resumeId/edit`)

- **Exists:** Yes. Loads doc via `loadResumeDoc(resumeId)` → `setDoc(resumeId, doc)` (store). Tabs: Basics, Content, AI. Preview from store.
- **Store:** Single source of truth (resumeDocStore). Basics/Content panels update store; Preview reads store.
- **Autosave:** Not implemented. Store has `dirty` / `saving` but no periodic or on-blur call to persist to DB.
- **Local cache:** `LAST_OPENED_RESUME_ID_KEY` written on load; no restore-from-cache on mount.

### Dashboard list (`/dashboard`)

- **Exists:** Renders `ProjectList` and `ProjectCardGrid`.
- **ProjectList:** Hardcoded empty array; not wired to Supabase or resumeRepo. No `updated_at` from DB.
- **ProjectCardGrid:** Same placeholder pattern (not audited in detail).

### resumeRepo (`src/repositories/resumeRepo.ts` + `src/lib/resumeRepo.ts`)

- **createProjectFromSource** ✅
- **loadResumeDoc** ✅
- **saveParsedResult** ✅ (used after parse; not general “save all”)
- **setTemplateId** ✅
- **parseWithGemini** ✅
- **aiEdit** ✅
- **setIntake** ✅
- **saveAll** ❌ Missing (persist basics + blocks from editor to DB)
- **markLastOpened** ❌ Missing (record last opened resume for user)
- **listDraftsForUser / list resumes for dashboard** ❌ Missing (dashboard list has no data source)

### Supabase client

- **Location:** `src/integrations/supabase/client.ts`
- **Env:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Placeholder used when missing so app loads.
- **Usage:** Only in `resumeRepo`, `DashboardLayout` (auth), `lib/auth.ts`, `hooks/useAuth.ts`, `pages/Auth.tsx`. Resume data access is only via resumeRepo ✅. (Onboarding and profileRepo removed.)

### Migrations (supabase/migrations)

- `20250208000000_resume_parsing.sql` — resume_blocks (id, resume_id, type, content, sort_order, created_at); no updated_at; RLS commented out.
- `20250208100000_resumes_full_schema.sql` — resumes (id, user_id, title, meta, source_text, file_path, basics, template_id, created_at, updated_at); no status.
- `20250208200000_profiles_onboarding.sql` — profiles (id, onboarding_completed, created_at, updated_at); no onboarding_completed_at; RLS commented out.
- `resumes_meta.sql` — adds meta to resumes (comment/alter).

**Missing from spec:** profiles.onboarding_completed_at; resumes.status; resume_blocks.updated_at, title; resume_files table; admin_roles (optional); RLS enabled and policies; updated_at triggers; explicit cascade/foreign keys where needed.

### Storage usage

- **Bucket:** `resumes` (RESUME_STORAGE_BUCKET in resumeRepo). Used in `setDraftSource` / `createProjectFromSource` for upload path `{userId}/{resumeId}/{safeName}`.
- **No bucket creation in migrations.** Bucket and RLS/policies for storage must be created in Supabase Dashboard or via API.

### Onboarding feature

- **Removed.** Onboarding gate, modal, useOnboarding, and profileRepo were removed; landing/flow is handled by the main landing page.

---

## PART 2 — Missing Items / Incorrect / Duplicated / Incomplete

### Checklist

| Item | Status |
|------|--------|
| All dashboard routes defined | ✅ Present |
| Create page | ✅ Exists; Continue → scanning (fixed) |
| Scanning page | ✅ Exists; correct parse → template redirect |
| Template selection page | ✅ Exists; saves template → edit |
| Editor page | ✅ Exists; load + store + preview; saveAll available (autosave not wired) |
| Dashboard list | ✅ Wired to listDraftsForUser |
| resumeRepo createProjectFromSource | ✅ |
| resumeRepo loadResumeDoc | ✅ |
| resumeRepo saveAll | ✅ Implemented |
| resumeRepo setTemplateId | ✅ |
| resumeRepo parseWithGemini | ✅ |
| resumeRepo aiEdit | ✅ |
| resumeRepo markLastOpened | ✅ Implemented |
| resumeRepo setIntake | ✅ |
| No component calls Supabase for resume data | ✅ Only repo + auth |
| profiles table + onboarding_completed_at | ⚠️ Table exists; column missing |
| resumes + status | ⚠️ status missing |
| resume_blocks + updated_at / title | ⚠️ updated_at, title missing |
| resume_files table | ❌ Missing |
| admin_roles | Optional; not present |
| RLS enabled + policies | ❌ Commented out in migrations |
| updated_at triggers | ❌ Not in migrations |
| Storage bucket + policies | ❌ Not in migrations |

### Incorrectly wired

- **Create → Template:** Create “Continue” goes to `/dashboard/editor/:resumeId/template` instead of `/dashboard/scanning?resumeId=:resumeId`. Desired flow: Upload → create project → scanning → parse → template selection. Fixed: Create Continue now goes to /dashboard/scanning?resumeId=... then parse → template → edit.

### Duplicated

- **Resume schema:** Multiple migrations touch resumes (resume_parsing, resumes_full_schema, resumes_meta). Better: one consolidated migration.
- **parseResumeWithGemini:** Deprecated alias for parseWithGemini; keep for compatibility or remove after callers updated.

### Incomplete

- **Editor:** No autosave; no saveAll call on blur/timer/unload.
- **Dashboard list:** No API to list user’s resumes with updated_at; ProjectList empty.
- **Migrations:** No RLS, no triggers, no resume_files, no onboarding_completed_at, no status on resumes.
- **Edge functions:** No retry on invalid JSON from Gemini (parse-resume-to-doc, ai-edit-resume-doc).

---

## PART 3 — SQL Migration

**File:** `supabase/migrations/20250208210000_full_schema_rls_triggers.sql`

### What it does

- **profiles:** Ensures table exists; adds `onboarding_completed_at` (timestamptz). Keeps `onboarding_completed`, `created_at`, `updated_at`.
- **resumes:** Ensures table with `id`, `user_id`, `title`, `status`, `template_id`, `basics`, `meta`, `source_text`, `file_path`, `created_at`, `updated_at`. Adds `status` if missing. FK to `auth.users` with ON DELETE CASCADE.
- **resume_blocks:** Ensures table with `id`, `resume_id`, `type`, `title`, `content` (jsonb), `sort_order`, `created_at`, `updated_at`. FK to `resumes` ON DELETE CASCADE. (Spec used "data"/"order_index"; app uses `content`/`sort_order` — same semantics.)
- **resume_files:** Creates table: `id`, `resume_id`, `user_id`, `original_name`, `storage_path`, `mime_type`, `size_bytes`, `created_at`. FKs to `resumes` and `auth.users` with CASCADE.
- **admin_roles:** Creates optional table `user_id`, `role`, `created_at`.
- **Triggers:** `set_updated_at()` on profiles, resumes, resume_blocks (BEFORE UPDATE).
- **RLS:** Enables RLS on profiles, resumes, resume_blocks, resume_files, admin_roles. Policies: users can manage own profiles/resumes/resume_files; resume_blocks via resume ownership; admin_roles read for admins only.

Apply with `supabase db push` or run in SQL Editor. If you already ran older migrations, the ALTER TABLE / ADD COLUMN IF NOT EXISTS and DROP TRIGGER IF EXISTS keep it idempotent.

---

## PART 4 — Edge Function Code

### parse-resume-to-doc

- **Input:** `{ resumeId }`. Loads source (file or pasted text), extracts text, calls Gemini, validates with Zod, saves basics + blocks, sets `meta.parsed = true`.
- **Already implemented.** Add **retry logic** (e.g. up to 2 retries) when Gemini returns invalid JSON; then rethrow.

### ai-edit-resume-doc

- **Input:** `{ basics, blocks, instruction, scope, selectedBlockId? }`. **Output:** `{ basicsProposed, blocksProposed }`. Strict Zod validation.
- **Already implemented.** Add **retry logic** (e.g. up to 2 retries) when JSON parse or Zod parse fails; then rethrow.

Both functions must read `GEMINI_API_KEY` from environment; no Gemini calls in frontend. See code changes below for retry implementation.

---

## PART 5 — resumeRepo Updates

- **saveAll(resumeId, doc):** Persist `doc.basics` and `doc.blocks` to `resumes.basics` and `resume_blocks` (replace blocks for that resume). Used by editor autosave or explicit save.
- **markLastOpened(resumeId, userId):** Update `resumes.meta.lastOpenedAt` (or equivalent) for the given resume so dashboard can show “last opened”. Optional: update a `last_opened_at` column if added later.
- **listDraftsForUser(userId):** Return list of drafts (id, title, updated_at, status) for the current user for dashboard list.
- Export from `src/lib/resumeRepo.ts`: saveAll, markLastOpened, listDraftsForUser (and types if any).

---

## PART 6 — What You (Developer) Must Do Manually

### SECTION A — Manual

- **Supabase bucket:** Create bucket `resumes` in Storage; set public/private as needed; add storage policies so authenticated users can upload/list/delete under their path (e.g. `user_id/resume_id/`).
- **Environment variables (frontend):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env`.
- **Environment variables (Edge Functions):** In Supabase Dashboard → Project Settings → Edge Functions → Secrets: set `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Gemini API key:** Obtain from Google AI Studio; set as Edge Function secret above; never in frontend.
- **Deploy Edge Functions:** `supabase functions deploy parse-resume-to-doc`, `supabase functions deploy ai-edit-resume-doc`.
- **RLS:** After applying migration, enable RLS on profiles, resumes, resume_blocks, resume_files; policies are in the migration. Test with anon and authenticated user.
- **Storage permissions:** Configure Storage RLS/policies so only the owning user can read/write their folder.
- **Domain config:** If using custom domain for Supabase or app, configure in Supabase and hosting.

### SECTION B — What Cursor Will Generate

- Single SQL migration file (schema + RLS + triggers).
- resumeRepo: saveAll, markLastOpened, listDraftsForUser (or equivalent).
- Edge function updates: retry logic for Gemini JSON in parse-resume-to-doc and ai-edit-resume-doc.
- Optional: Wire Create → scanning (navigate to `/dashboard/scanning?resumeId=...`).
- Optional: Wire ProjectList to listDraftsForUser (data only; no UI styling change).

### SECTION C — What Must Be Tested Manually

- Auth: sign up, sign in, sign out.
- Create: upload file / paste text → project created; then either scanning flow or template flow.
- Scanning: open with valid resumeId → parse runs → redirect to template selection; on error, retry/skip.
- Template selection: pick template → save → redirect to editor edit; resume loads with correct template.
- Editor: load doc; edit basics → preview updates; edit blocks → preview updates; (after saveAll) refresh and confirm persistence.
- AI panel: send instruction → diff → Accept All / Reject All / per-item accept → preview updates.
- Dashboard: list shows user’s resumes with updated_at after list API wired.
- ~~Onboarding~~ (removed).
- RLS: confirm other users cannot read/update another user’s resumes/profiles.

---

## PART 7 — Testing Checklist

- [ ] Run migration (local or remote); confirm tables and triggers.
- [ ] Enable RLS; run as test user; confirm policies.
- [ ] Create bucket `resumes`; set policies; upload a file from Create.
- [ ] Set GEMINI_API_KEY; deploy parse-resume-to-doc and ai-edit-resume-doc; invoke parse then ai-edit from app.
- [ ] Create resume (upload or paste) → navigate to scanning (if wired) or template → template → edit.
- [ ] Editor: change basics and content; (when saveAll exists) trigger save; reload page and confirm data.
- [ ] AI edit: instruction → accept/reject → preview and store reflect choices.
- [ ] Dashboard: after wiring list, confirm resumes and updated_at.
- [ ] Onboarding: complete once; reload; confirm modal does not reappear.
