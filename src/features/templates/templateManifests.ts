/**
 * Template manifest type and hardcoded template list.
 * Used by Template Selection UI and registry.
 */

export interface TemplatePreview {
  kind: "gradient" | "image";
  value: string; // CSS gradient string or image URL
}

/** A field the template needs that isn't in a standard resume */
export interface TemplateExtraField {
  /** Key stored in basics (e.g. "birthYear") */
  key: string;
  /** Human-readable label shown in the Basics panel */
  label: string;
  /** Input placeholder */
  placeholder: string;
  /** Short description shown below the field */
  description: string;
  /** Input type: text | number | url */
  type?: "text" | "number" | "url";
}

export interface TemplateManifest {
  id: string;
  name: string;
  description: string;
  /** Style pill: Minimal, Modern, Creative, Academic */
  styleTag: string;
  categoryTags: string[];
  personaTags: string[];
  supportedBlocks: string[];
  sectionOrder: string[];
  preview: TemplatePreview;
  /** Extra basics fields this template requires beyond a standard resume */
  extraBasicsFields?: TemplateExtraField[];
}

/** Category chips for filter (include "All" as special) */
export const TEMPLATE_CATEGORIES = ["All", "Professional", "Creative", "Artist"] as const;

const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "additional",
];

export const TEMPLATE_MANIFESTS: TemplateManifest[] = [
  {
    id: "minimal-monochrome",
    name: "Minimal Monochrome",
    description: "Clean, professional portfolio with plenty of whitespace. Black, white, and a single accent. Ideal for corporate and formal roles.",
    styleTag: "Professional",
    categoryTags: ["All", "Professional"],
    personaTags: [],
    supportedBlocks: ["custom", "summary", "experience", "projects", "education", "skills", "certifications", "awards"],
    sectionOrder: DEFAULT_SECTION_ORDER,
    preview: { kind: "gradient", value: "linear-gradient(160deg, #0f0f0f 0%, #262626 40%, #404040 100%)" },
  },
  {
    id: "bold-gradient",
    name: "Bold Gradient",
    description: "Portfolio with bold gradient hero and card-style sections. Stands out for creative and design roles.",
    styleTag: "Creative",
    categoryTags: ["All", "Creative"],
    personaTags: [],
    supportedBlocks: ["custom", "summary", "experience", "projects", "education", "skills", "certifications", "awards"],
    sectionOrder: DEFAULT_SECTION_ORDER,
    preview: { kind: "gradient", value: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)" },
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Award-level cinematic portfolio. Fullscreen hero with animated orbs, horizontal work gallery, glass cards, and premium motion. Adapts to tech, creative, or hybrid profiles.",
    styleTag: "Creative",
    categoryTags: ["All", "Creative"],
    personaTags: ["tech", "creative", "hybrid"],
    supportedBlocks: ["custom", "summary", "experience", "projects", "education", "skills", "certifications", "awards"],
    sectionOrder: ["summary", "experience", "projects", "skills", "education", "additional"],
    preview: { kind: "gradient", value: "linear-gradient(160deg, #0a0a0f 0%, #1a0a2e 40%, #16213e 70%, #0f3460 100%)" },
  },
  {
    id: "artistry",
    name: "Artistry",
    description: "Fine-art gallery portfolio with floating artwork frames, crimson-and-gold palette, Playfair Display typography, and an elegant works timeline. Perfect for artists, photographers, and creatives.",
    styleTag: "Artist",
    categoryTags: ["All", "Creative", "Artist"],
    personaTags: ["artist", "photographer", "designer", "creative"],
    supportedBlocks: ["custom", "summary", "experience", "projects", "education", "skills"],
    sectionOrder: ["experience", "projects", "education", "skills"],
    preview: { kind: "gradient", value: "linear-gradient(160deg, hsl(20,30%,10%) 0%, hsl(30,25%,18%) 45%, hsl(4,60%,28%) 100%)" },
    extraBasicsFields: [
      {
        key: "birthYear",
        label: "Birth year",
        placeholder: "e.g. 1998",
        description: "Shown as 'Since [year]' — represents when your artistic journey began.",
        type: "number",
      },
      {
        key: "introLine",
        label: "Intro line",
        placeholder: "The Portfolio of",
        description: "Small line above your name on the hero (e.g. 'The Portfolio of').",
        type: "text",
      },
      {
        key: "tagline",
        label: "Tagline",
        placeholder: "Painter · Sculptor · Visionary",
        description: "Short descriptor shown below your name on the hero.",
        type: "text",
      },
      {
        key: "studioName",
        label: "Studio name",
        placeholder: "Heritage Art Studio",
        description: "Shown as a vertical side label on the hero section.",
        type: "text",
      },
      {
        key: "artistQuote",
        label: "Your quote",
        placeholder: "Art is not what you see, but what you make others see.",
        description: "A personal quote shown in the Works section.",
        type: "text",
      },
      {
        key: "heroBgImage",
        label: "Hero background image URL",
        placeholder: "https://…",
        description: "Full-page background image for the hero section. Paste a direct image URL.",
        type: "url",
      },
      {
        key: "instagram",
        label: "Instagram",
        placeholder: "https://instagram.com/yourhandle",
        description: "Shown in the Contact page of your portfolio.",
        type: "url",
      },
      {
        key: "behance",
        label: "Behance",
        placeholder: "https://behance.net/yourhandle",
        description: "Shown in the Contact page of your portfolio.",
        type: "url",
      },
    ],
  },
  {
    id: "creative-canvas",
    name: "Creative Canvas Collective",
    description:
      "Portfolio for photographers, models, and artists. Experience section shows only Photographer / Model / Artist subsections that match your resume (keyword-based). Clean timeline, masonry gallery, Cormorant + Space Grotesk.",
    styleTag: "Artist",
    categoryTags: ["All", "Creative", "Artist"],
    personaTags: ["artist", "photographer", "model", "creative"],
    supportedBlocks: ["custom", "summary", "experience", "projects", "education", "skills"],
    sectionOrder: ["experience", "projects", "skills", "education"],
    preview: {
      kind: "gradient",
      value: "linear-gradient(160deg, hsl(30,15%,88%) 0%, hsl(30,12%,82%) 50%, hsl(0,0%,75%) 100%)",
    },
  },
  {
    id: "stellar-showcase",
    name: "Stellar Showcase",
    description:
      "High-impact studio portfolio inspired by Stellar Showcase — bold hero, services overview, and experience-driven selected works for photographers, models, and artists.",
    styleTag: "Artist",
    categoryTags: ["All", "Creative", "Artist"],
    personaTags: ["artist", "photographer", "model", "creative"],
    supportedBlocks: ["custom", "summary", "experience", "projects", "education", "skills"],
    sectionOrder: ["experience", "projects", "skills", "education"],
    preview: {
      kind: "gradient",
      value: "linear-gradient(145deg, #0b1120 0%, #1e293b 35%, #4f46e5 70%, #a855f7 100%)",
    },
  },
];
