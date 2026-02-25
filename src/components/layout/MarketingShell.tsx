import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";

/**
 * Marketing shell for homepage/landing. Same max-width and typography as design system.
 */
export function MarketingShell() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-foreground hover:text-primary">
            Resume2Web
          </Link>
          <nav className="flex gap-4">
            <Link to="/templates" className="text-sm text-muted-foreground hover:text-foreground">
              Templates
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Login
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
