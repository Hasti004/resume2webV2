import { Link } from "react-router-dom";

export default function EditSite() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Edit site</h1>
      <p className="text-muted-foreground">Edit site placeholder.</p>
      <Link to="/dashboard/editor" className="text-primary hover:underline">Open editor</Link>
    </div>
  );
}
