/**
 * /dashboard/scanning?resumeId=...
 * Reads resumeId from query. Runs Gemini parse, then navigates to template selection.
 * No auto-redirect to /dashboard; missing resumeId shows error + button.
 * Navigation during scanning is not blocked.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { parseWithGemini } from "@/lib/resumeRepo";
import { Loader2, AlertCircle } from "lucide-react";

const PROGRESS_STATES = [
  "Downloading file…",
  "Extracting text…",
  "Understanding resume…",
  "Structuring sections…",
];

export default function ResumeScanning() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get("resumeId")?.trim() ?? null;

  const [status, setStatus] = useState<"idle" | "parsing" | "success" | "error">("idle");
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const runParse = useCallback(async () => {
    if (!resumeId) return;
    setStatus("parsing");
    setError(null);
    try {
      await parseWithGemini(resumeId);
      setStatus("success");
      const target = `/dashboard/editor/${resumeId}/template`;
      console.log("[ResumeScanning] parse success, resumeId:", resumeId, "navigate:", target);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parsing failed.");
      setStatus("error");
    }
  }, [resumeId, navigate]);

  const hasStartedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!resumeId) return;
    if (hasStartedRef.current === resumeId) return;
    hasStartedRef.current = resumeId;
    console.log("[ResumeScanning] resumeId from query:", resumeId);
    runParse();
  }, [resumeId, runParse]);

  useEffect(() => {
    if (status !== "parsing") return;
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % PROGRESS_STATES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [status]);

  const handleRetry = useCallback(() => {
    if (status !== "error") return;
    runParse();
  }, [status, runParse]);

  const handleSkip = useCallback(() => {
    if (resumeId && status !== "parsing") {
      const target = `/dashboard/editor/${resumeId}/template`;
      console.log("[ResumeScanning] skip to template, resumeId:", resumeId, "navigate:", target);
      navigate(target, { replace: true });
    }
  }, [resumeId, status, navigate]);

  if (!resumeId) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" aria-hidden />
          <h1 className="mt-6 text-2xl font-semibold text-foreground">Missing resume</h1>
          <p className="mt-2 text-muted-foreground">
            This page needs a resume ID. Use Create to upload or paste a resume first.
          </p>
          <Button asChild className="mt-8">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        {status === "parsing" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" aria-hidden />
            <h1 className="mt-6 text-2xl font-semibold text-foreground">
              {PROGRESS_STATES[messageIndex]}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Please wait. Do not leave this page.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <p className="text-muted-foreground">Taking you to the editor…</p>
            <Loader2 className="mx-auto mt-4 h-8 w-8 animate-spin text-primary" aria-hidden />
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" aria-hidden />
            <h1 className="mt-6 text-2xl font-semibold text-foreground">Something went wrong</h1>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button onClick={handleRetry}>Retry</Button>
              <Button variant="outline" onClick={handleSkip}>
                Skip to editor (manual)
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
