import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResumeDocStore } from "@/features/editor/resumeDocStore";
import { EditorBasicsPanel } from "@/features/editor/EditorBasicsPanel";
import { AIChatPanel } from "@/features/ai/AIChatPanel";
import { PreviewRenderer } from "@/features/editor/PreviewRenderer";
import { loadResumeDoc, getResumeUpdatedAt, getResumeOwnerId, saveAll, markLastOpened } from "@/lib/resumeRepo";
import { getPublishedSiteByResumeId } from "@/repositories/publishedSitesRepo";
import { PublishDrawer } from "@/features/publish/PublishDrawer";
import { normalizeSlug } from "@/lib/publish/slug";
import type { ResumeDoc } from "@/lib/resumeRepo";
import { useAuth } from "@/hooks/useAuth";
import {
  LAST_OPENED_RESUME_ID_KEY,
  getLocalDraftKey,
  LOCAL_SAVE_INTERVAL_MS,
  CLOUD_SAVE_DEBOUNCE_MS,
} from "@/features/editor/constants";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { EditorTopbar, type EditorMode } from "@/components/editor/EditorTopbar";

interface LocalDraft {
  basics: ResumeDoc["basics"];
  blocks: ResumeDoc["blocks"];
  templateId: ResumeDoc["templateId"];
  updatedAt: string;
}

function readLocalDraft(resumeId: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(getLocalDraftKey(resumeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !("updatedAt" in parsed)) return null;
    const d = parsed as LocalDraft;
    return Array.isArray(d.blocks) && d.updatedAt ? d : null;
  } catch {
    return null;
  }
}

function writeLocalDraft(resumeId: string, doc: ResumeDoc) {
  try {
    const payload: LocalDraft = {
      basics: doc.basics,
      blocks: doc.blocks,
      templateId: doc.templateId,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(getLocalDraftKey(resumeId), JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function clearLocalDraft(resumeId: string) {
  try {
    localStorage.removeItem(getLocalDraftKey(resumeId));
  } catch {
    // ignore
  }
}

export default function EditorEditPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const { user } = useAuth();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingServerDoc, setPendingServerDoc] = useState<ResumeDoc | null>(null);
  const [pendingLocalDraft, setPendingLocalDraft] = useState<LocalDraft | null>(null);

  const setDoc = useResumeDocStore((s) => s.setDoc);
  const setSaving = useResumeDocStore((s) => s.setSaving);
  const setDirty = useResumeDocStore((s) => s.setDirty);
  const dirty = useResumeDocStore((s) => s.dirty);
  const basics = useResumeDocStore((s) => s.basics);
  const blocks = useResumeDocStore((s) => s.blocks);
  const templateId = useResumeDocStore((s) => s.templateId);
  const getState = useResumeDocStore.getState;
  const [previewZoom, setPreviewZoom] = useState(100);
  const [activeTab, setActiveTab] = useState<EditorMode>("basics");
  const [, setPreviewContainerWidth] = useState(0);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [publishDrawerOpen, setPublishDrawerOpen] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  /** Fixed left panel width (Lovable-style); preview takes remaining width. */
  const EDITOR_LEFT_WIDTH_PX = 520;

  // Keep previewContainerWidth measured (used by topbar zoom controls if needed)
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setPreviewContainerWidth(el.clientWidth);
    });
    ro.observe(el);
    setPreviewContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!resumeId) return;
    console.log("[EditorEditPage] load resumeId:", resumeId);
    setLoading(true);
    setLoadError(null);
    setShowRestoreModal(false);
    setPendingServerDoc(null);
    setPendingLocalDraft(null);

    const load = async () => {
      if (user?.id) {
        const ownerId = await getResumeOwnerId(resumeId);
        if (ownerId != null && ownerId !== user.id) {
          setLoadError("You don't have access to this resume. It belongs to another account.");
          setLoading(false);
          return;
        }
      }
      const [doc, serverUpdatedAt] = await Promise.all([loadResumeDoc(resumeId), getResumeUpdatedAt(resumeId)]);
      const local = readLocalDraft(resumeId);
      const serverTime = serverUpdatedAt ? new Date(serverUpdatedAt).getTime() : 0;
      const localTime = local?.updatedAt ? new Date(local.updatedAt).getTime() : 0;

      if (local && localTime > serverTime) {
        setPendingServerDoc(doc);
        setPendingLocalDraft(local);
        setShowRestoreModal(true);
        setDoc(resumeId, doc);
      } else {
        setDoc(resumeId, doc);
      }
      try {
        localStorage.setItem(LAST_OPENED_RESUME_ID_KEY, resumeId);
      } catch {
        // ignore
      }
      if (user?.id) {
        markLastOpened(resumeId, user.id).catch(() => {});
      }
    };
    load().catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load")).finally(() => setLoading(false));
  }, [resumeId, setDoc, user?.id]);

  useEffect(() => {
    if (!resumeId) return;
    getPublishedSiteByResumeId(resumeId).then((site) => {
      if (site?.published_url) setPublishedUrl(site.published_url);
      else setPublishedUrl(null);
    });
  }, [resumeId]);

  const handleRestore = useCallback(() => {
    if (!resumeId || !pendingLocalDraft) return;
    const doc: ResumeDoc = {
      basics: pendingLocalDraft.basics,
      blocks: pendingLocalDraft.blocks,
      templateId: pendingLocalDraft.templateId,
    };
    setDoc(resumeId, doc);
    clearLocalDraft(resumeId);
    setShowRestoreModal(false);
    setPendingServerDoc(null);
    setPendingLocalDraft(null);
  }, [resumeId, pendingLocalDraft, setDoc]);

  const handleDiscard = useCallback(() => {
    if (!resumeId || !pendingServerDoc) return;
    clearLocalDraft(resumeId);
    setDoc(resumeId, pendingServerDoc);
    setShowRestoreModal(false);
    setPendingServerDoc(null);
    setPendingLocalDraft(null);
  }, [resumeId, pendingServerDoc, setDoc]);

  useEffect(() => {
    if (!resumeId || !dirty) return;
    const interval = setInterval(() => {
      const state = getState();
      writeLocalDraft(resumeId, {
        basics: state.basics,
        blocks: state.blocks,
        templateId: state.templateId,
      });
    }, LOCAL_SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [resumeId, dirty, getState]);

  const cloudSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!resumeId || !dirty) return;
    cloudSaveTimeoutRef.current = setTimeout(() => {
      cloudSaveTimeoutRef.current = null;
      const state = getState();
      setSaving(true);
      saveAll(resumeId, {
        basics: state.basics,
        blocks: state.blocks,
        templateId: state.templateId,
      })
        .then(() => {
          setDirty(false);
          setSaving(false);
          clearLocalDraft(resumeId);
        })
        .catch(() => {
          setSaving(false);
        });
    }, CLOUD_SAVE_DEBOUNCE_MS);
    return () => {
      if (cloudSaveTimeoutRef.current) {
        clearTimeout(cloudSaveTimeoutRef.current);
        cloudSaveTimeoutRef.current = null;
      }
    };
  }, [resumeId, dirty, getState, setSaving, setDirty]);

  if (!resumeId) {
    return (
      <EditorLayout>
        <div className="p-6 text-muted-foreground">Missing resume ID.</div>
      </EditorLayout>
    );
  }

  if (loading) {
    return (
      <EditorLayout>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Loading resume…</p>
        </div>
      </EditorLayout>
    );
  }

  if (loadError) {
    return (
      <EditorLayout>
        <div className="p-6">
          <p className="text-destructive">{loadError}</p>
        </div>
      </EditorLayout>
    );
  }

  const suggestedSlug = basics?.name ? normalizeSlug(String(basics.name)) : "";

  return (
    <EditorLayout>
      <EditorTopbar
        mode={activeTab}
        onModeChange={setActiveTab}
        previewZoom={previewZoom}
        onPreviewZoomChange={setPreviewZoom}
        publishedUrl={publishedUrl}
        onPublishClick={() => setPublishDrawerOpen(true)}
      />
      <PublishDrawer
        open={publishDrawerOpen}
        onOpenChange={setPublishDrawerOpen}
        resumeId={resumeId}
        userId={user?.id ?? null}
        basics={basics ?? {}}
        blocks={(blocks ?? []).map((b) => ({ type: b.type, content: b.content ?? {}, sort_order: b.sort_order ?? 0 }))}
        templateId={templateId}
        suggestedSlug={suggestedSlug}
        onPublished={(url) => {
          setPublishedUrl(url);
          setPublishDrawerOpen(false);
        }}
      />
      <div className="flex min-h-0 flex-1 flex-shrink-0 overflow-hidden border-t border-border">

        <Dialog open={showRestoreModal} onOpenChange={(open) => !open && handleDiscard()}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Restore unsaved changes?</DialogTitle>
              <DialogDescription>
                You have a local draft that is newer than the version on the server. Restore it or discard and continue with the server version.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleDiscard}>
                Discard
              </Button>
              <Button onClick={handleRestore}>
                Restore
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as EditorMode)}
          className="flex flex-1 min-h-0 flex-col overflow-hidden"
        >
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left: Basic info panel — fixed width (Lovable-style) */}
            <aside
              className="flex shrink-0 flex-col min-h-0 overflow-hidden border-r border-gray-200 bg-white"
              style={{ width: EDITOR_LEFT_WIDTH_PX }}
            >
              <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <ScrollArea className="h-full min-h-0 flex-1 p-5">
                  <TabsContent value="basics" className="m-0">
                    <EditorBasicsPanel />
                  </TabsContent>
                  <TabsContent value="ai" className="m-0">
                    <AIChatPanel onClose={() => setActiveTab("basics")} />
                  </TabsContent>
                </ScrollArea>
              </main>
            </aside>

            {/* Right: Preview — renders at natural container width, fully responsive */}
            <aside
              ref={previewContainerRef}
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#eef0f4]"
            >
              <ScrollArea className="min-h-0 flex-1">
                <div className="min-h-full w-full">
                  <PreviewRenderer />
                </div>
              </ScrollArea>
            </aside>
          </div>
        </Tabs>
      </div>
    </EditorLayout>
  );
}
