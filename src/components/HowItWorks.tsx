import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Palette, Link2, Zap } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: FileText,
    title: "Upload Resume",
    description: "Any format — AI extracts details automatically and intelligently.",
  },
  {
    step: "02",
    icon: Palette,
    title: "Pick a Style",
    description: "Choose from unique website templates that match your journey.",
  },
  {
    step: "03",
    icon: Link2,
    title: "Sync & Shine",
    description: "Auto-updates from GitHub & LinkedIn keep everything current.",
  },
  {
    step: "04",
    icon: Zap,
    title: "Stay Updated",
    description: "Your website evolves with you — no manual updates needed.",
  },
];

export default function HowItWorks() {
  return (
    <section className="scroll-mt-20 px-4 py-16 md:py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold tracking-[-0.025em] text-foreground md:text-4xl">
          How Resume2Web Helps You Stay Updated
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          A seamless process that keeps your professional presence fresh.
        </p>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <Card
              key={item.step}
              className="paper-card hover-lift flex flex-col border-border shadow-sm"
            >
              <CardHeader className="pb-2">
                <div className="glow-primary mb-4 flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-primary shadow-sm">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  STEP {item.step}
                </p>
                <CardTitle className="mt-1 text-lg font-bold">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
