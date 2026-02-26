/**
 * Template manifest type and hardcoded template list.
 * Used by Template Selection UI and registry.
 */

export interface TemplatePreview {
  kind: "gradient" | "image";
  value: string; // CSS gradient string or image URL
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
}

/** Category chips for filter (include "All" as special) */
export const TEMPLATE_CATEGORIES = ["All", "Professional", "Creative"] as const;

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
];
