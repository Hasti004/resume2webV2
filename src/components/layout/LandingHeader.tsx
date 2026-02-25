import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Landing page header — matches reference: logo (Resume + 2 + Web), centered nav, Sign In / Sign Up.
 */
export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card text-left">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-4">
        <Link
          to="/"
          className="flex items-baseline gap-0.5 text-foreground no-underline justify-self-start"
        >
          <span className="text-xl font-bold tracking-tight">Resume</span>
          <span className="text-sm font-medium text-foreground/90 align-middle">2</span>
          <span className="text-xl font-bold tracking-tight">Web</span>
        </Link>
        <nav className="flex items-center gap-8 justify-self-center" aria-label="Main">
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </a>
          <a
            href="#contact"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Contact
          </a>
        </nav>
        <div className="flex items-center gap-3 justify-self-end">
          <Button
            asChild
            variant="outline"
            size="default"
            className="rounded-[1.25rem] border-border bg-card font-medium text-foreground shadow-none hover:bg-muted/50"
          >
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button
            asChild
            size="default"
            className="rounded-[1.25rem] bg-primary px-5 text-primary-foreground glow-primary hover:bg-primary/90"
          >
            <Link to="/auth">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
