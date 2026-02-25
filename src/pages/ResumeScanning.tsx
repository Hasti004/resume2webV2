/**
 * /dashboard/scanning?resumeId=...
 * Redirects to template selection. No Edge Function or parsing — kept for backwards compatibility with links.
 */
import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function ResumeScanning() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get("resumeId")?.trim() ?? null;

  useEffect(() => {
    if (resumeId) {
      navigate(`/dashboard/editor/${resumeId}/template`, { replace: true });
    }
  }, [resumeId, navigate]);

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
      <div className="mx-auto max-w-xl px-6 py-16 text-center text-muted-foreground">
        Redirecting to template…
      </div>
    </DashboardLayout>
  );
}
