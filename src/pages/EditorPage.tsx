import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditorPage() {
  const { resumeId } = useParams<{ resumeId: string }>();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Editor — {resumeId}</h1>
      <Card className="paper-card">
        <CardHeader>
          <CardTitle>Edit your resume</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Editor content for resume {resumeId}.</p>
          <Link to={`/editor/${resumeId}/template`} className="text-primary hover:underline">Pick template</Link>
        </CardContent>
      </Card>
    </div>
  );
}
