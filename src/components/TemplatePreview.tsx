import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PLACEHOLDERS = [
  { id: 1, seed: "laptop" },
  { id: 2, seed: "charts" },
  { id: 3, seed: "portrait" },
  { id: 4, seed: "typing" },
  { id: 5, seed: "desk" },
  { id: 6, seed: "office" },
];

export default function TemplatePreview() {
  return (
    <section className="relative px-4 py-16 md:py-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_70%,hsl(250_50%_94%_/_.3),transparent)]" />
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-bold tracking-[-0.025em] text-foreground md:text-4xl lg:text-[2.5rem]">
          Build a Website
          <br />
          That <span className="pink-highlight">Reflects You</span>
          <br />
          — <span className="pink-highlight">Instantly.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Pick from <strong className="font-semibold text-foreground">50+</strong> curated templates made for every path and profession.
        </p>
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {PLACEHOLDERS.map(({ id, seed }) => (
            <div
              key={id}
              className="aspect-square overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-md glow-light"
            >
              <img
                src={`https://picsum.photos/seed/${seed}/600/600`}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
        <h3 className="mt-16 text-2xl font-bold tracking-[-0.025em] text-foreground md:text-3xl">
          Let&apos;s Get Cracking
        </h3>
        <Button
          asChild
          size="lg"
          className="mt-5 rounded-[1.25rem] bg-primary px-8 text-primary-foreground glow-primary hover:bg-primary/90"
        >
          <Link to="/auth">Start Now</Link>
        </Button>
      </div>
    </section>
  );
}
