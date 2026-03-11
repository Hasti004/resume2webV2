import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listDraftsForUser, deleteResume, deleteAllResumesForUser } from "@/lib/resumeRepo";
import { toast } from "sonner";

/**
 * List of user resumes from resumeRepo. Requires migration with status column.
 */
export function ProjectList() {
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
      toast.success("Resume deleted.");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete resume.");
    },
  });
  const deleteAllMutation = useMutation({
    mutationFn: () => (user?.id ? deleteAllResumesForUser(user.id) : Promise.resolve()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resume-list", user?.id] });
      toast.success("All resumes cleared.");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to clear resumes.");
    },
  });

  const handleDelete = (e: MouseEvent<HTMLButtonElement>, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(id);
  };

  const handleClearAll = () => {
    const count = displayList.length;
    if (count === 0) return;
    if (!window.confirm(`Permanently delete all ${count} resume${count === 1 ? "" : "s"}? This cannot be undone.`)) return;
    deleteAllMutation.mutate();
  };

  const displayList = projects.map((p) => ({
    id: p.id,
    name: p.title,
    updated: p.updatedAt,
    status: p.status,
  }));

  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
        <p>Loading…</p>
      </div>
    );
  }

  if (displayList.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
        <p>No resumes yet. Create your first one to get started.</p>
        <Button asChild className="mt-4">
          <Link to="/dashboard/create">Create resume</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleClearAll}
          disabled={deleteAllMutation.isPending}
        >
          {deleteAllMutation.isPending ? "Deleting…" : "Clear all resumes"}
        </Button>
      </div>
      <ul className="space-y-3">
      {displayList.map((p) => (
        <li key={p.id}>
          <div className="paper-card flex items-center justify-between rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{p.name}</p>
                {p.updated && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3" /> {p.updated}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {p.status && (
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {p.status}
                </span>
              )}
              <Button asChild size="sm" variant="ghost">
                <Link to={`/dashboard/editor/${p.id}/edit`}>Continue →</Link>
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => handleDelete(e, p.id, p.name)}
                disabled={deleteMutation.isPending}
                aria-label={`Delete ${p.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
      </ul>
    </div>
  );
}
