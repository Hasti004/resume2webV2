import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Editor() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Resume editor</h1>
      <Card className="paper-card">
        <CardHeader>
          <CardTitle>Edit your resume</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Editor content will go here. Same layout and styles as old app.</p>
        </CardContent>
      </Card>
    </div>
  );
}
