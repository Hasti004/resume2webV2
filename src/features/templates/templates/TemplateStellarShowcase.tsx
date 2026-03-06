import { motion } from "framer-motion";
import type { ResumeBasics, ResumeBlock } from "@/lib/resumeRepo";
import { getBlockByType, getBlockItems } from "./portfolioData";

type ExperienceRole = "photographer" | "model" | "artist" | "generic";

interface ExperienceEntry {
  title: string;
  roleLabel: string;
  dates: string;
  description: string;
  role: ExperienceRole;
}

const stats = [
  { number: "+300", label: "SUCCESS\nPROJECT" },
  { number: "+200", label: "PRODUCT\nLAUNCHES" },
  { number: "+100", label: "STARTUP\nRAISED" },
];

const services = [
  {
    title: "BRAND IDENTITY\nCREATION",
    description: "CRAFTING UNIQUE AND\nMEMORABLE BRAND IDENTITIES",
    accent: false,
  },
  {
    title: "WEB & MOBILE\nDESIGN",
    description: "ELEGANT EXPERIENCES\nACROSS EVERY SCREEN",
    accent: true,
  },
  {
    title: "UX/UI\nDIRECTION",
    description: "SEAMLESS FLOWS THAT\nFEEL NATURAL TO USE",
    accent: false,
  },
];

const ROLE_ORDER: Exclude<ExperienceRole, "generic">[] = ["photographer", "model", "artist"];

const ROLE_LABEL: Record<Exclude<ExperienceRole, "generic">, string> = {
  photographer: "PHOTOGRAPHER EXPERIENCE",
  model: "MODEL EXPERIENCE",
  artist: "ARTIST EXPERIENCE",
};

const ROLE_GRADIENT: Record<Exclude<ExperienceRole, "generic">, string> = {
  photographer: "from-primary/30 to-primary/10",
  model: "from-accent/25 to-primary/10",
  artist: "from-primary/20 to-accent/10",
};

function classifyExperienceItem(item: Record<string, unknown>): ExperienceRole {
  const parts = [
    item.title,
    item.role,
    item.name,
    item.subtitle,
    item.company,
    item.text,
    item.description,
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());

  const haystack = parts.join(" ");
  if (!haystack) return "generic";

  const has = (words: string[]) => words.some((w) => haystack.includes(w));

  // Priority: model > photographer > artist
  if (has(["model", "runway", "catwalk", "campaign", "fashion show", "fashionweek", "lookbook"]))
    return "model";
  if (
    has([
      "photographer",
      "photography",
      "photo shoot",
      "photoshoot",
      "editorial shoot",
      "wedding shoot",
      "portrait session",
      "studio lighting",
      "camera",
    ])
  )
    return "photographer";
  if (
    has([
      "artist",
      "painter",
      "sculptor",
      "installation",
      "gallery",
      "exhibition",
      "solo show",
      "group show",
      "mural",
      "illustration",
    ])
  )
    return "artist";

  return "generic";
}

function extractDates(raw: string): string {
  if (!raw) return "";
  const m = raw.match(/\b(19|20)\d{2}\b(?:\s*[–—-]\s*\b(19|20)\d{2}\b|\s*–\s*present|\s*to\s*present)?/i);
  return m ? m[0] : "";
}

function buildExperienceEntries(expBlock: ResumeBlock | null | undefined): ExperienceEntry[] {
  const items = getBlockItems(expBlock ?? undefined) as Record<string, unknown>[];
  return items.map((item) => {
    const title =
      (item.title as string) ??
      (item.role as string) ??
      (item.name as string) ??
      "Untitled role";
    const subtitle =
      (item.subtitle as string) ??
      (item.company as string) ??
      (item.dates as string) ??
      "";
    const description =
      (item.text as string) ??
      (item.description as string) ??
      "";
    const rawDates =
      (item.dates as string) ??
      subtitle;
    const dates = extractDates(rawDates);
    const role = classifyExperienceItem(item);

    return {
      title,
      roleLabel: subtitle,
      dates,
      description,
      role,
    };
  });
}

interface ExperienceGroupProps {
  heading: string;
  gradient: string;
  entries: ExperienceEntry[];
}

function ExperienceGroup({ heading, gradient, entries }: ExperienceGroupProps) {
  if (entries.length === 0) return null;

  return (
    <section className="mt-16">
      <header className="mb-6 flex items-baseline justify-between gap-4">
        <h3
          className="text-xs tracking-[0.2em] text-muted-foreground font-semibold uppercase"
          style={{ letterSpacing: "0.2em" }}
        >
          {heading}
        </h3>
        <span className="h-px flex-1 bg-border" />
      </header>
      <div className="grid md:grid-cols-2 gap-6">
        {entries.map((entry, i) => (
          <motion.div
            key={`${entry.title}-${i}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 2) * 0.1 }}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-border cursor-default bg-gradient-to-br"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} group-hover:scale-105 transition-transform duration-500`} />
            <div className="absolute inset-0 flex flex-col justify-between p-8">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] tracking-[0.25em] text-muted-foreground font-semibold uppercase">
                    {entry.roleLabel || heading}
                  </p>
                  {entry.dates && (
                    <p className="text-[11px] text-muted-foreground/80">
                      {entry.dates}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <h4
                  className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors"
                  style={{ fontFamily: "var(--font-display, inherit)" }}
                >
                  {entry.title}
                </h4>
                {entry.description && (
                  <p className="text-xs text-muted-foreground/90 leading-relaxed line-clamp-3">
                    {entry.description}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function TemplateStellarShowcase({
  basics,
  blocks,
}: {
  basics: ResumeBasics;
  blocks: ResumeBlock[];
}) {
  const name = (basics.name as string) || "Stellar Creative Studio";
  const headline =
    (basics.headline as string) ||
    "UNLEASHING BOUNDLESS CREATIVITY FOR YOUR BRAND";

  const expBlock = getBlockByType(blocks, "experience");
  const allEntries = buildExperienceEntries(expBlock);

  const grouped: Record<Exclude<ExperienceRole, "generic">, ExperienceEntry[]> = {
    photographer: [],
    model: [],
    artist: [],
  };

  allEntries.forEach((entry) => {
    if (entry.role === "generic") return;
    (grouped[entry.role as Exclude<ExperienceRole, "generic">] as ExperienceEntry[]).push(entry);
  });

  const hasAnyRole = ROLE_ORDER.some((r) => grouped[r].length > 0);

  return (
    <div className="min-h-full bg-background text-foreground font-sans antialiased">
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex flex-col justify-center px-6 md:px-12 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {/* Stats row */}
            <div className="flex justify-end gap-8 md:gap-12 mb-10">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-center"
                >
                  <span
                    className="text-3xl md:text-5xl font-bold text-primary"
                    style={{ fontFamily: "var(--font-display, inherit)" }}
                  >
                    {stat.number}
                  </span>
                  <p className="text-[10px] tracking-[0.15em] text-muted-foreground mt-1 whitespace-pre-line leading-tight font-semibold">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-3 max-w-[240px] leading-relaxed font-semibold"
            >
              {headline.toUpperCase()}
            </motion.p>

            {/* Studio / name */}
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="text-[11px] tracking-[0.25em] text-primary uppercase mb-6 font-semibold"
            >
              {name}
            </motion.p>

            {/* Giant headline */}
            <motion.h1
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(3rem,12vw,8rem)] font-black leading-[0.85] tracking-tight text-right"
              style={{ fontFamily: "var(--font-display, inherit)" }}
            >
              LIMITLESS
              <br />
              <span className="ml-8">CREATIVE</span>
              <br />
              SHOWCASE
            </motion.h1>
          </div>

          {/* Decorative gradient orb */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-3xl" />
        </section>

        {/* Services Preview */}
        <section className="px-6 md:px-12 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Left: Section title */}
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-6xl font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-display, inherit)" }}
                >
                  EXPLORE YOUR
                  <br />
                  VISUAL STORY
                </motion.h2>
              </div>

              {/* Right: Service cards */}
              <div className="flex flex-col gap-4">
                {services.map((service, i) => (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex min-h-[160px] flex-col justify-between rounded-2xl p-6 md:p-8 ${
                      service.accent
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border"
                    }`}
                  >
                    <h3
                      className="whitespace-pre-line text-lg md:text-xl font-bold leading-tight"
                      style={{ fontFamily: "var(--font-display, inherit)" }}
                    >
                      {service.title}
                    </h3>
                    <p
                      className={`mt-4 text-[10px] whitespace-pre-line text-right leading-tight font-semibold tracking-[0.15em] ${
                        service.accent ? "opacity-80" : "text-muted-foreground"
                      }`}
                    >
                      {service.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Experience-powered \"Selected Works\" */}
        <section className="bg-card px-6 md:px-12 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display, inherit)" }}
              >
                SELECTED
                <br />
                WORKS
              </motion.h2>
              <p className="max-w-sm text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                AUTOMATICALLY GROUPED FROM YOUR EXPERIENCE — PHOTOGRAPHER, MODEL,
                AND ARTIST SECTIONS ONLY APPEAR WHEN THEY EXIST IN YOUR RESUME.
              </p>
            </div>

            {hasAnyRole ? (
              ROLE_ORDER.map((role) => (
                <ExperienceGroup
                  key={role}
                  heading={ROLE_LABEL[role]}
                  gradient={ROLE_GRADIENT[role]}
                  entries={grouped[role]}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Add some experience entries to your resume to see this section
                come alive with categorized works.
              </p>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 md:px-12 py-20">
          <div className="mx-auto max-w-7xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-6 text-4xl md:text-7xl font-black tracking-tight"
              style={{ fontFamily: "var(--font-display, inherit)" }}
            >
              READY TO CURATE
              <br />
              YOUR NEXT{" "}
              <span className="text-primary">
                SHOWCASE
              </span>
              ?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mx-auto mb-4 max-w-xl text-sm text-muted-foreground"
            >
              Update your experience with modeling gigs, gallery exhibitions, and
              photography projects — this template will highlight them in a
              polished, studio-grade layout.
            </motion.p>
          </div>
        </section>
      </main>
    </div>
  );
}

