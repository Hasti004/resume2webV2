import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardEditorTemplatePicker() {
  const { resumeId } = useParams<{ resumeId: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Pick template — {resumeId}</h1>
      <Card className="paper-card">
        <CardHeader><CardTitle>Classic</CardTitle></CardHeader>
        <CardContent>
          <Link to={`/dashboard/editor/${resumeId}`} className="text-primary hover:underline">Use template</Link>
        </CardContent>
      </Card>
    </div>
  );
}
