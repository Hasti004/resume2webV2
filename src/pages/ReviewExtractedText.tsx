import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createProjectFromSource, structureResumeWithGemini } from "@/lib/resumeRepo";
import { useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * Median page: shows extracted text from PDF so the user can verify extraction.
 * Continue → create project → structure with Gemini (structure-resume-with-gemini) → template selection.
 */
export default function ReviewExtractedText() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const extractedText = (location.state as { extractedText?: string } | null)?.extractedText;

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (extractedText === undefined || extractedText === null) {
      navigate("/dashboard/create", { replace: true });
    }
  }, [extractedText, navigate]);

  const handleBack = useCallback(() => {
    navigate("/dashboard/create", { replace: true });
  }, [navigate]);

  const handleContinue = useCallback(async () => {
    const text = typeof extractedText === "string" ? extractedText.trim() : "";
    if (!text || !user?.id) {
      toast.error("Missing extracted text or not signed in.");
      return;
    }
    setCreating(true);
    try {
      const newId = await createProjectFromSource(user.id, { text });
      console.log("created resumeId (from review):", newId);
      const structured = await structureResumeWithGemini(newId, text);
      navigate(`/dashboard/editor/${newId}/structured`, { state: structured, replace: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create or structure resume");
    } finally {
      setCreating(false);
    }
  }, [extractedText, user?.id, navigate]);

  if (extractedText === undefined || extractedText === null) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          Redirecting…
        </div>
      </DashboardLayout>
    );
  }

  const charCount = extractedText.length;
  const lineCount = extractedText.split(/\r?\n/).length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Review Extracted Text
          </h1>
          <p className="mt-2 text-muted-foreground">
            Verify the text below was extracted correctly from your resume. If it looks good, click Continue to create your project and go to template selection.
          </p>

          <Card className="mt-6 border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Extracted content</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {lineCount} line{lineCount !== 1 ? "s" : ""} · {charCount.toLocaleString()} characters
              </span>
            </CardHeader>
            <CardContent>
              <pre
                className="max-h-[50vh] overflow-auto rounded-md border border-border bg-muted/30 p-4 text-sm text-foreground whitespace-pre-wrap font-sans"
                style={{ minHeight: "12rem" }}
              >
                {extractedText || "(no text extracted)"}
              </pre>
            </CardContent>
          </Card>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={creating}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={creating || !extractedText?.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating & structuring… (may take up to a minute)
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
