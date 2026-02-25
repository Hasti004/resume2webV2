import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getSession } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps routes that require auth. Redirects to /login if no session.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    getSession()
      .then((session) => setAuthenticated(!!session))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
