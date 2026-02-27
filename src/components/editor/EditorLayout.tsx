import type { ReactNode } from "react";

export function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[hsl(var(--background))]">
      {children}
    </div>
  );
}

