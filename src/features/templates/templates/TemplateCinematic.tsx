import { useRef, useState, useCallback, useEffect } from "react";
import type { ResumeBasics, ResumeBlock } from "@/lib/resumeRepo";
import {
  getBasicsDisplay,
  getBlockByType,
  getBlockItems,
  getBlockText,
  getBlockTitle,
  isExperienceItem,
} from "./portfolioData";

export interface TemplateCinematicProps {
  basics: ResumeBasics;
  blocks: ResumeBlock[];
}

const ORB_COLORS = [
  "radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%)",
  "radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)",
  "radial-gradient(circle, rgba(34, 211, 238, 0.25) 0%, transparent 70%)",
  "radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, transparent 70%)",
];

function getProjectCardInfo(item: unknown): { name: string; role?: string; tools?: string; description?: string; url?: string } {
  if (typeof item === "string") return { name: item };
  const o = item as Record<string, unknown>;
  const name = [o.name, o.title].find(Boolean) as string | undefined;
  return {
    name: name ? String(name) : "Project",
    role: o.role as string | undefined,
    tools: Array.isArray(o.tools) ? (o.tools as string[]).join(" · ") : (o.tools as string | undefined),
    description: [o.description, o.text].find(Boolean) as string | undefined,
    url: [o.url, o.link].find(Boolean) as string | undefined,
  };
}

export function TemplateCinematic({ basics, blocks }: TemplateCinematicProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  const onHeroMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  const onHeroMouseLeave = useCallback(() => {
    setMouse({ x: 0.5, y: 0.5 });
  }, []);

  const { name, headline, contact, links, summary } = getBasicsDisplay(basics);
  const summaryBlock = getBlockByType(blocks, "summary");
  const experienceBlock = getBlockByType(blocks, "experience");
  const projectsBlock = getBlockByType(blocks, "projects");
  const skillsBlock = getBlockByType(blocks, "skills");
  const aboutText = getBlockText(summaryBlock) || summary || (headline ? String(headline).slice(0, 200) : null);
  const experienceItems = getBlockItems(experienceBlock);
  const projectItems = getBlockItems(projectsBlock);
  const skillItems = getBlockItems(skillsBlock);

  const professionLabel = headline ? String(headline).slice(0, 60) : "Professional";

  return (
    <div className="cinematic-portfolio min-h-screen min-w-0 bg-[#050508] text-white font-sans antialiased overflow-x-hidden">
      {/* Minimal nav — Home, Work, About, Contact always visible; compact so they fit in preview */}
      <nav className="cinematic-nav fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 py-4 backdrop-blur-md bg-[#050508]/70 border-b border-white/5 min-w-0">
        <a href="#" className="text-sm font-semibold tracking-wide text-white/90 shrink-0">
          {name.split(" ")[0]}
        </a>
        <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm shrink-0">
          <a href="#" className="text-white/60 transition-colors hover:text-white">Home</a>
          {projectItems.length > 0 && (
            <a href="#work" className="text-white/60 transition-colors hover:text-white">Work</a>
          )}
          <a href="#about" className="text-white/60 transition-colors hover:text-white">About</a>
          <a href="#contact" className="text-white/60 transition-colors hover:text-white">Contact</a>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <header
        ref={heroRef}
        onMouseMove={onHeroMouseMove}
        onMouseLeave={onHeroMouseLeave}
        className="cinematic-hero relative min-h-screen flex flex-col justify-center px-6 py-24 sm:px-10 md:px-12"
      >
        <div className="cinematic-hero-bg absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a12] via-[#0d0d18] to-[#050508]" />
          {ORB_COLORS.map((grad, i) => (
            <div
              key={i}
              className="cinematic-orb absolute rounded-full pointer-events-none"
              style={{
                background: grad,
                width: ["38vmin", "45vmin", "32vmin", "40vmin"][i],
                aspectRatio: "1",
                left: ["-8%", "55%", "65%", "15%"][i],
                top: ["5%", "-8%", "45%", "72%"][i],
                animation: `cinematic-orb-float ${12 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
          {/* Cursor-follow glow */}
          <div
            className="cinematic-cursor-glow absolute w-[80vmax] h-[80vmax] rounded-full pointer-events-none mix-blend-soft-light transition-opacity duration-300"
            style={{
              left: `calc(${mouse.x * 100}% - 40vmax)`,
              top: `calc(${mouse.y * 100}% - 40vmax)`,
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 50%)",
            }}
          />
        </div>

        <div className="cinematic-hero-content relative z-10 max-w-5xl min-w-0 w-full">
          <p
            className="cinematic-reveal text-sm font-medium tracking-[0.3em] uppercase text-white/60 mb-6 break-words"
            style={{ animation: "cinematic-fade-up 0.8s ease-out 0.2s forwards", opacity: 0 }}
          >
            {professionLabel}
          </p>
          <h1
            className="cinematic-headline text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-[1.05] text-white"
            style={{
              animation: "cinematic-fade-up 0.9s ease-out 0.35s forwards",
              opacity: 0,
              textShadow: "0 0 80px rgba(99, 102, 241, 0.15)",
            }}
          >
            {name.split(" ").map((word, i) => (
              <span key={i} className="block">
                {word}
              </span>
            ))}
          </h1>
          <div
            className="cinematic-ctas mt-14 flex flex-wrap gap-4"
            style={{ animation: "cinematic-fade-up 0.8s ease-out 0.6s forwards", opacity: 0 }}
          >
            <a
              href="#work"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-[#0a0a12] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              View Work
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white/10 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]"
            >
              Contact
            </a>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest uppercase"
          style={{ animation: "cinematic-fade-up 0.8s ease-out 1s forwards", opacity: 0 }}
        >
          Scroll
        </div>
      </header>

      {/* ─── WORK ─── */}
      {projectItems.length > 0 && (
        <section
          id="work"
          className="cinematic-section relative py-28 sm:py-36 overflow-hidden"
          style={{ animation: "cinematic-fade-up 0.8s ease-out 0.2s forwards", opacity: 0 }}
        >
          <div className="cinematic-section-glow absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#0f0f1a]/50 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-6 sm:px-12">
            <h2 className="text-xs font-semibold tracking-[0.35em] uppercase text-white/50 mb-4">Selected Work</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white mb-16 max-w-2xl">
              Projects & case studies
            </p>
            <div className="cinematic-work-scroll flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth cinematic-scrollbar">
              {projectItems.map((item, i) => {
                const proj = getProjectCardInfo(item);
                return (
                  <article
                    key={i}
                    className="cinematic-work-card group flex-shrink-0 w-[min(340px,85vw)] snap-center rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-8 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.1] hover:shadow-[0_0_60px_-12px_rgba(99,102,241,0.25)]"
                    style={{
                      animation: "cinematic-fade-up 0.7s ease-out forwards",
                      opacity: 0,
                      animationDelay: `${0.1 * i}s`,
                    }}
                  >
                    <div className="cinematic-work-card-inner">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white">
                        {proj.name}
                      </h3>
                      {proj.role && (
                        <p className="text-sm text-white/60 mb-2">{proj.role}</p>
                      )}
                      {proj.tools && (
                        <p className="text-xs text-white/40 mb-4 font-mono">{proj.tools}</p>
                      )}
                      {proj.description && (
                        <p className="text-sm text-white/70 leading-relaxed mt-4 line-clamp-3">
                          {String(proj.description).slice(0, 140)}
                          {String(proj.description).length > 140 ? "…" : ""}
                        </p>
                      )}
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-block text-sm font-medium text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
                        >
                          View project →
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── ABOUT ─── */}
      <section
        id="about"
        className="cinematic-section relative py-28 sm:py-36"
        style={{ animation: "cinematic-fade-up 0.8s ease-out 0.2s forwards", opacity: 0 }}
      >
        <div className="cinematic-section-glow absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#0d0d18]/60 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 sm:px-12">
          <h2 className="text-xs font-semibold tracking-[0.35em] uppercase text-white/50 mb-4">About</h2>
          {aboutText && (
            <p className="text-xl sm:text-2xl text-white/85 leading-relaxed max-w-2xl mb-16">
              {aboutText}
            </p>
          )}
          {skillItems.length > 0 && (
            <div className="mb-20">
              <h3 className="text-sm font-semibold tracking-wider text-white/60 mb-6">Skills</h3>
              <div className="flex flex-wrap gap-3">
                {skillItems.map((s, i) => (
                  <span
                    key={i}
                    className="cinematic-skill-chip rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white/90 backdrop-blur-sm transition-all duration-300 hover:border-[#6366f1]/50 hover:bg-[#6366f1]/15 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]"
                    style={{
                      animation: "cinematic-fade-up 0.6s ease-out forwards",
                      opacity: 0,
                      animationDelay: `${0.03 * i}s`,
                    }}
                  >
                    {typeof s === "string" ? s : String((s as Record<string, unknown>)?.name ?? (s as Record<string, unknown>)?.title ?? "")}
                  </span>
                ))}
              </div>
            </div>
          )}
          {experienceItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold tracking-wider text-white/60 mb-8">Experience</h3>
              <div className="cinematic-timeline space-y-0">
                {experienceItems.map((item, i) => {
                  if (!isExperienceItem(item))
                    return typeof item === "string" ? (
                      <p key={i} className="text-white/60 py-4">{item}</p>
                    ) : null;
                  return (
                    <div
                      key={i}
                      className="cinematic-timeline-item relative flex gap-8 py-8 border-b border-white/10 last:border-0"
                      style={{
                        animation: "cinematic-fade-up 0.6s ease-out forwards",
                        opacity: 0,
                        animationDelay: `${0.08 * i}s`,
                      }}
                    >
                      <div className="flex-shrink-0 w-28 text-sm text-white/50">{item.dates ?? "—"}</div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{String(item.role ?? "")}</h4>
                        {item.company && <p className="text-white/60 text-sm mt-0.5">{String(item.company)}</p>}
                        {item.description && (
                          <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-xl">
                            {String(item.description).slice(0, 220)}
                            {String(item.description).length > 220 ? "…" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section
        id="contact"
        className="cinematic-section relative py-28 sm:py-36 overflow-hidden"
        style={{ animation: "cinematic-fade-up 0.8s ease-out 0.2s forwards", opacity: 0 }}
      >
        <div className="cinematic-contact-glow absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
            style={{
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              animation: "cinematic-orb-float 15s ease-in-out infinite",
            }}
          />
        </div>
        <div className="relative max-w-xl mx-auto px-6 sm:px-12">
          <h2 className="text-xs font-semibold tracking-[0.35em] uppercase text-white/50 mb-4">Contact</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white mb-14">Get in touch</p>
          <div className="cinematic-contact-form rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-8 sm:p-10 shadow-[0_0_80px_-20px_rgba(99,102,241,0.15)]">
            <div className="space-y-6">
              {basics.email && (
                <a
                  href={`mailto:${basics.email}`}
                  className="cinematic-input block w-full rounded-xl border border-white/20 bg-white/5 px-5 py-4 text-white/90 placeholder-white/40 outline-none transition-all duration-300 focus:border-[#6366f1]/60 focus:bg-white/10 focus:shadow-[0_0_0_1px_rgba(99,102,241,0.3)] hover:border-white/30"
                >
                  {String(basics.email)}
                </a>
              )}
              {basics.phone && (
                <p className="rounded-xl border border-white/20 bg-white/5 px-5 py-4 text-white/80">
                  {String(basics.phone)}
                </p>
              )}
              <div className="flex flex-wrap gap-4 pt-4">
                {links.map((l) => (
                  <a
                    key={l.label}
                    href={String(l.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-medium text-white/90 backdrop-blur-sm transition-all duration-300 hover:border-[#6366f1]/50 hover:bg-[#6366f1]/20 hover:shadow-[0_0_30px_-8px_rgba(99,102,241,0.4)]"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-10 text-center text-sm text-white/40">
            © {new Date().getFullYear()} {name}
          </p>
        </div>
      </section>
    </div>
  );
}
