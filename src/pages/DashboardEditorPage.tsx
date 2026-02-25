import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/DashboardLayout";
import { getResumeMeta } from "@/lib/resumeRepo";
import { ensureDraftAndRoute } from "@/lib/editorOrchestrator";
import { useAuth } from "@/hooks/useAuth";
import type { ImportMode } from "@/features/intake/types";

type EditorView = "paste" | "manual" | "hybrid" | "default";

interface LocationState {
  fromIntake?: boolean;
  importMode?: ImportMode;
  pastedResumeText?: string;
}

/**
 * /dashboard/editor/:resumeId — Open editor for a specific draft.
 * On mount: ensure draft exists and route; if nextRoute !== current path, redirect. Else render.
 */
export default function DashboardEditorPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = (location.state ?? {}) as LocationState;

  const [routeReady, setRouteReady] = useState(false);
  const [view, setView] = useState<EditorView>("default");
  const [pastedText, setPastedText] = useState("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [loadedFromMeta, setLoadedFromMeta] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    ensureDraftAndRoute({
      userId: user.id,
      requestedResumeId: resumeId ?? null,
      intent: "open-editor",
    })
      .then(({ nextRoute }) => {
        if (cancelled) return;
        const currentPath = location.pathname;
        if (nextRoute !== currentPath) {
          navigate(nextRoute, { replace: true });
          return;
        }
        setRouteReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setRouteReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, resumeId, location.pathname, navigate]);

  useEffect(() => {
    if (!routeReady || !resumeId) return;
    if (state.fromIntake && state.importMode) {
      setView(state.importMode);
      setPastedText(state.pastedResumeText ?? "");
      if (state.importMode === "paste" || state.importMode === "hybrid") {
        setImportModalOpen(true);
      }
      return;
    }
    getResumeMeta(resumeId)
      .then((meta) => {
        const intake = meta?.intake;
        if (intake && typeof intake === "object" && "importMode" in intake) {
          const mode = (intake as { importMode?: ImportMode }).importMode;
          const pasted = (intake as { pastedResumeText?: string }).pastedResumeText;
          if (mode) {
            setView(mode);
            setPastedText(pasted ?? "");
            setLoadedFromMeta(true);
            if ((mode === "paste" || mode === "hybrid") && pasted?.trim()) {
              setImportModalOpen(true);
            }
          }
        }
      })
      .catch(() => {});
  }, [routeReady, resumeId, state.fromIntake, state.importMode, state.pastedResumeText]);

  const handleParseClick = () => {
    setImportModalOpen(false);
  };

  if (!routeReady) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Editor — {resumeId}</h1>
        <div className="flex gap-2">
          <Link
            to={`/dashboard/editor/${resumeId}/template`}
            className="text-primary hover:underline text-sm"
          >
            Pick template
          </Link>
          <Link
            to={`/dashboard/editor/${resumeId}/edit`}
            className="text-primary hover:underline text-sm font-medium"
          >
            Edit content
          </Link>
        </div>
      </div>

      {(view === "paste" || view === "hybrid") && (
        <>
          {view === "paste" && (
            <Card className="paper-card">
              <CardHeader>
                <CardTitle>Import resume</CardTitle>
                <CardDescription>
                  Your intake context will be used when parsing. Open the import modal to paste or edit text.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setImportModalOpen(true)}>Open import modal</Button>
              </CardContent>
            </Card>
          )}
          <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Paste resume text</DialogTitle>
                <DialogDescription>
                  We'll parse this with your intake context (role, tone, goals) to build your resume.
                  {view === "hybrid" && " After parsing we'll ask follow-up questions for missing info."}
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Paste your resume or CV text here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={14}
                className="font-mono text-sm resize-none"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleParseClick}>
                  Parse with context
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {view === "manual" && (
        <div className="space-y-6">
          <Card className="paper-card">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Professional summary or objective. Edit to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write a brief summary of your experience and goals..."
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>
          <Card className="paper-card">
            <CardHeader>
              <CardTitle>Experience / Projects</CardTitle>
              <CardDescription>Add your work experience and key projects. Use the editor for full editing.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to={`/dashboard/editor/${resumeId}/edit`}>Open editor</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {view === "hybrid" && (
        <Card className="paper-card">
          <CardHeader>
            <CardTitle>Missing info questions</CardTitle>
            <CardDescription>After parsing your pasted resume, we'll ask follow-up questions to fill gaps.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setImportModalOpen(true)}>Paste or edit resume text</Button>
          </CardContent>
        </Card>
      )}

      {view === "default" && (
        <Card className="paper-card">
          <CardHeader>
            <CardTitle>Edit resume</CardTitle>
            <CardDescription>Resume {resumeId}. Pick a template or edit content.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={`/dashboard/editor/${resumeId}/template`}>Pick template</Link>
            </Button>
            <Button asChild variant="default">
              <Link to={`/dashboard/editor/${resumeId}/edit`}>Edit content</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {loadedFromMeta && view !== "default" && (
        <p className="text-xs text-muted-foreground">Loaded from saved intake.</p>
      )}
    </div>
    </DashboardLayout>
  );
}
