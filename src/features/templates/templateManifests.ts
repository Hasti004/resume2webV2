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
    extraBasicsFields: [
      {
        key: "heroHeading",
        label: "Hero heading",
        placeholder: "Where vision meets the frame",
        description: "The big heading on the home page hero. Defaults to 'Where vision meets the frame' if left empty.",
        type: "text",
      },
      {
        key: "workImage1",
        label: "Selected Work 1 (image URL)",
        placeholder: "https://… paste a direct image URL",
        description: "First image shown in the 'Selected Works' grid on the home page.",
        type: "url",
      },
      {
        key: "workImage2",
        label: "Selected Work 2 (image URL)",
        placeholder: "https://… paste a direct image URL",
        description: "Second image in the Selected Works grid.",
        type: "url",
      },
      {
        key: "workImage3",
        label: "Selected Work 3 (image URL)",
        placeholder: "https://… paste a direct image URL",
        description: "Third image in the Selected Works grid.",
        type: "url",
      },
      {
        key: "workImage4",
        label: "Selected Work 4 (image URL)",
        placeholder: "https://… paste a direct image URL",
        description: "Fourth image in the Selected Works grid.",
        type: "url",
      },
      {
        key: "workImage5",
        label: "Selected Work 5 (image URL)",
        placeholder: "https://… paste a direct image URL",
        description: "Fifth image in the Selected Works grid.",
        type: "url",
      },
      {
        key: "workImage6",
        label: "Selected Work 6 (image URL)",
        placeholder: "https://… paste a direct image URL",
        description: "Sixth image in the Selected Works grid.",
        type: "url",
      },
    ],
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

/**
 * Per-template placeholder/sample text for standard basics keys.
 * When a template is active, fields listed here are highlighted (amber) in the Basics panel
 * and use this text as placeholder so users can locate what they're changing on the preview.
 */
export const TEMPLATE_BASICS_HINTS: Record<string, Partial<Record<string, string>>> = {
  "minimal-monochrome": {
    name: "e.g. Jane Doe (shown in header)",
    headline: "e.g. Senior Frontend Developer",
    summary: "e.g. Brief professional summary — appears in hero and about.",
    email: "you@example.com",
    phone: "+1 234 567 8900",
    location: "City, Country",
    linkedin: "linkedin.com/in/...",
    github: "github.com/...",
    portfolio: "your-site.com",
  },
  "bold-gradient": {
    name: "e.g. Jane Doe (header)",
    headline: "e.g. Product Designer",
    summary: "e.g. Your summary — shown in hero and about.",
    email: "you@example.com",
    phone: "+1 234 567 8900",
    location: "City, Country",
    linkedin: "linkedin.com/in/...",
    github: "github.com/...",
    portfolio: "your-site.com",
  },
  "cinematic": {
    name: "e.g. Your Name (hero)",
    headline: "e.g. Designer & Developer",
    summary: "e.g. Tagline or short summary under the hero.",
    email: "you@example.com",
    phone: "+1 234 567 8900",
    location: "City, Country",
    linkedin: "linkedin.com/in/...",
    github: "github.com/...",
    portfolio: "your-site.com",
  },
  "artistry": {
    name: "e.g. Artist Name (hero)",
    headline: "e.g. Painter · Sculptor · Visionary",
    summary: "e.g. Short bio — shown in about.",
    email: "you@example.com",
    phone: "+1 234 567 8900",
    location: "City, Country",
    linkedin: "linkedin.com/in/...",
    github: "github.com/...",
    portfolio: "your-site.com",
    heroImage: "Paste image URL — used as the full-page hero background and your About page portrait.",
  },
  "creative-canvas": {
    name: "e.g. JING LI (shown in header)",
    summary: "e.g. A curated portfolio for creatives who see the world differently. (subtitle under hero)",
    headline: "Optional tagline",
    email: "you@example.com",
    phone: "+1 234 567 8900",
    location: "City, Country",
    linkedin: "linkedin.com/in/...",
    github: "github.com/...",
    portfolio: "your-site.com",
    heroImage: "Paste image URL — used as the hero background and About page portrait.",
  },
  "stellar-showcase": {
    name: "e.g. Your Name (hero)",
    headline: "e.g. Photographer · Artist",
    summary: "e.g. Short intro — shown in hero and about.",
    email: "you@example.com",
    phone: "+1 234 567 8900",
    location: "City, Country",
    linkedin: "linkedin.com/in/...",
    github: "github.com/...",
    portfolio: "your-site.com",
    heroImage: "Paste image URL — shown as your hero/about portrait.",
  },
};
