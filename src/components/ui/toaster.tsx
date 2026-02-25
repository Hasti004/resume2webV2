import { ToastProvider, ToastViewport } from "@/components/ui/toast";

/**
 * Root toaster: provides viewport for toast notifications.
 * Place once at app root (e.g. in App.tsx).
 */
export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}
