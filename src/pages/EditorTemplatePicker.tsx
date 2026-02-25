import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditorTemplatePicker() {
  const { resumeId } = useParams<{ resumeId: string }>();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Pick a template — {resumeId}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="paper-card">
          <CardHeader><CardTitle>Classic</CardTitle></CardHeader>
          <CardContent>
            <Link to={`/editor/${resumeId}`} className="text-primary hover:underline">Use this template</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
