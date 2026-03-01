import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadResumeDoc } from "@/lib/resumeRepo";
import type { ResumeDoc } from "@/lib/resumeRepo";
import { PreviewRenderer } from "@/features/templates/PreviewRenderer";

/**
 * Full-screen portfolio preview (no editor chrome).
 * Opened in a new tab from the editor "Preview" button.
 */
export default function EditorPreviewPage() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const [doc, setDoc] = useState<ResumeDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resumeId) {
      setError("Missing resume");
      return;
    }
    loadResumeDoc(resumeId)
      .then(setDoc)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [resumeId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <p className="text-sm text-gray-600">Loading…</p>
      </div>
    );
  }

  const theme = doc.templateId === "minimal-monochrome" ? "dark" : "light";

  return (
    <div className="min-h-screen w-full bg-white">
      <PreviewRenderer
        templateId={doc.templateId}
        theme={theme}
        basics={doc.basics ?? {}}
        blocks={doc.blocks ?? []}
      />
    </div>
  );
}
