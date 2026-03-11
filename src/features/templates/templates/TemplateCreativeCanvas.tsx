/**
 * Creative Canvas Collective template — faithful port of github.com/Hasti004/creative-canvas-collective
 * Multi-page (Home / Works / Experience / About / Contact). Experience section has
 * Photographer / Model / Artist subsections; only sections with matching resume items are shown.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import type { ResumeBasics, ResumeBlock } from "@/lib/resumeRepo";
import { getBlockByType, getBlockItems } from "./portfolioData";

type Page = "home" | "works" | "experience" | "about" | "contact";
type ExperienceRole = "photographer" | "model" | "artist" | "generic";

interface TimelineEntry {
  year: string;
  title: string;
  description: string;
  category: string;
  role: ExperienceRole;
}

const CCC_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
  .creative-canvas-root {
    --ccc-bg: 30 15% 90%;
    --ccc-fg: 0 0% 8%;
    --ccc-muted: 0 0% 45%;
    --ccc-border: 30 10% 78%;
    font-family: 'Space Grotesk', sans-serif;
    background: hsl(var(--ccc-bg));
    color: hsl(var(--ccc-fg));
    container-type: inline-size;
    container-name: ccc;
  }
  .creative-canvas-root .font-display { font-family: 'Cormorant Garamond', serif; }
  .creative-canvas-root .font-body { font-family: 'Space Grotesk', sans-serif; }
  @keyframes ccc-fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .creative-canvas-root .animate-ccc-fade {
    animation: ccc-fade-in 0.8s ease-out forwards;
  }
`;

const ROLE_SECTION_LABEL: Record<Exclude<ExperienceRole, "generic">, string> = {
  photographer: "Photographer",
  model: "Model",
  artist: "Artist",
};

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500&q=75",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&q=75",
  "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=500&q=75",
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=75",
  "https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=500&q=75",
  "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=500&q=75",
];

function classifyExperienceItem(item: Record<string, unknown>): ExperienceRole {
  const parts = [item.title, item.role, item.name, item.subtitle, item.company, item.text, item.description]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());
  const haystack = parts.join(" ");
  if (!haystack) return "generic";
  const has = (words: string[]) => words.some((w) => haystack.includes(w));
  if (has(["model", "runway", "catwalk", "campaign", "fashion show", "fashionweek", "lookbook"])) return "model";
  if (has(["photographer", "photography", "photo shoot", "photoshoot", "editorial shoot", "wedding shoot", "portrait session", "studio lighting", "camera"])) return "photographer";
  if (has(["artist", "painter", "sculptor", "installation", "gallery", "exhibition", "solo show", "group show", "mural", "illustration"])) return "artist";
  return "generic";
}

function extractYear(raw: string): string {
  if (!raw) return "";
  const m = raw.match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : "";
}

function buildTimelineEntries(expBlock: ResumeBlock | null | undefined): TimelineEntry[] {
  const items = getBlockItems(expBlock ?? undefined) as Record<string, unknown>[];
  return items.map((item) => {
    const title = (item.title as string) ?? (item.role as string) ?? (item.name as string) ?? "Role";
    const subtitle = (item.subtitle as string) ?? (item.company as string) ?? "";
    const description = (item.text as string) ?? (item.description as string) ?? "";
    const dates = (item.dates as string) ?? subtitle;
    const year = extractYear(dates);
    const role = classifyExperienceItem(item);
    const category = role === "generic" ? (subtitle || "Experience") : ROLE_SECTION_LABEL[role];
    return { year, title, description, category, role };
  });
}

function TimelineRow({ entry, isLast }: { entry: TimelineEntry; isLast: boolean }) {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-8 mb-0 opacity-0 animate-ccc-fade">
      <div className="col-span-3 md:col-span-2 pt-8">
        <span className="font-display text-2xl md:text-3xl font-light text-muted-foreground">
          {entry.year || "—"}
        </span>
      </div>
      <div className="col-span-1 flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-foreground mt-10 shrink-0" style={{ backgroundColor: "hsl(var(--ccc-fg))" }} />
        {!isLast && <div className="w-px flex-1 bg-border" style={{ backgroundColor: "hsl(var(--ccc-border))" }} />}
      </div>
      <div className="col-span-8 md:col-span-9 py-8 border-b border-border last:border-0" style={{ borderColor: "hsl(var(--ccc-border))" }}>
        <span className="font-body text-[10px] tracking-widest uppercase text-muted-foreground" style={{ color: "hsl(var(--ccc-muted))" }}>
          {entry.category}
        </span>
        <h3 className="font-display text-xl md:text-2xl font-light mt-1 mb-3">{entry.title}</h3>
        <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-lg" style={{ color: "hsl(var(--ccc-muted))" }}>
          {entry.description}
        </p>
      </div>
    </div>
  );
}

export function TemplateCreativeCanvas({ basics, blocks }: { basics: ResumeBasics; blocks: ResumeBlock[] }) {
  const [page, setPage] = useState<Page>("home");

  const name = (basics.name as string) || "Creative";
  const heroHeading = (basics.heroHeading as string) || "Where vision meets the frame";
  const summary = (basics.summary as string) || "A curated portfolio for creatives who see the world differently.";
  const email = (basics.email as string) || "";
  const phone = (basics.phone as string) || "";
  const location = (basics.location as string) || "";
  const instagram = (basics.instagram as string) || "";
  const behance = (basics.behance as string) || "";
  const linkedin = (basics.linkedin as string) || "";

  const expBlock = getBlockByType(blocks, "experience");
  const projBlock = getBlockByType(blocks, "projects");
  const eduBlock = getBlockByType(blocks, "education");
  const allEntries = buildTimelineEntries(expBlock);
  const expItems = getBlockItems(expBlock) as Record<string, unknown>[];
  const projItems = getBlockItems(projBlock) as Record<string, unknown>[];
  const eduItems = getBlockItems(eduBlock);

  const byRole: Record<Exclude<ExperienceRole, "generic">, TimelineEntry[]> = {
    photographer: allEntries.filter((e) => e.role === "photographer"),
    model: allEntries.filter((e) => e.role === "model"),
    artist: allEntries.filter((e) => e.role === "artist"),
  };
  const genericEntries = allEntries.filter((e) => e.role === "generic");
  const hasAnyRole = byRole.photographer.length > 0 || byRole.model.length > 0 || byRole.artist.length > 0;

  // User-supplied work images come first; then project/experience images; then stock fallback
  const userWorkImages: string[] = [
    basics.workImage1, basics.workImage2, basics.workImage3,
    basics.workImage4, basics.workImage5, basics.workImage6,
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  // Hero background and About portrait: first work image or stock (no separate hero image field)
  const heroImage = userWorkImages[0] ?? STOCK_IMAGES[0];

  const artPool: string[] = [...userWorkImages];
  [...(projItems || []), ...(expItems || [])].forEach((it) => {
    if (it.image) artPool.push(it.image as string);
    if (it.image2) artPool.push(it.image2 as string);
  });
  while (artPool.length < 10) artPool.push(STOCK_IMAGES[artPool.length % STOCK_IMAGES.length]);

  const navItems: { label: string; page: Page }[] = [
    { label: "WORKS", page: "works" },
    { label: "EXPERIENCE", page: "experience" },
    { label: "ABOUT", page: "about" },
    { label: "CONTACT", page: "contact" },
  ];

  const awardsBlock = getBlockByType(blocks, "awards") ?? getBlockByType(blocks, "certifications");
  const awardItems = getBlockItems(awardsBlock);
  const [contactForm, setContactForm] = useState({ name: "", email: "", subject: "", message: "" });

  return (
    <div className="creative-canvas-root min-h-full">
      <style>{CCC_CSS}</style>

      <header className="sticky top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm" style={{ background: "hsl(var(--ccc-bg) / 0.9)" }}>
        <div className="flex items-center justify-between px-6 md:px-10 py-3">
          <button type="button" onClick={() => setPage("home")} className="font-body text-sm md:text-base font-medium tracking-widest uppercase hover:opacity-70 transition-opacity text-left" style={{ color: "hsl(var(--ccc-fg))" }}>
            {name.toUpperCase()}
          </button>
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((link) => (
              <button
                key={link.page}
                type="button"
                onClick={() => setPage(link.page)}
                className={`font-body text-xs tracking-widest uppercase transition-all duration-300 hover:opacity-90 ${
                  page === link.page ? "opacity-100" : "opacity-60"
                }`}
                style={{ color: "hsl(var(--ccc-fg))" }}
              >
                {link.label}
              </button>
            ))}
            <button type="button" aria-label="Search" className="p-1 opacity-70 hover:opacity-100 transition-opacity" style={{ color: "hsl(var(--ccc-fg))" }}>
              <Search className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </nav>
        </div>
      </header>

      <main className="pt-4 md:pt-6 min-h-[70vh]">
        {page === "home" && (
          <>
            <section className="relative flex min-h-[70vh] items-end">
              <div className="absolute inset-0">
                <img src={heroImage} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" style={{ background: `linear-gradient(to top, hsl(var(--ccc-bg)), hsl(var(--ccc-bg) / 0.4), transparent)` }} />
              </div>
              <div className="relative z-10 max-w-4xl px-6 pb-16 md:px-10 md:pb-20">
                <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light leading-[0.95] tracking-tight mb-6 opacity-0 animate-ccc-fade italic">
                  {heroHeading}
                </h1>
                <p className="font-body text-sm md:text-base text-muted-foreground max-w-md leading-relaxed opacity-0 animate-ccc-fade" style={{ animationDelay: "0.3s", color: "hsl(var(--ccc-muted))" }}>
                  {summary}
                </p>
                <button
                  type="button"
                  onClick={() => setPage("works")}
                  className="mt-8 font-body text-xs tracking-widest uppercase border-b border-foreground pb-1 hover:opacity-70 transition-opacity opacity-0 animate-ccc-fade inline-block"
                  style={{ animationDelay: "0.5s", borderColor: "hsl(var(--ccc-fg))" }}
                >
                  Explore Works
                </button>
              </div>
            </section>

            <section className="px-6 py-20 md:px-10">
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <h2 className="font-display text-4xl md:text-5xl font-light">
                    Selected <span className="italic">works</span>
                  </h2>
                  <p className="font-body mt-3 text-xs tracking-wide uppercase text-muted-foreground" style={{ color: "hsl(var(--ccc-muted))" }}>
                    A glimpse into the portfolio
                  </p>
                </div>
                <button type="button" onClick={() => setPage("works")} className="hidden md:inline-block font-body text-xs tracking-widest uppercase border-b border-foreground pb-1 hover:opacity-70" style={{ borderColor: "hsl(var(--ccc-fg))" }}>
                  VIEW ALL
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[240px] gap-2 md:gap-3">
                {artPool.slice(0, 10).map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPage("works")}
                    className="relative overflow-hidden group opacity-0 animate-ccc-fade"
                    style={{ animationDelay: `${0.1 + i * 0.07}s` }}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-foreground/0 transition-colors duration-500 group-hover:bg-foreground/30" style={{ backgroundColor: "transparent" }} />
                  </button>
                ))}
              </div>
            </section>

            <section className="border-t border-border px-6 py-20 md:px-10" style={{ borderColor: "hsl(var(--ccc-border))" }}>
              <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
                <div className="md:col-span-6">
                  <h2 className="font-display text-4xl md:text-5xl font-light leading-tight">
                    Every creative
                    <br />
                    <span className="italic">deserves a stage</span>
                  </h2>
                </div>
                <div className="md:col-span-4 md:col-start-8 flex flex-col justify-center">
                  <p className="font-body text-sm leading-relaxed text-muted-foreground" style={{ color: "hsl(var(--ccc-muted))" }}>
                    Whether you're a painter, photographer, model, or filmmaker — this template adapts to your craft. Showcase your work with a design that lets the art speak for itself.
                  </p>
                  <button type="button" onClick={() => setPage("about")} className="mt-8 self-start font-body text-xs tracking-widest uppercase border-b border-foreground pb-1 hover:opacity-70" style={{ borderColor: "hsl(var(--ccc-fg))" }}>
                    Learn More
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {page === "works" && (
          <div className="px-6 pb-20 md:px-10">
            <div className="mb-12 max-w-4xl">
              <h1 className="font-display text-5xl md:text-6xl font-light italic mb-4 opacity-0 animate-ccc-fade" style={{ color: "hsl(var(--ccc-fg))" }}>
                Works
              </h1>
              <p className="font-body text-sm max-w-md" style={{ color: "hsl(var(--ccc-muted))" }}>
                Browse creative projects across disciplines — photography, painting, modeling, film, and documentary.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {artPool.slice(0, 9).map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="relative overflow-hidden bg-[hsl(var(--ccc-border))] aspect-[4/5] md:aspect-square"
                  style={{ border: "1px solid hsl(var(--ccc-border))" }}
                >
                  <img src={src} alt="" className="h-full w-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {page === "experience" && (
          <div className="px-6 pb-20 md:px-10">
            <div className="mb-16 max-w-4xl">
              <h1 className="font-display text-5xl md:text-6xl font-light italic mb-4 opacity-0 animate-ccc-fade">
                Experience
              </h1>
              <p className="font-body text-sm text-muted-foreground max-w-lg" style={{ color: "hsl(var(--ccc-muted))" }}>
                A timeline of milestones, projects, and creative evolution.
              </p>
            </div>

            <div className="max-w-4xl">
              {hasAnyRole ? (
                (["photographer", "model", "artist"] as const).map((role) => {
                  const entries = byRole[role];
                  if (entries.length === 0) return null;
                  return (
                    <div key={role} className="mb-16">
                      <h2 className="font-body text-xs tracking-widest uppercase text-muted-foreground mb-8" style={{ color: "hsl(var(--ccc-muted))" }}>
                        {ROLE_SECTION_LABEL[role]} Experience
                      </h2>
                      {entries.map((entry, i) => (
                        <TimelineRow key={`${role}-${i}`} entry={entry} isLast={i === entries.length - 1} />
                      ))}
                    </div>
                  );
                })
              ) : (
                (genericEntries.length > 0 ? genericEntries : allEntries).map((entry, i) => (
                  <TimelineRow key={i} entry={entry} isLast={i === (genericEntries.length || allEntries.length) - 1} />
                ))
              )}
            </div>
          </div>
        )}

        {page === "about" && (
          <div className="px-6 pb-20 md:px-10">
            <div className="mb-20 grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-5 opacity-0 animate-ccc-fade">
                <div className="aspect-[3/4] overflow-hidden min-h-[400px] md:min-h-0">
                  <img src={heroImage} alt={name} className="h-full w-full object-cover grayscale" />
                </div>
              </div>
              <div className="md:col-span-6 md:col-start-7 flex flex-col justify-center opacity-0 animate-ccc-fade" style={{ animationDelay: "0.2s" }}>
                <h1 className="font-display text-5xl md:text-6xl font-light italic mb-8" style={{ color: "hsl(var(--ccc-fg))" }}>About</h1>
                <p className="font-body text-sm leading-relaxed mb-6" style={{ color: "hsl(var(--ccc-muted))" }}>
                  {summary}
                </p>
                {Array.isArray(eduItems) && eduItems.length > 0 && (
                  <div className="mb-10">
                    <h3 className="font-body text-xs tracking-widest uppercase mb-4" style={{ color: "hsl(var(--ccc-fg))" }}>EDUCATION</h3>
                    <ul className="space-y-4">
                      {(eduItems as Record<string, unknown>[]).map((e, i) => (
                        <li key={i}>
                          <span className="font-display text-lg font-light" style={{ color: "hsl(var(--ccc-fg))" }}>
                            {(e.degreeName as string) || (e.role as string) || (e.name as string)} — {(e.name as string) || (e.title as string) || ""}
                          </span>
                          {(e.text as string) && (
                            <p className="font-body text-sm mt-1" style={{ color: "hsl(var(--ccc-muted))" }}>
                              {e.text as string}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(awardItems?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="font-body text-xs tracking-widest uppercase mb-4" style={{ color: "hsl(var(--ccc-fg))" }}>RECOGNITION</h3>
                    <ul className="space-y-3">
                      {(awardItems as Record<string, unknown>[]).map((a, i) => (
                        <li key={i} className="font-body text-sm" style={{ color: "hsl(var(--ccc-muted))" }}>
                          {(a.name as string) ?? (a.title as string) ?? (a.role as string) ?? String(a.text ?? "")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {page === "contact" && (
          <div className="px-6 pb-20 md:px-10">
            <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
              <div className="md:col-span-5 opacity-0 animate-ccc-fade">
                <h1 className="font-display text-5xl md:text-6xl font-light italic mb-8" style={{ color: "hsl(var(--ccc-fg))" }}>Contact</h1>
                <p className="font-body text-sm leading-relaxed mb-10" style={{ color: "hsl(var(--ccc-muted))" }}>
                  Available for editorial commissions, commercial projects, exhibitions, and creative collaborations worldwide. Let&apos;s create something extraordinary.
                </p>
                <div className="space-y-6">
                  {email && (
                    <div>
                      <h3 className="font-body text-xs tracking-widest uppercase mb-2" style={{ color: "hsl(var(--ccc-fg))" }}>EMAIL</h3>
                      <p className="font-body text-sm" style={{ color: "hsl(var(--ccc-muted))" }}>{email}</p>
                    </div>
                  )}
                  {(phone || location) && (
                    <div>
                      <h3 className="font-body text-xs tracking-widest uppercase mb-2" style={{ color: "hsl(var(--ccc-fg))" }}>STUDIO</h3>
                      <p className="font-body text-sm" style={{ color: "hsl(var(--ccc-muted))" }}>{[phone, location].filter(Boolean).join(" · ")}</p>
                    </div>
                  )}
                  {(instagram || behance || linkedin) && (
                    <div>
                      <h3 className="font-body text-xs tracking-widest uppercase mb-2" style={{ color: "hsl(var(--ccc-fg))" }}>SOCIAL</h3>
                      <div className="flex gap-6">
                        {instagram && <a href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="font-body text-sm hover:opacity-80 transition-colors" style={{ color: "hsl(var(--ccc-muted))" }}>Instagram</a>}
                        {behance && <a href={behance.startsWith("http") ? behance : `https://behance.net/${behance}`} target="_blank" rel="noopener noreferrer" className="font-body text-sm hover:opacity-80 transition-colors" style={{ color: "hsl(var(--ccc-muted))" }}>Behance</a>}
                        {linkedin && <a href={linkedin.startsWith("http") ? linkedin : `https://linkedin.com/in/${linkedin}`} target="_blank" rel="noopener noreferrer" className="font-body text-sm hover:opacity-80 transition-colors" style={{ color: "hsl(var(--ccc-muted))" }}>LinkedIn</a>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-5 md:col-start-8 opacity-0 animate-ccc-fade" style={{ animationDelay: "0.15s" }}>
                <div className="space-y-6">
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase mb-2" style={{ color: "hsl(var(--ccc-fg))" }}>NAME</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full font-body text-sm bg-transparent border-0 border-b border-solid outline-none py-1"
                      style={{ borderColor: "hsl(var(--ccc-border))", color: "hsl(var(--ccc-fg))" }}
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase mb-2" style={{ color: "hsl(var(--ccc-fg))" }}>EMAIL</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full font-body text-sm bg-transparent border-0 border-b border-solid outline-none py-1"
                      style={{ borderColor: "hsl(var(--ccc-border))", color: "hsl(var(--ccc-fg))" }}
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase mb-2" style={{ color: "hsl(var(--ccc-fg))" }}>SUBJECT</label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm((f) => ({ ...f, subject: e.target.value }))}
                      className="w-full font-body text-sm bg-transparent border-0 border-b border-solid outline-none py-1 appearance-none"
                      style={{ borderColor: "hsl(var(--ccc-border))", color: "hsl(var(--ccc-fg))" }}
                    >
                      <option value="">Select a subject</option>
                      <option value="commission">Commission</option>
                      <option value="collaboration">Collaboration</option>
                      <option value="inquiry">General inquiry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase mb-2" style={{ color: "hsl(var(--ccc-fg))" }}>MESSAGE</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                      rows={4}
                      className="w-full font-body text-sm bg-transparent border-0 border-b border-solid outline-none py-1 resize-none"
                      style={{ borderColor: "hsl(var(--ccc-border))", color: "hsl(var(--ccc-fg))" }}
                      placeholder=""
                    />
                  </div>
                  <button
                    type="button"
                    className="font-body text-xs tracking-widest uppercase border-b border-solid pb-1 mt-2 hover:opacity-70 transition-opacity"
                    style={{ borderColor: "hsl(var(--ccc-fg))", color: "hsl(var(--ccc-fg))" }}
                  >
                    SEND MESSAGE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border px-6 py-10 md:px-10" style={{ borderColor: "hsl(var(--ccc-border))" }}>
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-display text-lg tracking-wider uppercase">{name}</p>
            <p className="font-body text-xs text-muted-foreground mt-1" style={{ color: "hsl(var(--ccc-muted))" }}>
              © {new Date().getFullYear()} — All rights reserved
            </p>
          </div>
          <div className="flex gap-8">
            {instagram && <a href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="font-body text-xs tracking-widest uppercase text-muted-foreground hover:opacity-80 transition-colors" style={{ color: "hsl(var(--ccc-muted))" }}>Instagram</a>}
            {behance && <a href={behance.startsWith("http") ? behance : `https://behance.net/${behance}`} target="_blank" rel="noopener noreferrer" className="font-body text-xs tracking-widest uppercase text-muted-foreground hover:opacity-80 transition-colors" style={{ color: "hsl(var(--ccc-muted))" }}>Behance</a>}
            {linkedin && <a href={linkedin.startsWith("http") ? linkedin : `https://linkedin.com/in/${linkedin}`} target="_blank" rel="noopener noreferrer" className="font-body text-xs tracking-widest uppercase text-muted-foreground hover:opacity-80 transition-colors" style={{ color: "hsl(var(--ccc-muted))" }}>LinkedIn</a>}
          </div>
        </div>
      </footer>
    </div>
  );
}
