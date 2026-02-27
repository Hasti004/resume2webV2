import { type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <nav className="sticky top-0 z-50 h-16 w-full border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6">
          <Link
            to="/dashboard"
            className="font-bold text-xl text-foreground"
          >
            Resume2Web
          </Link>
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard/create"
              className={cn(
                "text-sm font-medium transition-colors",
                isActive("/dashboard/create")
                  ? "text-foreground underline decoration-primary underline-offset-4"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Create
            </Link>
            <Link
              to="/dashboard/sync"
              className={cn(
                "text-sm font-medium transition-colors",
                isActive("/dashboard/sync")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sync
            </Link>
            <Link
              to="/dashboard/edit"
              className={cn(
                "text-sm font-medium transition-colors",
                isActive("/dashboard/edit")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Edit Site
            </Link>
            <Link
              to="/dashboard/publish"
              className={cn(
                "text-sm font-medium transition-colors",
                isActive("/dashboard/publish")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Publish
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/upgrade")}>
              Upgrade
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <span className="max-w-[160px] truncate">{user?.email ?? "Account"}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/upgrade")}>
                  Subscription / Upgrade
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard/sync")}>
                  Linked Accounts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Delete Account</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
}
