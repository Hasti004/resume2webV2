import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { getCategories, getFilteredTemplates } from "@/features/templates/templateRegistry";
import type { TemplateManifest } from "@/features/templates/templateManifests";
import { setTemplateId, getDraftById } from "@/lib/resumeRepo";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, LayoutTemplate, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Route: /dashboard/editor/:resumeId/template
 * resumeId from route params only (no hardcoded or numeric fallback).
 * If missing or draft not found/not owned → error + "Go to Dashboard".
 * On template select: setTemplateId then navigate to /dashboard/editor/:resumeId/edit.
 */
export default function TemplateSelection() {
  const { resumeId } = useParams<{ resumeId: string }>();
  console.log("Template resumeId from params:", resumeId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [routeReady, setRouteReady] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    const id = resumeId?.trim();
    if (!id) {
      setRouteError("Resume ID is missing from the URL.");
      return;
    }
    if (!user?.id) {
      setRouteError("Please sign in to choose a template.");
      return;
    }
    let cancelled = false;
    getDraftById(id)
      .then((draft) => {
        if (cancelled) return;
        if (!draft || draft.userId !== user.id) {
          setRouteError("This resume was not found or you don't have access to it.");
          return;
        }
        setRouteReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setRouteError("Could not load this resume.");
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, resumeId]);

  const categories = getCategories();
  const templates = getFilteredTemplates(selectedCategory);

  const handleUseTemplate = async (template: TemplateManifest) => {
    const id = resumeId?.trim();
    if (!id) {
      toast.error("Resume not found.");
      return;
    }
    setApplyingId(template.id);
    try {
      await setTemplateId(id, template.id);
      const target = `/dashboard/editor/${id}/edit`;
      console.log("[TemplateSelection] template set, resumeId:", id, "navigate:", target);
      navigate(target, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save template.");
      setApplyingId(null);
    }
  };

  if (!resumeId?.trim()) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" aria-hidden />
          <h1 className="mt-6 text-2xl font-semibold text-foreground">Missing resume</h1>
          <p className="mt-2 text-muted-foreground">Resume ID is missing from the URL. Use Create or open a resume from the dashboard.</p>
          <Button asChild className="mt-8">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (routeError) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl px-6 py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" aria-hidden />
          <h1 className="mt-6 text-2xl font-semibold text-foreground">Cannot open template selection</h1>
          <p className="mt-2 text-muted-foreground">{routeError}</p>
          <Button asChild className="mt-8">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

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
      <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard" aria-label="Back to dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">Choose a Template</h1>
          </div>

          <div className="mb-6 overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {templates.map((template) => {
              const isApplying = applyingId === template.id;
              const previewStyle =
                template.preview.kind === "gradient"
                  ? { background: template.preview.value }
                  : { backgroundImage: `url(${template.preview.value})`, backgroundSize: "cover" };
              const categoryPill = template.categoryTags.find((t) => t !== "All") ?? template.categoryTags[0];

              return (
                <Card
                  key={template.id}
                  className={cn(
                    "paper-card flex flex-col overflow-hidden transition-all duration-200",
                    "hover:shadow-lg hover:-translate-y-0.5"
                  )}
                >
                  <div
                    className="aspect-[4/3] w-full shrink-0"
                    style={previewStyle}
                    aria-hidden
                  />
                  <CardContent className="flex flex-1 flex-col pt-4">
                    <h2 className="font-semibold text-foreground">{template.name}</h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        {template.styleTag}
                      </span>
                      {categoryPill && (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          {categoryPill}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      className="w-full"
                      onClick={() => handleUseTemplate(template)}
                      disabled={!!applyingId}
                    >
                      {isApplying ? (
                        "Applying..."
                      ) : (
                        <>
                          <LayoutTemplate className="mr-2 h-4 w-4" />
                          Use Template
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {templates.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No templates match this category. Try &quot;All&quot;.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
