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

type Theme = "light" | "dark";

const LIGHT = {
  bg: "#fafafa",
  text: "#171717",
  textMuted: "#525252",
  textMuted2: "#737373",
  textMuted3: "#a3a3a3",
  border: "#e5e5e5",
  borderHover: "#a3a3a3",
  accent: "#0f0f0f",
  card: "#ffffff",
  cardHover: "#f5f5f5",
};
const DARK = {
  bg: "#0f0f0f",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  textMuted2: "#737373",
  textMuted3: "#525252",
  border: "#404040",
  borderHover: "#737373",
  accent: "#e5e5e5",
  card: "#171717",
  cardHover: "#262626",
};

export interface TemplateMinimalProps {
  theme?: Theme;
  basics: ResumeBasics;
  blocks: ResumeBlock[];
}

export function TemplateMinimal({ theme = "dark", basics, blocks }: TemplateMinimalProps) {
  const c = theme === "dark" ? DARK : LIGHT;
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

  const heroImageUrl = basics.heroImage as string | undefined;

  return (
    <div className="min-h-screen font-sans antialiased" style={{ backgroundColor: c.bg, color: c.text }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b backdrop-blur supports-[backdrop-filter]:bg-opacity-80 transition-colors" style={{ borderColor: c.border, backgroundColor: `${c.bg}ee` }}>
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <a href="#" className="text-lg font-semibold tracking-tight transition-opacity hover:opacity-80" style={{ color: c.accent }}>
            {name}
          </a>
          <div className="flex gap-6 text-sm">
            {aboutText && <a href="#about" className="transition-opacity hover:opacity-100" style={{ color: c.textMuted }}>About</a>}
            {experienceItems.length > 0 && <a href="#experience" className="transition-opacity hover:opacity-100" style={{ color: c.textMuted }}>Experience</a>}
            {projectItems.length > 0 && <a href="#projects" className="transition-opacity hover:opacity-100" style={{ color: c.textMuted }}>Projects</a>}
            {skillItems.length > 0 && <a href="#skills" className="transition-opacity hover:opacity-100" style={{ color: c.textMuted }}>Skills</a>}
            {educationItems.length > 0 && <a href="#education" className="transition-opacity hover:opacity-100" style={{ color: c.textMuted }}>Education</a>}
            <a href="#contact" className="transition-opacity hover:opacity-100" style={{ color: c.textMuted }}>Contact</a>
          </div>
        </div>
      </nav>

      {/* Hero with decorative background and optional image/GIF */}
      <header className="relative overflow-hidden border-b px-6 py-20 sm:py-28" style={{ borderColor: c.border }}>
        {/* Animated dot grid / circles (graphic element) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <svg className="absolute inset-0 h-full w-full opacity-[0.15]" style={{ color: c.text }}>
            <defs>
              <pattern id="hero-dots-minimal" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="16" cy="16" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-dots-minimal)" />
          </svg>
          <div className="absolute right-[10%] top-[20%] h-24 w-24 rounded-full opacity-20" style={{ backgroundColor: c.accent, animation: "portfolio-float 6s ease-in-out infinite" }} />
          <div className="absolute bottom-[25%] left-[15%] h-16 w-16 rounded-full opacity-15" style={{ backgroundColor: c.accent, animation: "portfolio-float-slow 8s ease-in-out infinite" }} />
          <div className="absolute right-[25%] bottom-[15%] h-12 w-12 rounded-full opacity-10" style={{ backgroundColor: c.accent, animation: "portfolio-float 7s ease-in-out infinite", animationDelay: "1s" }} />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {heroImageUrl && (
            <div className="mb-8 flex justify-center" style={{ animation: "portfolio-fade-up 0.6s ease-out 0s forwards", opacity: 0 }}>
              <img
                src={heroImageUrl}
                alt=""
                className="h-28 w-28 rounded-2xl object-cover shadow-lg ring-2 sm:h-36 sm:w-36"
                style={{ ringColor: c.border }}
              />
            </div>
          )}
          <h1
            className="text-4xl font-semibold tracking-tight sm:text-5xl"
            style={{
              color: c.accent,
              animation: "portfolio-fade-up 0.6s ease-out 0.1s forwards",
              opacity: 0,
            }}
          >
            {name}
          </h1>
          {headline && (
            <p
              className="mt-4 text-lg max-w-2xl mx-auto"
              style={{
                color: c.textMuted,
                animation: "portfolio-fade-up 0.6s ease-out 0.25s forwards",
                opacity: 0,
              }}
            >
              {String(headline).slice(0, 160)}
              {String(headline).length > 160 ? "…" : ""}
            </p>
          )}
          {contact.length > 0 && (
            <p
              className="mt-3 text-sm"
              style={{
                color: c.textMuted2,
                animation: "portfolio-fade-up 0.6s ease-out 0.4s forwards",
                opacity: 0,
              }}
            >
              {contact.join(" · ")}
            </p>
          )}
          {links.length > 0 && (
            <div
              className="mt-6 flex flex-wrap justify-center gap-4"
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
                  className="rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 hover:scale-[1.02] hover:opacity-90"
                  style={{ borderColor: c.border, backgroundColor: c.card, color: c.text }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        {/* About */}
        {aboutText && (
          <section id="about" className="scroll-mt-20 mb-20" style={{ animation: "portfolio-fade-up 0.6s ease-out 0.1s forwards", opacity: 0 }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: c.accent }}>
              About
            </h2>
            <p className="leading-relaxed max-w-2xl" style={{ color: c.textMuted }}>{aboutText}</p>
          </section>
        )}

        {/* Experience */}
        {experienceItems.length > 0 && (
          <section id="experience" className="scroll-mt-20 mb-20" style={{ animation: "portfolio-fade-up 0.6s ease-out 0.15s forwards", opacity: 0 }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-8" style={{ color: c.accent }}>
              {getBlockTitle(experienceBlock)}
            </h2>
            <div className="space-y-8">
              {experienceItems.map((item, i) => {
                if (!isExperienceItem(item)) return typeof item === "string" ? <p key={i} style={{ color: c.textMuted }}>{item}</p> : null;
                return (
                  <article key={i} className="portfolio-hover-lift relative pl-6 border-l-2 transition-colors" style={{ borderColor: c.border }}>
                    <div className="absolute left-0 top-0 -translate-x-[9px] w-4 h-4 rounded-full border-2" style={{ backgroundColor: c.bg, borderColor: c.text }} />
                    <h3 className="font-semibold" style={{ color: c.text }}>{String(item.role ?? "")}</h3>
                    {item.company && <p className="text-sm mt-0" style={{ color: c.textMuted2 }}>{String(item.company)}</p>}
                    {item.dates && <p className="text-xs mt-1" style={{ color: c.textMuted3 }}>{String(item.dates)}</p>}
                    {item.description && <p className="mt-2 text-sm leading-relaxed" style={{ color: c.textMuted }}>{String(item.description)}</p>}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Projects */}
        {projectItems.length > 0 && (
          <section id="projects" className="scroll-mt-20 mb-20" style={{ animation: "portfolio-fade-up 0.6s ease-out 0.2s forwards", opacity: 0 }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-8" style={{ color: c.accent }}>
              {getBlockTitle(projectsBlock)}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {projectItems.map((item, i) => {
                if (typeof item === "string") return <div key={i} className="rounded-lg border p-5" style={{ borderColor: c.border, backgroundColor: c.card, color: c.textMuted }}>{item}</div>;
                const obj = item as Record<string, unknown>;
                const projName = obj.name ?? obj.title;
                const desc = obj.description ?? obj.text;
                const url = obj.url ?? obj.link;
                return (
                  <article key={i} className="portfolio-hover-lift rounded-lg border p-5 shadow-sm" style={{ borderColor: c.border, backgroundColor: c.card }}>
                    {projName && <h3 className="font-semibold" style={{ color: c.text }}>{String(projName)}</h3>}
                    {desc && <p className="mt-2 text-sm leading-relaxed" style={{ color: c.textMuted }}>{String(desc)}</p>}
                    {url && (
                      <a href={String(url)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium" style={{ color: c.accent }}>
                        View project →
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
          <section id="skills" className="scroll-mt-20 mb-20" style={{ animation: "portfolio-fade-up 0.6s ease-out 0.25s forwards", opacity: 0 }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: c.accent }}>
              {getBlockTitle(skillsBlock)}
            </h2>
            <div className="flex flex-wrap gap-2">
              {skillItems.map((item, i) => (
                <span
                  key={i}
                  className="rounded-full border px-4 py-1.5 text-sm transition-transform duration-200 hover:scale-105"
                  style={{ borderColor: c.border, backgroundColor: c.card, color: c.textMuted }}
                >
                  {typeof item === "string" ? item : (item as Record<string, unknown>)?.name ?? (item as Record<string, unknown>)?.title ?? String(item)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {educationItems.length > 0 && (
          <section id="education" className="scroll-mt-20 mb-20" style={{ animation: "portfolio-fade-up 0.6s ease-out 0.3s forwards", opacity: 0 }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-8" style={{ color: c.accent }}>
              {getBlockTitle(educationBlock)}
            </h2>
            <div className="space-y-6">
              {educationItems.map((item, i) => {
                if (!isEducationItem(item)) return typeof item === "string" ? <p key={i} style={{ color: c.textMuted }}>{item}</p> : null;
                return (
                  <article key={i} className="portfolio-hover-lift rounded-lg border p-5" style={{ borderColor: c.border, backgroundColor: c.card }}>
                    <h3 className="font-semibold" style={{ color: c.text }}>{String(item.name ?? "")}</h3>
                    {item.degree && <p className="text-sm" style={{ color: c.textMuted2 }}>{String(item.degree)}</p>}
                    {item.dates && <p className="text-xs mt-1" style={{ color: c.textMuted3 }}>{String(item.dates)}</p>}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Other sections (certifications, awards, languages, etc.) */}
        {otherBlocks.length > 0 && (
          <section className="scroll-mt-20 mb-20" style={{ animation: "portfolio-fade-up 0.6s ease-out 0.35s forwards", opacity: 0 }}>
            {otherBlocks.map((block, idx) => {
              const items = getBlockItems(block);
              const title = getBlockTitle(block);
              const text = getBlockText(block);
              return (
                <div key={block.id ?? idx} className="mb-12">
                  <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: c.accent }}>
                    {title}
                  </h2>
                  {text && <p className="leading-relaxed" style={{ color: c.textMuted }}>{text}</p>}
                  {items.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {items.map((it, i) => (
                        <li key={i} className="text-sm" style={{ color: c.textMuted }}>
                          {typeof it === "string" ? it : String((it as Record<string, unknown>)?.name ?? (it as Record<string, unknown>)?.title ?? JSON.stringify(it))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Contact / Footer */}
        <footer id="contact" className="scroll-mt-20 border-t pt-12" style={{ borderColor: c.border, animation: "portfolio-fade-up 0.6s ease-out 0.4s forwards", opacity: 0 }}>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: c.accent }}>
            Contact
          </h2>
          <div className="flex flex-wrap gap-6 text-sm" style={{ color: c.textMuted }}>
            {basics.email && <a href={`mailto:${basics.email}`} className="hover:opacity-80">{String(basics.email)}</a>}
            {basics.phone && <span>{String(basics.phone)}</span>}
            {links.map((l) => (
              <a key={l.label} href={String(l.url)} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">
                {l.label}
              </a>
            ))}
          </div>
          <p className="mt-8 text-xs" style={{ color: c.textMuted3 }}>© {new Date().getFullYear()} {name}. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
