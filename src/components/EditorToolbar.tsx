import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResumeDocStore } from "@/features/editor/resumeDocStore";
import { useAuth } from "@/hooks/useAuth";
import {
  ChevronDown,
  Clock,
  LayoutTemplate,
  User,
  LayoutList,
  Sparkles,
  Globe,
  Loader2,
  Check,
  Share2,
  Upload,
  ZoomIn,
  ZoomOut,
  Menu,
} from "lucide-react";

export interface EditorToolbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  previewZoom: number;
  onPreviewZoomChange: (zoom: number) => void;
}

export function EditorToolbar({
  activeTab,
  onTabChange,
  previewZoom,
  onPreviewZoomChange,
}: EditorToolbarProps) {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const basics = useResumeDocStore((s) => s.basics);
  const saving = useResumeDocStore((s) => s.saving);
  const dirty = useResumeDocStore((s) => s.dirty);
  const templateId = useResumeDocStore((s) => s.templateId);

  const projectName = basics?.name?.trim() || "My Resume";
  const statusText = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : "Previewing last saved version";
  const userInitial = user?.email?.charAt(0)?.toUpperCase() ?? "U";

  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);

  const editorTabs = [
    { id: "basics", label: "Basics", icon: User },
    { id: "content", label: "Content", icon: LayoutList },
    { id: "ai", label: "Talk to AI", icon: Sparkles },
    { id: "history", label: "History", icon: Clock },
    { id: "pages", label: "Pages", icon: LayoutTemplate },
  ] as const;

  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[hsl(var(--border))] bg-[#fff] px-4">
        {/* Logo + project name + status */}
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <Link
            to="/dashboard"
            className="flex shrink-0 items-center gap-2 text-foreground no-underline"
            aria-label="Dashboard"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
              <span className="text-sm font-bold">R2W</span>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex flex-col items-start gap-0.5 rounded-md px-2 py-1 text-left hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
              >
                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                  {projectName}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {saving ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3 text-green-600" aria-hidden />
                      {statusText}
                    </>
                  )}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem asChild>
                <Link to={`/dashboard/editor/${resumeId}/template`}>Change template</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px shrink-0 bg-[hsl(var(--border))]" aria-hidden />

        {/* LEFT GROUP: Editor */}
        <div className="flex flex-1 items-center gap-1">
          <span className="mr-2 hidden text-xs font-medium uppercase tracking-wide text-muted-foreground md:inline">
            Editor
          </span>
          <div className="hidden flex-wrap items-center gap-0.5 md:flex">
            {editorTabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeTab === id ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-sm font-medium"
                onClick={() => (id === "history" || id === "pages" ? undefined : onTabChange(id))}
                title={id === "history" ? "History (coming soon)" : id === "pages" ? "Pages (coming soon)" : undefined}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
          {/* Small screen: collapse to dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 md:hidden">
                <Menu className="h-4 w-4" />
                Editor
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {editorTabs.map(({ id, label }) => (
                <DropdownMenuItem
                  key={id}
                  onClick={() => (id !== "history" && id !== "pages" ? onTabChange(id) : undefined)}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px shrink-0 bg-[hsl(var(--border))]" aria-hidden />

        {/* RIGHT GROUP: Preview & Template */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5">
                  <Globe className="h-4 w-4" />
                  Preview
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Live preview</TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2.5 text-sm"
              onClick={() => setTemplatePreviewOpen(true)}
              title="Preview templates"
            >
              {templateId ? (
                <span className="max-w-[100px] truncate">{templateId}</span>
              ) : (
                "Template"
              )}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            <div className="mx-0.5 h-4 w-px bg-[hsl(var(--border))]" />
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onPreviewZoomChange(Math.max(50, previewZoom - 10))}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="min-w-[2.5rem] text-center text-xs font-medium text-foreground">
                {previewZoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onPreviewZoomChange(Math.min(150, previewZoom + 10))}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
            onClick={() => navigate("/dashboard/publish")}
          >
            <Upload className="h-4 w-4" />
            Publish
          </Button>
        </div>

        {/* User avatar */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-medium text-white"
          title={user?.email ?? "Account"}
        >
          {userInitial}
        </div>
      </header>

      {/* Template preview overlay */}
      <Dialog open={templatePreviewOpen} onOpenChange={setTemplatePreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">Template gallery</span>
              {templateId && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  Selected: {templateId}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[480px] pr-2">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-3 shadow-sm ring-1 ring-[hsl(var(--primary))]/40">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">Cinematic</span>
                    <span className="rounded-full bg-[hsl(var(--primary))]/10 px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--primary))]">
                      Selected
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-black/90 p-3 text-xs text-gray-200">
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      Home preview
                    </div>
                    <div className="relative flex h-32 items-center justify-center rounded-md bg-gradient-to-br from-slate-800 to-slate-950 text-[11px] text-gray-200">
                      <span className="opacity-80">
                        GIF preview of cinematic homepage (coming soon)
                      </span>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <li>• Dark hero with strong name + headline</li>
                    <li>• Pills for skills and tools</li>
                    <li>• High-contrast sections for experience and projects</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">Minimal</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      Alternative
                    </span>
                  </div>
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-[11px] text-gray-500">
                    Clean, single-column layout with subtle dividers.
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <li>• Best for ATS and printing</li>
                    <li>• Monochrome, typography–forward</li>
                    <li>• Works well with dense content</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <span>
                  You can change templates any time. Your resume content stays the same.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => {
                    if (resumeId) navigate(`/dashboard/editor/${resumeId}/template`);
                  }}
                >
                  Open full template picker
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
