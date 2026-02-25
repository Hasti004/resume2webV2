import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileUp, Type, Code, FileText, ArrowRight, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { createProjectFromSource } from "@/lib/resumeRepo";

type InputMethod = "upload" | "paste" | "latex";

/**
 * /dashboard/create — Upload/Paste then Continue to template selection.
 * Upload/paste only stores resumeId; Continue navigates to /dashboard/editor/:resumeId/template.
 * Never navigates to /dashboard on Continue (only on error).
 */
export default function CreateResume() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resumeId, setResumeId] = useState<string | null>(null);
  const [sourceReady, setSourceReady] = useState(false);
  const [creating, setCreating] = useState(false);

  const [method, setMethod] = useState<InputMethod>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [latexText, setLatexText] = useState("");
  const attemptedFileRef = useRef<File | null>(null);

  const clearSourceAndId = useCallback(() => {
    setResumeId(null);
    setSourceReady(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      clearSourceAndId();
      setSelectedFile(file);
    }
  }, [clearSourceAndId]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        clearSourceAndId();
        setSelectedFile(file);
      }
    },
    [clearSourceAndId]
  );

  // When user uploads a file: create project from source, store resumeId, do NOT navigate
  useEffect(() => {
    if (method !== "upload" || !selectedFile || !user?.id || creating || resumeId) return;
    if (attemptedFileRef.current === selectedFile) return;
    attemptedFileRef.current = selectedFile;
    setCreating(true);
    createProjectFromSource(user.id, { file: selectedFile })
      .then((newId) => {
        setResumeId(newId);
        setSourceReady(true);
        console.log("created resumeId:", newId);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to create project";
        toast.error(msg);
        attemptedFileRef.current = null;
      })
      .finally(() => setCreating(false));
  }, [method, selectedFile, user?.id, creating, resumeId]);

  const handleUsePastedText = useCallback(() => {
    const text = method === "latex" ? latexText : pastedText;
    if (!text.trim() || !user?.id || creating) return;
    setCreating(true);
    createProjectFromSource(user.id, { text: text.trim() })
      .then((newId) => {
        setResumeId(newId);
        setSourceReady(true);
        console.log("created resumeId:", newId);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to create project");
      })
      .finally(() => setCreating(false));
  }, [method, pastedText, latexText, user?.id, creating]);

  const handleContinue = useCallback(() => {
    if (!resumeId) {
      toast.error("Please upload or paste your resume first.");
      return;
    }
    navigate(`/dashboard/scanning?resumeId=${resumeId}`);
  }, [resumeId, navigate]);

  const setMethodAndClear = useCallback(
    (m: InputMethod) => {
      setMethod(m);
      clearSourceAndId();
    },
    [clearSourceAndId]
  );

  const canContinue = Boolean(resumeId) && sourceReady && !creating;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Upload Your Resume
          </h1>
          <p className="mt-2 text-muted-foreground">
            Choose how you&apos;d like to provide your resume. We&apos;ll extract your information and turn it into a beautiful portfolio.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMethodAndClear("upload")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                method === "upload"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50"
              )}
            >
              <FileUp className="h-4 w-4" /> Upload File
            </button>
            <button
              type="button"
              onClick={() => setMethodAndClear("paste")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                method === "paste"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Type className="h-4 w-4" /> Paste Text
            </button>
            <button
              type="button"
              onClick={() => setMethodAndClear("latex")}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                method === "latex"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Code className="h-4 w-4" /> Paste LaTeX CV
            </button>
          </div>

          {method === "upload" && (
            <Card className="mt-6 border-border bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">Upload Resume File</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your resume or click to browse, then click Continue.
                </p>
              </CardHeader>
              <CardContent>
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 transition-colors",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30",
                    selectedFile && "border-primary/50 bg-primary/5"
                  )}
                >
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.json,image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {creating && selectedFile ? (
                    <Loader2 className="mb-3 h-10 w-10 animate-spin text-muted-foreground" />
                  ) : (
                    <FileUp className="mb-3 h-10 w-10 text-muted-foreground" />
                  )}
                  <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="mb-1 text-sm font-medium text-foreground">
                    {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOCX, TXT, JSON, or Images (max 10MB)
                  </p>
                </label>
              </CardContent>
            </Card>
          )}

          {method === "paste" && (
            <Card className="mt-6 border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Type className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">Paste your resume text</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  placeholder="Paste your resume content here..."
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={10}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
                <Button
                  onClick={handleUsePastedText}
                  disabled={!pastedText.trim() || creating}
                  className="gap-2"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Use this text
                </Button>
              </CardContent>
            </Card>
          )}

          {method === "latex" && (
            <Card className="mt-6 border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">Paste LaTeX CV code</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  placeholder="Paste your LaTeX CV source here..."
                  className="min-h-[200px] w-full rounded-md border border-input bg-background font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={10}
                  value={latexText}
                  onChange={(e) => setLatexText(e.target.value)}
                />
                <Button
                  onClick={handleUsePastedText}
                  disabled={!latexText.trim() || creating}
                  className="gap-2"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Use this text
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Supported formats: PDF (text-based or scanned), DOCX, TXT, JSON Resume, images (OCR), or LaTeX CV code.
            </p>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!canContinue}
              className="gap-2"
            >
              Continue to Template Selection
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
