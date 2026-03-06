/**
 * Shows the structured resume (basics + blocks) after Gemini structuring.
 * Reached after Review → create project → structureResumeWithGemini. User can verify then go to template selection.
 */
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, User, Briefcase, GraduationCap, Award, FileText } from "lucide-react";
import type { StructureResumeResult } from "@/lib/resumeRepo";

function BlockSection({
  block,
}: {
  block: { type: string; title: string | null; data: Record<string, unknown> };
}) {
  const title = block.title || block.type;
  const items = Array.isArray(block.data?.items) ? (block.data.items as Record<string, unknown>[]) : [];
  const text = typeof block.data?.text === "string" ? block.data.text : null;

  let Icon = FileText;
  if (block.type === "experience" || block.type === "work") Icon = Briefcase;
  else if (block.type === "education") Icon = GraduationCap;
  else if (block.type === "skills" || block.type === "certifications" || block.type === "awards") Icon = Award;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold capitalize text-foreground">{title}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {text && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{text}</p>}
        {items.length > 0 && (
          <ul className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="border-l-2 border-primary/30 pl-3 text-sm">
                {typeof item === "object" && item !== null && "role" in item && (
                  <>
                    <span className="font-medium text-foreground">{(item as { role?: string }).role}</span>
                    {(item as { company?: string }).company && (
                      <span className="text-muted-foreground"> · {(item as { company?: string }).company}</span>
                    )}
                    {(item as { dates?: string }).dates && (
                      <div className="text-muted-foreground text-xs">{(item as { dates?: string }).dates}</div>
                    )}
                    {(item as { description?: string }).description && (
                      <p className="mt-1 text-muted-foreground">{(item as { description?: string }).description}</p>
                    )}
                  </>
                )}
                {typeof item === "object" && item !== null && !("role" in item) && "name" in item && (
                  <>
                    <span className="font-medium text-foreground">{(item as { name?: string }).name}</span>
                    {(item as { degree?: string }).degree && (
                      <span className="text-muted-foreground"> · {(item as { degree?: string }).degree}</span>
                    )}
                    {(item as { dates?: string }).dates && (
                      <div className="text-muted-foreground text-xs">{(item as { dates?: string }).dates}</div>
                    )}
                  </>
                )}
                {typeof item === "string" && <span className="text-foreground">{item}</span>}
                {typeof item === "object" && item !== null && !("role" in item) && !("name" in item) && (
                  <span className="text-muted-foreground">{JSON.stringify(item)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {!text && items.length === 0 && (
          <p className="text-sm text-muted-foreground">{JSON.stringify(block.data)}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ViewStructuredResume() {
  const navigate = useNavigate();
  const { resumeId } = useParams();
  const location = useLocation();
  const structured = (location.state as StructureResumeResult | null)?.basics
    ? (location.state as StructureResumeResult)
    : null;

  if (!resumeId) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl px-6 py-16 text-center text-muted-foreground">
          <p>Missing resume ID.</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!structured?.basics && !structured?.blocks) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-xl px-6 py-16 text-center text-muted-foreground">
          <p>No structured data to show. Use Create → Review → Continue to structure a resume first.</p>
          <Button asChild className="mt-4">
            <Link to={`/dashboard/editor/${resumeId}/template`}>Go to template</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const basics = structured.basics ?? {};
  const blocks = structured.blocks ?? [];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Structured resume
          </h1>
          <p className="mt-2 text-muted-foreground">
            Here’s how your resume was structured. If it looks good, continue to pick a template.
          </p>

          {/* Basics */}
          <Card className="mt-6 border-border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">Contact & summary</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {basics.name != null && basics.name !== "" && <p className="font-medium text-foreground">{String(basics.name)}</p>}
              {basics.headline != null && basics.headline !== "" && <p className="text-muted-foreground">{String(basics.headline)}</p>}
              {basics.email != null && basics.email !== "" && <p className="text-muted-foreground">{String(basics.email)}</p>}
              {basics.phone != null && basics.phone !== "" && <p className="text-muted-foreground">{String(basics.phone)}</p>}
              {basics.location != null && basics.location !== "" && <p className="text-muted-foreground">{String(basics.location)}</p>}
              {basics.summary != null && basics.summary !== "" && <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{String(basics.summary)}</p>}
            </CardContent>
          </Card>

          {/* Blocks */}
          <div className="mt-6 space-y-4">
            {blocks.map((block, i) => (
              <BlockSection key={`${block.type}-${i}`} block={block} />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => navigate(`/dashboard/editor/${resumeId}/template`, { replace: true })}>
              Continue to template
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/dashboard/editor/${resumeId}/edit`}>Edit in editor</Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
