import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-28">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(160deg, hsl(250 50% 96%) 0%, hsl(210 100% 94%) 40%, hsl(220 35% 97%) 100%)",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,hsl(250_50%_90%_/_.4),transparent)]" />
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-[-0.025em] text-foreground md:text-5xl lg:text-6xl">
          Create. Sync. Shine.
        </h1>
        <div className="mt-8 space-y-5 text-base text-muted-foreground md:text-lg">
          <p>
            We&apos;ve all been there — rushing to apply for an internship, nervously updating our resume,
            fixing a typo, rewriting a project description, redesigning a website section... and still feeling
            like it&apos;s not enough.
          </p>
          <p>Your story keeps growing, yet your resume and website never seem to catch up.</p>
          <p>
            Resume2Web ends that constant stress. One upload, one sync, and every update reflects everywhere
            — effortlessly, instantly, beautifully.
          </p>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="rounded-[1.25rem] bg-primary px-8 text-primary-foreground glow-primary hover:bg-primary/90"
          >
            <Link to="/auth">Get Started — It&apos;s Free</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-[1.25rem] border-2 border-secondary bg-card text-foreground shadow-none hover:bg-secondary/20"
          >
            <Link to="/auth">Upload Resume</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
