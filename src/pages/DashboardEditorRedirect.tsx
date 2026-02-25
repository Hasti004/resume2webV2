import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ensureDraftAndRoute } from "@/lib/editorOrchestrator";

/**
 * /dashboard/editor — "Just take me to my resume".
 * Single entry: ensure a draft exists, then go to nextRoute.
 */
export default function DashboardEditorRedirect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    let cancelled = false;
    ensureDraftAndRoute({ userId: user?.id ?? null, intent: "open-editor" })
      .then(({ nextRoute }) => {
        if (cancelled) return;
        setDone(true);
        navigate(nextRoute, { replace: true });
      })
      .catch(() => {
        if (cancelled) return;
        setDone(true);
        navigate("/dashboard", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, navigate, done]);

  return null;
}
