import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { EditorContentPanel } from "@/features/editor/EditorContentPanel";
import { EditorAIPanel } from "@/features/editor/EditorAIPanel";
import { PreviewRenderer } from "@/features/editor/PreviewRenderer";
import { loadResumeDoc, getResumeUpdatedAt, saveAll, markLastOpened } from "@/lib/resumeRepo";
import type { ResumeDoc } from "@/lib/resumeRepo";
import { useAuth } from "@/hooks/useAuth";
import {
  LAST_OPENED_RESUME_ID_KEY,
  getLocalDraftKey,
  LOCAL_SAVE_INTERVAL_MS,
  CLOUD_SAVE_DEBOUNCE_MS,
} from "@/features/editor/constants";
import { ArrowLeft, User, LayoutList, Sparkles, ZoomIn, ZoomOut, Loader2, Check } from "lucide-react";

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
  const saving = useResumeDocStore((s) => s.saving);
  const getState = useResumeDocStore.getState;
  const templateId = useResumeDocStore((s) => s.templateId);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [editorPanelWidthPercent, setEditorPanelWidthPercent] = useState(42);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitRef = useRef<HTMLDivElement>(null);

  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;
    const onMove = (e: MouseEvent) => {
      const container = splitRef.current?.closest(".flex.min-h-0");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.round((x / rect.width) * 100);
      setEditorPanelWidthPercent(Math.min(70, Math.max(28, pct)));
    };
    const onUp = () => setIsDraggingSplit(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDraggingSplit]);

  useEffect(() => {
    if (!resumeId) return;
    console.log("[EditorEditPage] load resumeId:", resumeId);
    setLoading(true);
    setLoadError(null);
    setShowRestoreModal(false);
    setPendingServerDoc(null);
    setPendingLocalDraft(null);

    Promise.all([loadResumeDoc(resumeId), getResumeUpdatedAt(resumeId)])
      .then(([doc, serverUpdatedAt]) => {
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
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [resumeId, setDoc, user?.id]);

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
      <DashboardLayout>
        <div className="p-6 text-muted-foreground">Missing resume ID.</div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading resume…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-destructive">{loadError}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] flex-col border-t border-border">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-1.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {saving ? (
                <>
                  <Loader2 className="inline h-3.5 w-3.5 animate-spin mr-1" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="inline h-3.5 w-3.5 text-green-600 mr-1" aria-hidden />
                  Saved
                </>
              )}
            </span>
          </div>
        </div>

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

        <Tabs defaultValue="basics" className="flex flex-1 min-h-0 flex-col">
          <div ref={splitRef} className="flex flex-1 min-h-0">
            {/* Left: Editor (sidebar + content) — resizable width */}
            <div
              className="flex shrink-0 flex-col min-h-0"
              style={{ width: `${editorPanelWidthPercent}%`, minWidth: 320 }}
            >
            {/* Tab triggers */}
            <aside className="w-52 shrink-0 border-r border-border bg-muted/30 flex flex-col">
              <div className="p-2 border-b border-border">
                <Button variant="ghost" size="sm" asChild className="w-full justify-start gap-2">
                  <Link to={`/dashboard/editor/${resumeId}`}>
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Link>
                </Button>
              </div>
              <TabsList className="w-full flex flex-col h-auto rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger value="basics" className="w-full justify-start gap-2 rounded-none border-b border-border data-[state=active]:bg-background">
                  <User className="h-4 w-4" /> Basics
                </TabsTrigger>
                <TabsTrigger value="content" className="w-full justify-start gap-2 rounded-none border-b border-border data-[state=active]:bg-background">
                  <LayoutList className="h-4 w-4" /> Content
                </TabsTrigger>
                <TabsTrigger value="ai" className="w-full justify-start gap-2 rounded-none data-[state=active]:bg-background">
                  <Sparkles className="h-4 w-4" /> AI
                </TabsTrigger>
              </TabsList>
            </aside>

            {/* Middle: Active tab content */}
            <main className="flex-1 min-w-0 flex flex-col border-r border-border">
              <ScrollArea className="flex-1 p-4">
                <TabsContent value="basics" className="m-0">
                  <EditorBasicsPanel />
                </TabsContent>
                <TabsContent value="content" className="m-0">
                  <EditorContentPanel />
                </TabsContent>
                <TabsContent value="ai" className="m-0">
                  <EditorAIPanel />
                </TabsContent>
              </ScrollArea>
            </main>
            </div>

          {/* Resize handle */}
          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={handleSplitMouseDown}
            className={`shrink-0 w-1.5 flex flex-col items-center cursor-col-resize border-l border-r border-border bg-muted/50 hover:bg-primary/20 transition-colors min-h-0 ${isDraggingSplit ? "bg-primary/30" : ""}`}
            title="Drag to resize"
          >
            <div className="w-1 h-12 rounded-full bg-muted-foreground/30 mt-4" />
          </div>

          {/* Right: Preview panel — resizable */}
          <aside className="flex-1 min-w-[320px] flex flex-col bg-muted/20 min-h-0">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
              <span className="text-sm font-medium text-foreground">Preview</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPreviewZoom((z) => Math.max(50, z - 10))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                {([80, 100, 120] as const).map((z) => (
                  <Button
                    key={z}
                    variant={previewZoom === z ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 min-w-8 px-2 text-xs"
                    onClick={() => setPreviewZoom(z)}
                  >
                    {z}%
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPreviewZoom((z) => Math.min(150, z + 10))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {templateId && (
              <div className="px-4 pb-1 text-xs text-muted-foreground truncate" title={templateId}>
                Template: {templateId}
              </div>
            )}
            <ScrollArea className="flex-1 p-4">
              <div
                className="origin-top-left"
                style={{ transform: `scale(${previewZoom / 100})`, width: `${(100 / previewZoom) * 100}%` }}
              >
                <PreviewRenderer />
              </div>
            </ScrollArea>
          </aside>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
