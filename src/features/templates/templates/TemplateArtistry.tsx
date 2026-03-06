/**
 * Artistry template — faithful port of github.com/Hasti004/artistry-unleashed
 * Multi-page (Home / Works / About / Contact) via internal page state.
 * ALL positioning/sizing use inline styles — Tailwind arbitrary values are NOT
 * compiled in resume2web's build so they would silently do nothing.
 */

import { motion } from "framer-motion";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import type { ResumeBasics, ResumeBlock } from "@/lib/resumeRepo";
import { getBlockByType, getBlockItems, getBlockTitle } from "./portfolioData";

// ─── design tokens (exact values from original index.css) ────────────────────
const C = {
  bg:        "hsl(30, 25%, 95%)",
  espresso:  "hsl(20, 30%, 15%)",
  primary:   "hsl(4, 72%, 45%)",
  fg:        "hsl(20, 20%, 12%)",
  muted:     "hsl(20, 10%, 45%)",
  border:    "hsl(30, 15%, 82%)",
  card:      "hsl(30, 20%, 92%)",
  cream:     "hsl(30, 25%, 95%)",
};

// ─── injected CSS (scoped, fonts + gallery-frame + marquee + resets) ─────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800;0,900;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

  .artistry-root {
    font-family: 'Space Grotesk', sans-serif;
    background: hsl(30, 25%, 95%);
    color: hsl(20, 20%, 12%);
    container-type: inline-size;
    container-name: artistry;
  }

  /* ── reset browser defaults that leak in from resume2web global CSS ── */
  .artistry-root button {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    background: transparent;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }
  .artistry-root a {
    text-decoration: none;
  }
  .artistry-root *:focus {
    outline: none !important;
    box-shadow: none !important;
  }

  /* ── gallery frame (verbatim from original) ── */
  .artistry-root .gallery-frame {
    border: 6px solid hsl(38, 45%, 42%);
    outline: 3px solid hsl(38, 50%, 30%);
    outline-offset: -9px;
    box-shadow:
      inset 0 0 0 1px hsl(38, 60%, 55%),
      inset 0 0 20px rgba(0,0,0,.35),
      0 4px 12px rgba(0,0,0,.3),
      0 12px 40px -10px rgba(0,0,0,.5);
    background: linear-gradient(135deg,hsl(38,40%,35%),hsl(38,45%,42%),hsl(38,40%,35%));
    padding: 4px;
    position: relative;
    overflow: hidden;
  }

  /* ── marquee animation ── */
  .artistry-root .art-marquee {
    display: flex;
    gap: 1.5rem;
    width: max-content;
    animation: art-marquee-scroll 20s linear infinite;
  }
  @keyframes art-marquee-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .artistry-root .art-marquee-slow {
    display: flex;
    gap: 2rem;
    width: max-content;
    animation: art-marquee-scroll 28s linear infinite;
  }

  /* ── hover helpers that can't be inline ── */
  .artistry-root .hover-primary:hover  { color: hsl(4, 72%, 45%) !important; }
  .artistry-root .hover-fg:hover       { color: hsl(20, 20%, 12%) !important; }
  .artistry-root .hover-scale:hover img { transform: scale(1.1); }
  .artistry-root .art-exhibit-card:hover {
    border-color: hsl(4, 72%, 45%) !important;
    background: hsl(30, 20%, 92%) !important;
  }
  .artistry-root .art-exhibit-card:hover p { color: hsl(4, 72%, 45%) !important; }

  /* ── Responsive: side labels hidden on narrow containers ── */
  @container artistry (max-width: 900px) {
    .artistry-root .art-side-label { display: none !important; }
    .artistry-root .art-frame      { display: none !important; }
  }

  /* ── Responsive: nav links hidden on very narrow containers ── */
  @container artistry (max-width: 560px) {
    .artistry-root .art-nav-links  { display: none !important; }
    .artistry-root .art-tagline    { font-size: 0.65rem !important; }
    .artistry-root .art-timeline-row { flex-direction: column !important; gap: 0.5rem !important; }
  }
`;

// ─── original repo assets served via GitHub raw CDN ──────────────────────────
const RAW = "https://raw.githubusercontent.com/Hasti004/artistry-unleashed/main/src/assets";
export const ARTISTRY_HERO_BG      = `${RAW}/hero-bg.jpg`;
export const ARTISTRY_PORTRAIT     = `${RAW}/artist-portrait.jpg`;
const STOCK_IMAGES = [
  `${RAW}/artwork-1.jpg`,
  `${RAW}/artwork-2.jpg`,
  `${RAW}/artwork-3.jpg`,
  `${RAW}/artwork-4.jpg`,
  `${RAW}/artwork-5.jpg`,
  // extra Unsplash fallbacks so the marquee (12 slots) is always fully populated
  "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=500&q=75",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=500&q=75",
  "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&w=500&q=75",
  "https://images.unsplash.com/photo-1578301978018-3005759f48f7?auto=format&fit=crop&w=500&q=75",
  "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=500&q=75",
  "https://images.unsplash.com/photo-1574182245530-967d9b3831af?auto=format&fit=crop&w=500&q=75",
  "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=500&q=75",
];

function ArtImg({ src, idx = 0, style = {} }: { src?: string; idx?: number; style?: React.CSSProperties }) {
  const imgSrc = src || STOCK_IMAGES[idx % STOCK_IMAGES.length];
  return <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none", ...style }} />;
}

// ─── hardcoded template defaults (kept exactly as original) ──────────────────
const DEFAULT_TIMELINE = [
  { year: "2022 — Present", title: "Master of Dimensions",  description: "Exploring the boundaries between physical and digital art forms, pushing into immersive installations and mixed reality experiences." },
  { year: "2018 — 2022",   title: "The Crimson Period",    description: "A bold exploration of color theory and emotional resonance through abstract expressionism and large-scale canvases." },
  { year: "2012 — 2018",   title: "Classical Revival",     description: "Returning to renaissance techniques with a contemporary lens, creating haunting portraits and dramatic landscapes." },
  { year: "2005 — 2012",   title: "Dreamscapes",           description: "Surrealist explorations blending architecture, nature, and imagination into fantastical worlds." },
  { year: "1998 — 2005",   title: "Origins",               description: "Early works exploring traditional oil painting, developing foundational techniques and discovering a unique visual language." },
];
const DEFAULT_EDUCATION = [
  { year: "1994 — 1998", institution: "Royal Academy of Fine Arts",  degree: "Master of Fine Arts",                  location: "Florence, Italy" },
  { year: "1990 — 1994", institution: "School of Visual Arts",       degree: "Bachelor of Arts in Painting",         location: "New York, USA" },
  { year: "1989",        institution: "Atelier de Paris",            degree: "Summer Intensive — Classical Drawing", location: "Paris, France" },
];
const DEFAULT_EXHIBITIONS = [
  "Venice Biennale 2022","MOMA New York 2020","Tate Modern London 2019",
  "Louvre Paris 2017","Guggenheim Bilbao 2015","Art Basel 2014",
];

type Page = "home" | "works" | "about" | "contact";

// ═══════════════════════════════════════════════════════════════════════════════
export function TemplateArtistry({ basics, blocks }: { basics: ResumeBasics; blocks: ResumeBlock[] }) {
  const [page, setPage] = useState<Page>("home");
  const [, setMenuOpen] = useState(false);

  const rawName   = (basics.name     as string) || "Arturo Morales";
  const parts     = rawName.trim().split(/\s+/);
  const firstName = parts[0] ?? "Arturo";
  const lastName  = parts.slice(1).join(" ") || "Morales";

  const email       = (basics.email       as string) || "hello@arturomorales.art";
  const phone       = (basics.phone       as string) || "+34 612 345 678";
  const location    = (basics.location    as string) || "Barcelona, Spain";
  const heroImage   = (basics.heroImage   as string) || ARTISTRY_PORTRAIT;
  const heroBgImage = (basics.heroBgImage as string) || ARTISTRY_HERO_BG;
  const instagram   = (basics.instagram   as string) || "";
  const behance     = (basics.behance     as string) || "";
  const sinceYear   = (basics.birthYear   as string) || "1998";
  const introLine   = (basics.introLine   as string) || "The Portfolio of";
  const tagline     = (basics.tagline     as string) || "Painter · Sculptor · Visionary";
  const studioName  = (basics.studioName  as string) || "Heritage Art Studio";
  const artistQuote = (basics.artistQuote as string) || "Art is not what you see, but what you make others see.";

  const expBlock  = getBlockByType(blocks, "experience");
  const eduBlock  = getBlockByType(blocks, "education");
  const projBlock = getBlockByType(blocks, "projects");
  const expItems  = getBlockItems(expBlock)  as Record<string, unknown>[];
  const eduItems  = getBlockItems(eduBlock);
  const projItems = getBlockItems(projBlock) as Record<string, unknown>[];

  // artwork images: collect image + image2 from each exp/proj item
  const artPool: (string | undefined)[] = [...projItems, ...expItems]
    .flatMap((it) => [it.image as string | undefined, it.image2 as string | undefined]);

  const go = (p: Page) => { setPage(p); setMenuOpen(false); };

  const navItems: { label: string; page: Page }[] = [
    { label: "Home",    page: "home" },
    { label: "Works",   page: "works" },
    { label: "About",   page: "about" },
    { label: "Contact", page: "contact" },
  ];

  const F = { // nav text styles
    base:   { color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", textTransform: "uppercase" as const, letterSpacing: "0.2em", fontFamily: "'Space Grotesk',sans-serif", transition: "opacity 150ms" },
    active: { color: "white" },
  };

  return (
    <div className="artistry-root" style={{ position: "relative" }}>
      <style>{CSS}</style>

      {/* ── Navigation ── */}
      <nav style={{ position: "sticky", top: 0, left: 0, right: 0, zIndex: 50, mixBlendMode: "difference" as const }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 2rem" }}>
          <button onClick={() => go("home")}
            style={{ color: "white", fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {firstName}
          </button>
          <div className="art-nav-links" style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
            {navItems.map((item) => (
              <button key={item.page} onClick={() => go(item.page)}
                style={{ ...F.base, ...(page === item.page ? F.active : {}) }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Page content ── */}
      {page === "home"    && <HomePage    firstName={firstName} heroBgImage={heroBgImage} artPool={artPool} sinceYear={sinceYear} introLine={introLine} tagline={tagline} studioName={studioName} artistQuote={artistQuote} onWorks={() => go("works")} />}
      {page === "works"   && <WorksPage   expItems={expItems} artPool={artPool} />}
      {page === "about"   && <AboutPage   firstName={firstName} lastName={lastName} heroImage={heroImage} eduItems={eduItems} projItems={projItems} projBlockTitle={getBlockTitle(projBlock)} artPool={artPool} />}
      {page === "contact" && <ContactPage email={email} phone={phone} location={location} />}

      {/* ── Footer (on every page) ── */}
      <footer style={{ padding: "4rem 2rem", background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.5rem" }}>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.25rem", fontWeight: 700 }}>{firstName}</p>
          <div style={{ display: "flex", gap: "2rem" }}>
            {[
              { label: "Instagram", url: instagram },
              { label: "Behance",   url: behance },
              { label: "Gallery",   url: "" },
            ].map(({ label, url }) => (
              url
                ? <a key={label} href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
                    className="hover-primary"
                    style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: C.muted, transition: "color 200ms" }}>
                    {label}
                  </a>
                : <span key={label} className="hover-primary"
                    style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: C.muted, cursor: "pointer", transition: "color 200ms" }}>
                    {label}
                  </span>
            ))}
          </div>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", color: C.muted }}>
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function HomePage({ firstName: _firstName, heroBgImage, artPool, sinceYear, introLine, tagline, studioName, artistQuote, onWorks }: {
  firstName: string; heroBgImage: string;
  artPool: (string | undefined)[];
  sinceYear: string; introLine: string; tagline: string; studioName: string; artistQuote: string;
  onWorks: () => void;
}) {
  return (
    <div style={{ position: "relative", overflow: "hidden" }}>

      {/* ── Hero Section ── */}
      <section style={{ position: "relative", minHeight: "780px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>

        {/* Background */}
        <div style={{ position: "absolute", inset: 0 }}>
          <img src={heroBgImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(28,17,10,0.55)" }} />
        </div>

        {/* Floating artwork frame 1 — top-20 left-[5%] w-36 h-48 */}
        <motion.div className="gallery-frame art-frame"
          style={{ position: "absolute", top: "5rem", left: "5%", width: "9rem", height: "12rem", opacity: 0.8, cursor: "grab", zIndex: 20 }}
          drag dragMomentum={false}
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 0.8, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          whileDrag={{ scale: 1.08, zIndex: 50 }}>
          <ArtImg src={artPool[0]} idx={0} />
        </motion.div>

        {/* Floating artwork frame 2 — bottom-32 right-[8%] w-44 h-36 */}
        <motion.div className="gallery-frame art-frame"
          style={{ position: "absolute", bottom: "8rem", right: "8%", width: "11rem", height: "9rem", opacity: 0.7, cursor: "grab", zIndex: 20 }}
          drag dragMomentum={false}
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 0.7, y: 0 }}
          transition={{ delay: 1.2, duration: 1 }}
          whileDrag={{ scale: 1.08, zIndex: 50 }}>
          <ArtImg src={artPool[1]} idx={1} />
        </motion.div>

        {/* Floating artwork frame 3 — top-40 right-[15%] w-28 h-36 */}
        <motion.div className="gallery-frame art-frame"
          style={{ position: "absolute", top: "10rem", right: "15%", width: "7rem", height: "9rem", opacity: 0.6, cursor: "grab", zIndex: 20 }}
          drag dragMomentum={false}
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          whileDrag={{ scale: 1.08, zIndex: 50 }}>
          <ArtImg src={artPool[2]} idx={2} />
        </motion.div>

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 4rem", width: "100%", maxWidth: "100%" }}>
          <motion.p
            style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.125rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(248,242,234,0.7)", marginBottom: "1.5rem" }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}>
            {introLine}
          </motion.p>

          <motion.h1
            className="art-hero-title"
            style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, lineHeight: 0.85, letterSpacing: "-0.02em", color: "hsl(30,25%,95%)", fontSize: "clamp(2.5rem, 12.5cqw, 9.5rem)", marginBottom: "2rem" }}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}>
            THE ART
            <br />
            <span style={{ WebkitTextStroke: "2px hsl(30,25%,95%)", color: "transparent" }}>THAT</span>
            {" "}SPEAKS
          </motion.h1>

          <motion.p
            className="art-tagline"
            style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.875rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(248,242,234,0.6)", marginBottom: "3rem" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}>
            {tagline}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }}>
            <button onClick={onWorks}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "hsl(30,25%,95%)", border: "1px solid rgba(248,242,234,0.3)", padding: "1rem 2rem", background: "transparent", transition: "background 200ms" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,242,234,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              View Collection <ArrowRight style={{ width: "1rem", height: "1rem" }} />
            </button>
          </motion.div>
        </div>

        {/* Side label left */}
        <motion.div className="art-side-label" style={{ position: "absolute", left: "2rem", top: "50%", transform: "translateY(-50%)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.625rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(248,242,234,0.4)", transform: "rotate(-90deg)", whiteSpace: "nowrap" }}>
            {studioName}
          </p>
        </motion.div>

        {/* Side label right */}
        <motion.div className="art-side-label" style={{ position: "absolute", right: "2rem", top: "50%", transform: "translateY(-50%)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.625rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(248,242,234,0.4)", transform: "rotate(90deg)", whiteSpace: "nowrap" }}>
            Since {sinceYear}
          </p>
        </motion.div>
      </section>

      {/* ── Featured Works Strip ── */}
      <section style={{ padding: "6rem 0", background: C.bg }}>
        <div style={{ padding: "0 2rem", marginBottom: "3rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "clamp(2rem, 5.5cqw, 4.5rem)", color: C.fg }}>
            Selected<br />
            <span style={{ color: C.primary }}>Works</span>
          </h2>
        </div>

        <div style={{ overflow: "hidden" }}>
          <div className="art-marquee">
            {/* 12 items = seamless loop (6 + 6 copies) */}
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="hover-scale"
                style={{ width: "18rem", height: "24rem", flexShrink: 0, overflow: "hidden", cursor: "pointer" }}>
                <img
                  src={artPool[i % Math.max(artPool.length, 1)] || STOCK_IMAGES[i % STOCK_IMAGES.length]}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 700ms" }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "3rem 2rem 0", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onWorks} className="hover-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", color: C.fg, transition: "color 200ms" }}>
            View all works <ArrowRight style={{ width: "1rem", height: "1rem" }} />
          </button>
        </div>
      </section>

      {/* ── Quote Section (kept exactly) ── */}
      <section style={{ padding: "8rem 0", background: C.espresso }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto", textAlign: "center", padding: "0 2rem" }}>
          <motion.blockquote
            className="art-quote"
            style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(1.5rem, 3cqw, 2.5rem)", fontStyle: "italic", color: "rgba(248,242,234,0.9)", lineHeight: 1.5 }}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 1 }}>
            "{artistQuote}"
          </motion.blockquote>
          <motion.p
            style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(248,242,234,0.4)", marginTop: "2rem" }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.8 }}>
            — Edgar Degas
          </motion.p>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
// split "Company Name — 2022–2024" → { company, dates }
function splitSubtitle(raw: string): { company: string; dates: string } {
  // detect year-like patterns: e.g. "2022", "Jun 2022", "2022 – 2024"
  const datePattern = /(\d{4}\s*[–—-]\s*(?:\d{4}|present|now)?|\w+\s+\d{4}\s*[–—-][^,]*|\d{4})/i;
  const match = raw.match(datePattern);
  if (!match) return { company: raw.trim(), dates: "" };
  const dates = match[0].trim();
  const company = raw.replace(match[0], "").replace(/\s*[–—-]\s*$/, "").replace(/^\s*[–—-]\s*/, "").trim();
  return { company: company || raw.trim(), dates };
}

function WorksPage({ expItems, artPool }: { expItems: Record<string, unknown>[]; artPool: (string | undefined)[] }) {
  const timeline = expItems.length > 0
    ? expItems.map((it, i) => {
        const rawSubtitle = (it.subtitle as string) ?? (it.company as string) ?? (it.dates as string) ?? "";
        const { company, dates } = splitSubtitle(rawSubtitle);
        const userImg0 = (it.image  as string | undefined);
        const userImg1 = (it.image2 as string | undefined);
        return {
          dates,
          company,
          title:       (it.title as string) ?? (it.role as string) ?? "Untitled",
          description: (it.text as string)  ?? (it.description as string) ?? "",
          a0: userImg0 ?? artPool[i * 2],
          a1: userImg1 ?? artPool[i * 2 + 1],
          // true only when the user explicitly provided an image (not a pool/stock fallback)
          hasImg0: !!userImg0,
          hasImg1: !!userImg1,
        };
      })
    : DEFAULT_TIMELINE.map((t, i) => ({
        dates: t.year,
        company: "",
        title: t.title,
        description: t.description,
        a0: artPool[i * 2]  ?? STOCK_IMAGES[i * 2       % STOCK_IMAGES.length],
        a1: artPool[i * 2 + 1] ?? STOCK_IMAGES[(i * 2 + 1) % STOCK_IMAGES.length],
        hasImg0: true,
        hasImg1: true,
      }));

  const marqueeImgs = artPool.length >= 5
    ? [...artPool, ...artPool].slice(0, 10)
    : Array.from({ length: 10 }, () => undefined as string | undefined);

  return (
    <div style={{ minHeight: "900px", background: C.bg, paddingTop: "6rem", overflow: "hidden" }}>

      {/* Giant Title with floating frames */}
      <section style={{ position: "relative", padding: "5rem 2rem" }}>
        <motion.h1
          className="art-works-title"
          style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, lineHeight: 0.8, letterSpacing: "-0.02em", color: C.primary, fontSize: "clamp(3rem, 13cqw, 13rem)", textAlign: "center" }}
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}>
          WORKS &<br />
          <span style={{ WebkitTextStroke: "2px hsl(4,72%,45%)", color: "transparent" }}>EXPERIENCE</span>
        </motion.h1>

        {/* Floating frames — exact original positions */}
        {([
          { top: "2.5rem",  left: "5%",   w: "8rem",  h: "10rem", op: 0.7, ri: 0,  ro: { i: { opacity:0,scale:0.5,rotate:-15 }, a: { opacity:0.7,scale:1,rotate:-8  }, d: 0.5 } },
          { top: "4rem",    right: "8%",  w: "7rem",  h: "9rem",  op: 0.6, ri: 1,  ro: { i: { opacity:0,scale:0.5,rotate:20  }, a: { opacity:0.6,scale:1,rotate:6   }, d: 0.8 } },
          { bottom:"2.5rem",left: "15%",  w: "6rem",  h: "8rem",  op: 0.5, ri: 2,  ro: { i: { opacity:0,scale:0.5,rotate:10  }, a: { opacity:0.5,scale:1,rotate:4   }, d: 1.0 } },
          { bottom:"0",     right: "12%", w: "9rem",  h: "7rem",  op: 0.65,ri: 3,  ro: { i: { opacity:0,scale:0.5,rotate:-10 }, a: { opacity:0.65,scale:1,rotate:-3 }, d: 1.2 } },
        ] as const).map((f, fi) => (
          <motion.div key={fi} className="gallery-frame"
            style={{ position: "absolute", width: f.w, height: f.h, ...(f as Record<string,unknown>) }}
            initial={f.ro.i} animate={f.ro.a}
            transition={{ delay: f.ro.d, duration: 1.2 }}>
            <ArtImg src={artPool[f.ri]} idx={f.ri} />
          </motion.div>
        ))}
      </section>

      {/* Timeline */}
      <section style={{ position: "relative", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", position: "relative" }}>
          {/* Vertical line */}
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: C.border }} />

          {timeline.map((item, index) => (
            <motion.div key={index}
              style={{ position: "relative", marginBottom: "8rem" }}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.1 }}>

              {/* ── Center line: dot + date ── */}
              <div style={{
                position: "absolute", left: "50%", top: 0,
                transform: "translateX(-50%)",
                display: "flex", flexDirection: "column", alignItems: "center",
                zIndex: 2, gap: "0.4rem",
              }}>
                {/* Dot */}
                <div style={{
                  width: "0.65rem", height: "0.65rem", borderRadius: "50%",
                  background: C.primary, border: `2px solid ${C.bg}`,
                  boxShadow: `0 0 0 2px ${C.primary}`,
                }} />
                {/* Date badge */}
                {item.dates && (
                  <span style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: "0.62rem", textTransform: "uppercase",
                    letterSpacing: "0.12em", color: C.cream,
                    background: C.primary,
                    padding: "0.25rem 0.65rem",
                    whiteSpace: "nowrap",
                  }}>
                    {item.dates}
                  </span>
                )}
              </div>

              {/* ── Two-column grid (fixed: LEFT = company+photos, RIGHT = title+desc) ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", paddingTop: "1.5rem" }}>

                {/* LEFT column: company label (right-aligned, hugging the line) + photos */}
                <div style={{ paddingRight: "2.5rem", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "1.25rem" }}>
                  {item.company && (
                    <p style={{
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontSize: "0.68rem", textTransform: "uppercase",
                      letterSpacing: "0.18em", color: C.primary,
                      borderBottom: `1px solid ${C.primary}`,
                      paddingBottom: "0.4rem", textAlign: "right",
                      width: "100%",
                    }}>
                      {item.company}
                    </p>
                  )}
                  {/* Photos below company label — only shown when user provided images */}
                  {(item.hasImg0 || item.hasImg1) && (
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", alignItems: "flex-start" }}>
                      {item.hasImg0 && (
                        <motion.div className="gallery-frame"
                          style={{ width: "9rem", height: "11rem", rotate: "-5deg", flexShrink: 0 } as React.CSSProperties}
                          whileHover={{ scale: 1.05, rotate: 0 }}>
                          <ArtImg src={item.a0} idx={index * 2} />
                        </motion.div>
                      )}
                      {item.hasImg1 && (
                        <motion.div className="gallery-frame"
                          style={{ width: "8rem", height: "10rem", marginTop: item.hasImg0 ? "1.5rem" : 0, rotate: "3deg", flexShrink: 0 } as React.CSSProperties}
                          whileHover={{ scale: 1.05, rotate: 0 }}>
                          <ArtImg src={item.a1} idx={index * 2 + 1} />
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT column: job title + description */}
                <div style={{ paddingLeft: "2.5rem" }}>
                  <h3 style={{
                    fontFamily: "'Playfair Display',serif", fontWeight: 700,
                    fontSize: "clamp(1.4rem, 3.2cqw, 2.4rem)",
                    color: C.fg, marginBottom: "1rem", lineHeight: 1.15,
                  }}>
                    {item.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    color: C.muted, lineHeight: 1.7, fontSize: "0.9rem",
                  }}>
                    {item.description}
                  </p>
                </div>

              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom marquee */}
      <section style={{ padding: "4rem 0", background: C.espresso, overflow: "hidden" }}>
        <div className="art-marquee-slow">
          {marqueeImgs.map((src, i) => (
            <div key={i} style={{ width: "14rem", height: "18rem", flexShrink: 0, overflow: "hidden", opacity: 0.8, transition: "opacity 200ms" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = "1")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.opacity = "0.8")}>
              <img
                src={src || STOCK_IMAGES[i % STOCK_IMAGES.length]}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ABOUT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function AboutPage({ firstName, lastName, heroImage, eduItems, projItems, projBlockTitle, artPool }: {
  firstName: string; lastName: string; heroImage: string;
  eduItems: unknown[]; projItems: Record<string, unknown>[];
  projBlockTitle: string; artPool: (string | undefined)[];
}) {
  const education = eduItems.length > 0
    ? eduItems.filter((it) => typeof it === "object" && it !== null).map((it) => {
        const e = it as Record<string, unknown>;
        return {
          year:        (e.dates as string) ?? [e.fromYear, e.toYear].filter(Boolean).join(" — ") ?? "",
          institution: (e.name as string)  ?? (e.title as string) ?? "",
          degree:      (e.degree as string) ?? [e.degreeType, e.degreeName].filter(Boolean).join(" ") ?? "",
          location:    (e.location as string) ?? "",
        };
      })
    : DEFAULT_EDUCATION;

  const exhibitions = projItems.length > 0
    ? projItems.map((it) => (it.title as string) ?? (it.name as string) ?? "").filter(Boolean)
    : DEFAULT_EXHIBITIONS;

  const exhibLabel = projItems.length > 0 ? projBlockTitle : "Exhibitions";

  return (
    <div style={{ minHeight: "900px", background: C.bg, paddingTop: "6rem" }}>

      {/* Hero grid */}
      <section style={{ padding: "5rem 2rem" }}>
        <div className="art-two-col" style={{ maxWidth: "72rem", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: "4rem", alignItems: "center" }}>
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.3em", color: C.muted, marginBottom: "1rem" }}>
              About the Artist
            </p>
            <h1 className="art-about-title" style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "clamp(2rem, 5cqw, 4.5rem)", color: C.fg, lineHeight: 0.9, marginBottom: "2rem" }}>
              {firstName}<br />
              <span style={{ color: C.primary }}>{lastName}</span>
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.25rem", color: C.muted, lineHeight: 1.75, marginBottom: "1.5rem" }}>
              Born in 1972 in Barcelona, {firstName} {lastName} is a contemporary painter and sculptor whose work bridges the classical tradition with modern abstraction. Their pieces have been exhibited in over 40 countries and are held in permanent collections across the world's most prestigious institutions.
            </p>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.875rem", color: C.muted, lineHeight: 1.7 }}>
              Their artistic philosophy centers on the belief that art should provoke dialogue between the past and present, creating emotional resonance through bold composition, rich color theory, and meticulous craftsmanship.
            </p>
          </motion.div>

          <motion.div style={{ position: "relative" }}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}>
            <div className="gallery-frame" style={{ overflow: "hidden" }}>
              <img
                src={heroImage || STOCK_IMAGES[0]}
                alt={`${firstName} ${lastName}`}
                style={{ width: "100%", height: heroImage ? "auto" : "30rem", objectFit: "cover", display: "block" }}
              />
            </div>
            <motion.div className="gallery-frame"
              style={{ position: "absolute", bottom: "-2rem", left: "-2rem", width: "8rem", height: "10rem", overflow: "hidden" }}
              initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 1 }}>
              <ArtImg src={artPool[3]} idx={3} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Education */}
      <section style={{ padding: "6rem 2rem", background: C.espresso }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <motion.h2
            style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "clamp(1.75rem, 4cqw, 3.5rem)", color: C.cream, marginBottom: "4rem" }}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Education
          </motion.h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
            {education.map((item, i) => (
              <motion.div key={i}
                style={{ borderBottom: "1px solid rgba(248,242,234,0.1)", paddingBottom: "2rem" }}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.5rem", color: C.cream }}>
                    {item.institution}
                  </h3>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(248,242,234,0.4)" }}>
                    {item.year}
                  </span>
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.125rem", color: "rgba(248,242,234,0.7)" }}>{item.degree}</p>
                {item.location && <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(248,242,234,0.4)", marginTop: "0.25rem" }}>{item.location}</p>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Exhibitions */}
      <section style={{ padding: "6rem 2rem", background: C.bg }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <motion.h2
            style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "clamp(1.75rem, 4cqw, 3.5rem)", color: C.fg, marginBottom: "4rem" }}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Notable <span style={{ color: C.primary }}>{exhibLabel}</span>
          </motion.h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {exhibitions.map((item, i) => (
              <motion.div key={i} className="art-exhibit-card"
                style={{ border: `1px solid ${C.border}`, padding: "1.5rem", cursor: "pointer", transition: "border-color 200ms, background 200ms" }}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: "1.125rem", color: C.fg, transition: "color 200ms" }}>
                  {item}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function ContactPage({ email, phone, location }: { email: string; phone: string; location: string }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  return (
    <div style={{ minHeight: "900px", background: C.bg, paddingTop: "6rem" }}>
      <section style={{ padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
            style={{ marginBottom: "5rem" }}>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.3em", color: C.muted, marginBottom: "1rem" }}>
              Get in Touch
            </p>
            <h1 className="art-contact-title" style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, lineHeight: 0.85, letterSpacing: "-0.02em", color: C.primary, fontSize: "clamp(2.5rem, 8cqw, 8rem)" }}>
              LET'S<br />
              <span style={{ WebkitTextStroke: "2px hsl(4,72%,45%)", color: "transparent" }}>CREATE</span>
            </h1>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem" }}>
            {/* Info */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
              style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.25rem", color: C.muted, lineHeight: 1.75 }}>
                Whether you're interested in commissioning a piece, inquiring about an exhibition, or simply want to discuss the beauty of art — I'd love to hear from you.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {([
                  { Icon: Mail,   label: "Email",  value: email },
                  { Icon: MapPin, label: "Studio", value: location },
                  { Icon: Phone,  label: "Phone",  value: phone },
                ] as const).map(({ Icon, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "2.5rem", height: "2.5rem", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: "1rem", height: "1rem", color: C.primary }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: C.muted }}>{label}</p>
                      <p style={{ fontFamily: "'Space Grotesk',sans-serif", color: C.fg }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Form */}
            <motion.form onSubmit={(e) => e.preventDefault()}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {(["name","email","subject"] as const).map((field) => (
                <div key={field}>
                  <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: C.muted, display: "block", marginBottom: "0.5rem" }}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input type={field === "email" ? "email" : "text"} value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    style={{ width: "100%", background: "transparent", borderBottom: `1px solid ${C.border}`, borderTop: "none", borderLeft: "none", borderRight: "none", padding: "0.75rem 0", fontFamily: "'Space Grotesk',sans-serif", color: C.fg, outline: "none" }} />
                </div>
              ))}
              <div>
                <label style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.15em", color: C.muted, display: "block", marginBottom: "0.5rem" }}>Message</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5} style={{ width: "100%", background: "transparent", borderBottom: `1px solid ${C.border}`, borderTop: "none", borderLeft: "none", borderRight: "none", padding: "0.75rem 0", fontFamily: "'Space Grotesk',sans-serif", color: C.fg, outline: "none", resize: "none" }} />
              </div>
              <button type="submit"
                style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", background: C.primary, color: C.cream, padding: "1rem 2.5rem", alignSelf: "flex-start", marginTop: "1rem", transition: "background 200ms" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.fg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.primary)}>
                Send Message
              </button>
            </motion.form>
          </div>
        </div>
      </section>
    </div>
  );
}
