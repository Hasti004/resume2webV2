import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listDraftsForUser, deleteResume } from "@/lib/resumeRepo";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week(s) ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month(s) ago`;
  return `${Math.floor(diffDays / 365)} year(s) ago`;
}

/** Project cards from current user's resumes (no mock data). */
export function ProjectCardGrid() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["resume-list", user?.id],
    queryFn: () => (user?.id ? listDraftsForUser(user.id) : []),
    enabled: Boolean(user?.id),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-list", user?.id] });
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="paper-card rounded-lg p-4 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
        <p>No projects yet. Create one from the button above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <div
          key={p.id}
          className="paper-card group relative flex flex-col rounded-lg p-4 shadow-sm"
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
            onClick={() => handleDelete(p.id, p.title ?? "Untitled Resume")}
            disabled={deleteMutation.isPending}
            aria-label={`Delete ${p.title ?? "Untitled Resume"}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="flex items-start gap-3 pr-8">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{p.title ?? "Untitled Resume"}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3 shrink-0" /> {formatRelativeTime(p.updatedAt)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
              {p.status ?? "draft"}
            </span>
            <Button asChild size="sm" variant="ghost" className="text-primary">
              <Link to={`/dashboard/editor/${p.id}/edit`}>Continue →</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
