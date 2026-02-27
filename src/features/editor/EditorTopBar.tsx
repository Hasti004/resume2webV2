import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  ChevronDown,
  Clock,
  LayoutTemplate,
  Globe,
  Cloud,
  Palette,
  Code2,
  BarChart2,
  MoreVertical,
  Maximize2,
  RefreshCw,
  Loader2,
  Check,
  Share2,
  Zap,
  Upload,
  User,
  Sparkles,
} from "lucide-react";

function ToolbarButton({
  icon: Icon,
  label,
  variant = "ghost",
  className,
  ...props
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant?: "default" | "secondary" | "ghost" | "link" | "outline" | "destructive";
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size="icon" className={`h-8 w-8 ${className ?? ""}`} {...props}>
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export interface EditorTopBarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function EditorTopBar({ activeTab, onTabChange }: EditorTopBarProps) {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const basics = useResumeDocStore((s) => s.basics);
  const saving = useResumeDocStore((s) => s.saving);
  const dirty = useResumeDocStore((s) => s.dirty);

  const projectName = basics?.name?.trim() || "My Resume";
  const statusText = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : "Previewing last saved version";

  const userInitial = user?.email?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/80 px-4">
        {/* Left: Logo + project name + status */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            to="/dashboard"
            className="flex shrink-0 items-center gap-2 text-foreground no-underline"
            aria-label="Dashboard"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
              <span className="text-sm font-bold">R2W</span>
            </div>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex flex-col items-start gap-0.5 rounded-md px-2 py-1 text-left hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring"
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

        {/* Middle: Tool strip + path */}
        <div className="flex flex-1 items-center justify-center gap-1">
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
            <ToolbarButton
              icon={User}
              label="Basics"
              variant={activeTab === "basics" ? "secondary" : "ghost"}
              onClick={() => onTabChange?.("basics")}
            />
            <ToolbarButton icon={Clock} label="History" />
            <ToolbarButton icon={LayoutTemplate} label="Pages" />
            <Button variant="secondary" size="sm" className="h-8 gap-1.5 px-3">
              <Globe className="h-4 w-4" />
              Preview
            </Button>
            <ToolbarButton icon={Cloud} label="Sync" />
            <ToolbarButton icon={Palette} label="Theme" />
            <ToolbarButton icon={Code2} label="Code" />
            <ToolbarButton icon={BarChart2} label="Analytics" />
            <ToolbarButton icon={MoreVertical} label="More" />
            <Button
              variant={activeTab === "ai" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-1.5 px-2.5 text-xs"
              onClick={() => onTabChange?.("ai")}
              title="Talk to AI"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Talk to AI
            </Button>
          </div>
          <div className="ml-2 flex items-center gap-1">
            <Input
              defaultValue="/"
              className="h-8 w-24 border-border bg-muted/30 text-center text-sm"
              readOnly
            />
            <ToolbarButton icon={Maximize2} label="Full screen" />
            <ToolbarButton icon={RefreshCw} label="Refresh" />
          </div>
        </div>

        {/* Right: User + Share, GitHub, Upgrade, Publish */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-medium text-white"
            title={user?.email ?? "Account"}
          >
            {userInitial}
          </div>
          <Button variant="ghost" size="sm" className="h-8">
            <Share2 className="h-4 w-4 mr-1.5" />
            Share
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-label="GitHub">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-1.41-3.795-1.41-.546-1.39-1.335-1.755-1.335-1.755-1.086-.75.09-.735.09-.735 1.2.09 1.83 1.23 1.83 1.23 1.065 1.815 2.805 1.305 3.495.99.105-.765.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">GitHub</TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-violet-500/50 text-violet-600 hover:bg-violet-500/10 hover:text-violet-700"
            onClick={() => navigate("/dashboard/upgrade")}
          >
            <Zap className="h-4 w-4" />
            Upgrade
          </Button>
          <Button size="sm" className="h-8 gap-1.5 bg-primary" onClick={() => navigate("/dashboard/publish")}>
            <Upload className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </header>
    </TooltipProvider>
  );
}
