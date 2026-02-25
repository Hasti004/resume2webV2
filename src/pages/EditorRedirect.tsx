import { Navigate } from "react-router-dom";

/**
 * /editor redirects to editor with a default or new resume id.
 * Replace with real logic (e.g. create new resume and redirect to /editor/:resumeId).
 */
export default function EditorRedirect() {
  return <Navigate to="/editor/new" replace />;
}
