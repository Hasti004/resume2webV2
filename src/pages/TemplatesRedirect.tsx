import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * /dashboard/templates?resumeId=... → redirect to /dashboard/editor/:resumeId/template
 */
export default function TemplatesRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get("resumeId");

  useEffect(() => {
    if (resumeId?.trim()) {
      navigate(`/dashboard/editor/${resumeId}/template`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [resumeId, navigate]);

  return null;
}
