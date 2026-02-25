import { Outlet } from "react-router-dom";

/**
 * App shell: sidebar/topbar optional. Wrap authenticated app routes.
 */
export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      {/* Optional: add sidebar or topbar here */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
