import type { ResumeBasics, ResumeBlock } from "@/lib/resumeRepo";
import {
  getBasicsDisplay,
  getBlockByType,
  getBlockItems,
  getBlockText,
  getBlockTitle,
  isExperienceItem,
  isEducationItem,
} from "./portfolioData";

const GRADIENT =
  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 25%, #ec4899 50%, #8b5cf6 75%, #6366f1 100%)";

export interface TemplateBoldProps {
  basics: ResumeBasics;
  blocks: ResumeBlock[];
}

export function TemplateBold({ basics, blocks }: TemplateBoldProps) {
  const { name, headline, contact, links, summary } = getBasicsDisplay(basics);
  const summaryBlock = getBlockByType(blocks, "summary");
  const experienceBlock = getBlockByType(blocks, "experience");
  const projectsBlock = getBlockByType(blocks, "projects");
  const skillsBlock = getBlockByType(blocks, "skills");
  const educationBlock = getBlockByType(blocks, "education");
  const aboutText = getBlockText(summaryBlock) || summary || (headline ? String(headline) : null);
  const experienceItems = getBlockItems(experienceBlock);
  const projectItems = getBlockItems(projectsBlock);
  const skillItems = getBlockItems(skillsBlock);
  const educationItems = getBlockItems(educationBlock);
  const renderedTypes = new Set(["summary", "experience", "projects", "skills", "education"]);
  const otherBlocks = blocks.filter((b) => !renderedTypes.has(b.type.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white font-sans antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0c0c0c]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <a href="#" className="text-lg font-bold text-white">
            {name}
          </a>
          <div className="flex gap-8 text-sm text-white/80">
            {aboutText && <a href="#about" className="hover:text-white transition-colors">About</a>}
            {experienceItems.length > 0 && <a href="#experience" className="hover:text-white transition-colors">Experience</a>}
            {projectItems.length > 0 && <a href="#projects" className="hover:text-white transition-colors">Projects</a>}
            {skillItems.length > 0 && <a href="#skills" className="hover:text-white transition-colors">Skills</a>}
            {educationItems.length > 0 && <a href="#education" className="hover:text-white transition-colors">Education</a>}
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero with animated gradient and floating orbs */}
      <header
        id="hero"
        className="portfolio-gradient-animated relative overflow-hidden px-6 py-24 sm:py-32"
        style={{ background: GRADIENT }}
      >
        {/* Floating orbs (graphic elements) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute h-64 w-64 rounded-full bg-white/10 blur-3xl"
            style={{
              top: "10%",
              left: "5%",
              animation: "portfolio-float 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute h-48 w-48 rounded-full bg-white/10 blur-2xl"
            style={{
              bottom: "20%",
              right: "10%",
              animation: "portfolio-float-slow 10s ease-in-out infinite",
              animationDelay: "2s",
            }}
          />
          <div
            className="absolute h-32 w-32 rounded-full bg-white/10 blur-xl"
            style={{
              top: "50%",
              left: "50%",
              animation: "portfolio-float 6s ease-in-out infinite",
              animationDelay: "1s",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <h1
            className="text-5xl font-bold tracking-tight text-white drop-shadow-lg sm:text-6xl"
            style={{
              animation: "portfolio-fade-up 0.6s ease-out 0.1s forwards",
              opacity: 0,
            }}
          >
            {name}
          </h1>
          {headline && (
            <p
              className="mt-6 text-xl text-white/95 max-w-2xl mx-auto leading-relaxed"
              style={{
                animation: "portfolio-fade-up 0.6s ease-out 0.25s forwards",
                opacity: 0,
              }}
            >
              {String(headline).slice(0, 180)}
              {String(headline).length > 180 ? "…" : ""}
            </p>
          )}
          {contact.length > 0 && (
            <p
              className="mt-5 text-white/90 text-sm"
              style={{
                animation: "portfolio-fade-up 0.6s ease-out 0.4s forwards",
                opacity: 0,
              }}
            >
              {contact.join(" · ")}
            </p>
          )}
          {links.length > 0 && (
            <div
              className="mt-8 flex flex-wrap justify-center gap-4"
              style={{
                animation: "portfolio-fade-up 0.6s ease-out 0.5s forwards",
                opacity: 0,
              }}
            >
              {links.map((l) => (
                <a
                  key={l.label}
                  href={String(l.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-white/20 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-white/30"
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-20">
        {/* About */}
        {aboutText && (
          <section
            id="about"
            className="scroll-mt-24 mb-24"
            style={{ animation: "portfolio-fade-up 0.6s ease-out 0.1s forwards", opacity: 0 }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a78bfa] mb-6">
              About
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur portfolio-hover-lift">
              <p className="text-white/90 leading-relaxed text-lg max-w-2xl">{aboutText}</p>
            </div>
          </section>
        )}

        {/* Experience */}
        {experienceItems.length > 0 && (
          <section
            id="experience"
            className="scroll-mt-24 mb-24"
            style={{ animation: "portfolio-fade-up 0.6s ease-out 0.15s forwards", opacity: 0 }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a78bfa] mb-8">
              {getBlockTitle(experienceBlock)}
            </h2>
            <div className="space-y-6">
              {experienceItems.map((item, i) => {
                if (!isExperienceItem(item)) return typeof item === "string" ? <p key={i} className="text-white/80">{item}</p> : null;
                return (
                  <article
                    key={i}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur portfolio-hover-lift hover:border-[#a78bfa]/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-xl font-semibold text-white">{String(item.role ?? "")}</h3>
                      {item.dates && <span className="text-sm text-white/60">{String(item.dates)}</span>}
                    </div>
                    {item.company && <p className="mt-1 text-white/70">{String(item.company)}</p>}
                    {item.description && (
                      <p className="mt-4 text-white/80 leading-relaxed">{String(item.description)}</p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Projects */}
        {projectItems.length > 0 && (
          <section
            id="projects"
            className="scroll-mt-24 mb-24"
            style={{ animation: "portfolio-fade-up 0.6s ease-out 0.2s forwards", opacity: 0 }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a78bfa] mb-8">
              {getBlockTitle(projectsBlock)}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {projectItems.map((item, i) => {
                if (typeof item === "string") {
                  return (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/80">
                      {item}
                    </div>
                  );
                }
                const obj = item as Record<string, unknown>;
                const projName = obj.name ?? obj.title;
                const desc = obj.description ?? obj.text;
                const url = obj.url ?? obj.link;
                return (
                  <article
                    key={i}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur portfolio-hover-lift hover:border-[#a78bfa]/50 transition-colors"
                  >
                    {projName && <h3 className="text-lg font-semibold text-white">{String(projName)}</h3>}
                    {desc && <p className="mt-3 text-white/80 leading-relaxed">{String(desc)}</p>}
                    {url && (
                      <a
                        href={String(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-[#a78bfa] font-medium hover:underline"
                      >
                        View project <span aria-hidden>→</span>
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Skills */}
        {skillItems.length > 0 && (
          <section
            id="skills"
            className="scroll-mt-24 mb-24"
            style={{ animation: "portfolio-fade-up 0.6s ease-out 0.25s forwards", opacity: 0 }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a78bfa] mb-6">
              {getBlockTitle(skillsBlock)}
            </h2>
            <div className="flex flex-wrap gap-3">
              {skillItems.map((item, i) => (
                <span
                  key={i}
                  className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 border border-white/10 transition-transform duration-200 hover:scale-105"
                >
                  {typeof item === "string" ? item : (item as Record<string, unknown>)?.name ?? (item as Record<string, unknown>)?.title ?? String(item)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {educationItems.length > 0 && (
          <section
            id="education"
            className="scroll-mt-24 mb-24"
            style={{ animation: "portfolio-fade-up 0.6s ease-out 0.3s forwards", opacity: 0 }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a78bfa] mb-8">
              {getBlockTitle(educationBlock)}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {educationItems.map((item, i) => {
                if (!isEducationItem(item)) return typeof item === "string" ? <p key={i} className="text-white/80">{item}</p> : null;
                return (
                  <article
                    key={i}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 portfolio-hover-lift hover:border-[#a78bfa]/40 transition-colors"
                  >
                    <h3 className="font-semibold text-white">{String(item.name ?? "")}</h3>
                    {item.degree && <p className="text-white/70 mt-1">{String(item.degree)}</p>}
                    {item.dates && <p className="text-white/50 text-sm mt-2">{String(item.dates)}</p>}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Other sections (certifications, awards, languages, etc.) */}
        {otherBlocks.length > 0 && (
          <section
            className="scroll-mt-24 mb-24"
            style={{ animation: "portfolio-fade-up 0.6s ease-out 0.35s forwards", opacity: 0 }}
          >
            {otherBlocks.map((block, idx) => {
              const items = getBlockItems(block);
              const title = getBlockTitle(block);
              const text = getBlockText(block);
              return (
                <div key={block.id ?? idx} className="mb-12">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a78bfa] mb-4">
                    {title}
                  </h2>
                  {text && <p className="text-white/80 leading-relaxed">{text}</p>}
                  {items.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {items.map((it, i) => (
                        <span key={i} className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/90">
                          {typeof it === "string" ? it : String((it as Record<string, unknown>)?.name ?? (it as Record<string, unknown>)?.title ?? JSON.stringify(it))}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Contact / Footer */}
        <footer
          id="contact"
          className="scroll-mt-24 border-t border-white/10 pt-16"
          style={{ animation: "portfolio-fade-up 0.6s ease-out 0.4s forwards", opacity: 0 }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#a78bfa] mb-6">
            Get in touch
          </h2>
          <div className="flex flex-wrap gap-8 text-white/80">
            {basics.email && (
              <a href={`mailto:${basics.email}`} className="hover:text-white transition-colors">
                {String(basics.email)}
              </a>
            )}
            {basics.phone && <span>{String(basics.phone)}</span>}
            {links.map((l) => (
              <a
                key={l.label}
                href={String(l.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
          <p className="mt-10 text-sm text-white/40">
            © {new Date().getFullYear()} {name}
          </p>
        </footer>
      </main>
    </div>
  );
}
