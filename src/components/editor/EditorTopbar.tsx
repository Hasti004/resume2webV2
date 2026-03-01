import { useRef, useState } from "react";
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
import { useResumeDocStore } from "@/features/editor/resumeDocStore";
import { useAuth } from "@/hooks/useAuth";
import { TemplatePickerPopover } from "@/features/templates/TemplatePickerPopover";
import {
  ChevronDown,
  User,
  Sparkles,
  Globe,
  Upload,
  ZoomIn,
  ZoomOut,
  Loader2,
  Check,
  Share2,
} from "lucide-react";

export type EditorMode = "basics" | "ai";

export interface EditorTopbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  previewZoom: number;
  onPreviewZoomChange: (zoom: number) => void;
}

export function EditorTopbar({
  mode,
  onModeChange,
  previewZoom,
  onPreviewZoomChange,
}: EditorTopbarProps) {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const basics = useResumeDocStore((s) => s.basics);
  const saving = useResumeDocStore((s) => s.saving);
  const dirty = useResumeDocStore((s) => s.dirty);
  const templateId = useResumeDocStore((s) => s.templateId);
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
  const templateButtonRef = useRef<HTMLButtonElement | null>(null);

  const projectName = basics?.name?.trim() || "My Resume";
  const statusText = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : "Previewing last saved version";
  const userInitial = user?.email?.charAt(0)?.toUpperCase() ?? "U";

  const handleZoom = (delta: number) => {
    const next = Math.max(50, Math.min(150, previewZoom + delta));
    onModeChange(mode); // keep mode, but ensures callback is referenced
    onPreviewZoomChange(next);
  };

  const segmentedBase =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border";

  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-[hsl(var(--border))] bg-white px-4">
        {/* Left: title + status */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            to="/dashboard"
            className="flex shrink-0 items-center gap-2 text-foreground no-underline"
            aria-label="Dashboard"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
              <span className="text-sm font-bold">R2W</span>
            </div>
          </Link>
          <div className="min-w-0 space-y-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/90"
                >
                  <span className="truncate">{projectName}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {resumeId && (
                  <DropdownMenuItem onClick={() => navigate(`/dashboard/editor/${resumeId}/template`)}>
                    Change template
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  Back to dashboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
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
            </p>
          </div>
        </div>

        {/* Center: mode pills + Preview pill */}
        <div className="hidden flex-1 items-center justify-center gap-2 md:flex">
          <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 p-1">
            <button
              type="button"
              className={`${segmentedBase} ${
                mode === "basics"
                  ? "border-transparent bg-white text-foreground shadow-sm"
                  : "border-transparent bg-transparent text-gray-600 hover:bg-white/60"
              }`}
              onClick={() => onModeChange("basics")}
            >
              <User className="h-3.5 w-3.5" />
              Basics
            </button>
            <button
              type="button"
              className={`${segmentedBase} ${
                mode === "ai"
                  ? "border-transparent bg-white text-foreground shadow-sm"
                  : "border-transparent bg-transparent text-gray-600 hover:bg-white/60"
              }`}
              onClick={() => onModeChange("ai")}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Talk to AI
            </button>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 p-1">
            <a
              href={resumeId ? `/dashboard/editor/${resumeId}/preview` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`${segmentedBase} border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md no-underline hover:opacity-95 ${
                !resumeId ? "pointer-events-none opacity-70" : ""
              }`}
              aria-current="true"
            >
              <Globe className="h-3.5 w-3.5" />
              Preview
            </a>
          </div>
        </div>

        {/* Right: template, zoom, share/publish, user */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <Button
            ref={templateButtonRef}
            variant="outline"
            size="sm"
            className={
              "h-8 gap-1.5 border-[hsl(var(--border))] px-2.5 text-xs " +
              (templatePreviewOpen ? "border-[hsl(var(--ring))] bg-[hsl(var(--primary))]/5" : "")
            }
            onClick={() => setTemplatePreviewOpen((prev) => !prev)}
          >
            <span className="max-w-[110px] truncate text-xs">
              {templateId ?? "Choose template"}
            </span>
            <ChevronDown
              className={
                "h-3.5 w-3.5 transition-transform " +
                (templatePreviewOpen ? "rotate-180" : "")
              }
            />
          </Button>
          <div className="flex items-center gap-0.5 rounded-full bg-gray-100 px-1 py-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleZoom(-10)}
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
              onClick={() => handleZoom(10)}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Share your site</TooltipContent>
          </Tooltip>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-[hsl(var(--primary))] px-3 text-xs text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
            onClick={() => navigate("/dashboard/publish")}
          >
            <Upload className="h-4 w-4" />
            Publish
          </Button>
          <div
            className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-medium text-white"
            title={user?.email ?? "Account"}
          >
            {userInitial}
          </div>
        </div>
      </header>

      <TemplatePickerPopover
        resumeId={resumeId}
        open={templatePreviewOpen}
        anchorRef={templateButtonRef}
        onClose={() => setTemplatePreviewOpen(false)}
      />
    </TooltipProvider>
  );
}

