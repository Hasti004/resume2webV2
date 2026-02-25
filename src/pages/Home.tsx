import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Home() {
  return (
    <div className="space-y-12 text-center">
      <section className="space-y-4 fade-up">
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Turn your resume into a <span className="gradient-text">beautiful page</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Create a professional resume website in minutes. Pick a template, edit your content, and share.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="gradient-primary hover:opacity-90">
            <Link to="/editor">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/templates">Browse templates</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="paper-card hover-lift">
          <CardHeader>
            <CardTitle>Simple editor</CardTitle>
            <CardDescription>Edit sections and preview in real time.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
        <Card className="paper-card hover-lift">
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Choose from clean, professional designs.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
        <Card className="paper-card hover-lift">
          <CardHeader>
            <CardTitle>Share</CardTitle>
            <CardDescription>Publish and share your resume link.</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      </section>
    </div>
  );
}
