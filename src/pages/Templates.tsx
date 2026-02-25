import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Templates() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Templates</h1>
        <p className="mt-2 text-muted-foreground">Choose a template to get started.</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="paper-card hover-lift">
          <CardHeader>
            <CardTitle>Classic</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Clean, single-column layout.</p>
            <Button asChild className="mt-4">
              <Link to="/editor">Use template</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="paper-card hover-lift">
          <CardHeader>
            <CardTitle>Modern</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Two-column with sidebar.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/editor">Use template</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
