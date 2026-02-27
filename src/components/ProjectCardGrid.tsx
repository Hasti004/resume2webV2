import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Trash2 } from "lucide-react";

/** Placeholder project cards for dashboard — replace with real data from Supabase. */
const MOCK_PROJECTS = [
  { id: "1", name: "Hasti_s_cv", updated: "3 days ago", status: "completed" },
  { id: "2", name: "draft-resume", updated: "3 days ago", status: "completed" },
  { id: "3", name: "portfolio-v2", updated: "1 week ago", status: "completed" },
  { id: "4", name: "dev-resume", updated: "2 weeks ago", status: "completed" },
  { id: "5", name: "design-cv", updated: "3 weeks ago", status: "completed" },
  { id: "6", name: "main-cv", updated: "1 month ago", status: "completed" },
];

export function ProjectCardGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MOCK_PROJECTS.map((p) => (
        <div
          key={p.id}
          className="paper-card group relative flex flex-col rounded-lg p-4 shadow-sm"
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="flex items-start gap-3 pr-8">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{p.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3 shrink-0" /> {p.updated}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
              {p.status}
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
