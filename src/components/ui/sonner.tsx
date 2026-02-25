import { Toaster as SonnerToaster } from "sonner";

/**
 * Sonner toaster for toast notifications. Place once at app root.
 * Import as: import { Toaster as Sonner } from "@/components/ui/sonner"
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "bg-background border border-border text-foreground",
          success: "border-primary",
          error: "border-destructive",
        },
      }}
    />
  );
}
