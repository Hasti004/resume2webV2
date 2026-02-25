import NewNavbar from "@/components/NewNavbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import TemplatePreview from "@/components/TemplatePreview";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

const Index = () => {
  useSmoothScroll();
  return (
    <div className="relative min-h-screen bg-background">
      <NewNavbar />
      <main className="relative">
        <HeroSection />
        <div id="features">
          <HowItWorks />
        </div>
        <TemplatePreview />
        <section id="pricing" className="scroll-mt-20 px-4 py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground">Pricing</h2>
            <p className="mt-2 text-muted-foreground">Plans and pricing coming soon.</p>
          </div>
        </section>
        <footer
          id="contact"
          className="border-t border-border bg-muted/20 px-6 py-20"
        >
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3 text-center sm:text-left">
            <div>
              <p className="font-semibold text-foreground">Resume2Web</p>
              <p className="mt-1 text-sm text-muted-foreground">
                One upload, one sync. Your story, everywhere.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Links</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#contact" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground">Connect</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Get in touch — we&apos;d love to hear from you.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
