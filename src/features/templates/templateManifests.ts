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
export const TEMPLATE_CATEGORIES = [
  "All",
  "Tech Professionals",
  "Design & Creative",
  "Researchers & Academia",
  "Business & Management",
  "Marketing & Sales",
  "Finance & Accounting",
  "Healthcare & Medicine",
  "Law & Legal",
  "Education & Training",
  "Architecture & Civil",
  "Mechanical & Manufacturing",
  "Electrical & Electronics",
  "Media & Communications",
  "Human Resources",
  "Hospitality & Tourism",
  "Students & Freshers",
] as const;

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
    description: "Clean, black-and-white layout for a professional look. Ideal for corporate and formal roles.",
    styleTag: "Minimal",
    categoryTags: ["Design & Creative", "All"],
    personaTags: ["Tech Professionals", "Business & Management", "Students & Freshers"],
    supportedBlocks: ["custom", "summary", "experience", "education", "skills"],
    sectionOrder: DEFAULT_SECTION_ORDER,
    preview: { kind: "gradient", value: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)" },
  },
  {
    id: "bold-gradient",
    name: "Bold Gradient",
    description: "Striking gradient accents that stand out. Great for creative and design-focused portfolios.",
    styleTag: "Creative",
    categoryTags: ["Design & Creative", "All"],
    personaTags: ["Design & Creative", "Marketing & Sales", "Media & Communications"],
    supportedBlocks: ["custom", "summary", "experience", "projects", "skills"],
    sectionOrder: DEFAULT_SECTION_ORDER,
    preview: { kind: "gradient", value: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)" },
  },
  {
    id: "creative-purple",
    name: "Creative Purple",
    description: "Modern purple theme with clear hierarchy. Suits designers and creative professionals.",
    styleTag: "Creative",
    categoryTags: ["Design & Creative", "All"],
    personaTags: ["Design & Creative", "Students & Freshers", "Media & Communications"],
    supportedBlocks: ["custom", "summary", "experience", "projects", "education", "skills"],
    sectionOrder: DEFAULT_SECTION_ORDER,
    preview: { kind: "gradient", value: "linear-gradient(135deg, #6b21a8 0%, #a855f7 50%, #c084fc 100%)" },
  },
  {
    id: "warm-sunset",
    name: "Warm Sunset",
    description: "Warm orange and coral tones. Friendly and approachable for customer-facing roles.",
    styleTag: "Creative",
    categoryTags: ["Marketing & Sales", "All"],
    personaTags: ["Marketing & Sales", "Hospitality & Tourism", "Human Resources"],
    supportedBlocks: ["custom", "summary", "experience", "education", "skills", "additional"],
    sectionOrder: DEFAULT_SECTION_ORDER,
    preview: { kind: "gradient", value: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)" },
  },
  {
    id: "modern-designer",
    name: "Modern Designer",
    description: "Sleek, contemporary layout with strong typography. For design and product roles.",
    styleTag: "Modern",
    categoryTags: ["Design & Creative", "All"],
    personaTags: ["Design & Creative", "Tech Professionals", "Students & Freshers"],
    supportedBlocks: ["custom", "summary", "experience", "projects", "skills"],
    sectionOrder: DEFAULT_SECTION_ORDER,
    preview: { kind: "gradient", value: "linear-gradient(135deg, #0f172a 0%, #334155 50%, #64748b 100%)" },
  },
  {
    id: "creative-visual-designer",
    name: "Creative Visual Designer",
    description: "Visual-first layout with bold sections. Best for UX/UI and visual design portfolios.",
    styleTag: "Creative",
    categoryTags: ["Design & Creative", "All"],
    personaTags: ["Design & Creative", "Media & Communications"],
    supportedBlocks: ["custom", "summary", "experience", "projects", "education", "skills", "additional"],
    sectionOrder: DEFAULT_SECTION_ORDER,
    preview: { kind: "gradient", value: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #06b6d4 100%)" },
  },
  {
    id: "clean-tech",
    name: "Clean Tech",
    description: "Structured and scannable. Optimized for engineering and technical roles.",
    styleTag: "Modern",
    categoryTags: ["Tech Professionals", "All"],
    personaTags: ["Tech Professionals", "Electrical & Electronics", "Mechanical & Manufacturing"],
    supportedBlocks: ["custom", "summary", "experience", "projects", "education", "skills"],
    sectionOrder: DEFAULT_SECTION_ORDER,
    preview: { kind: "gradient", value: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)" },
  },
  {
    id: "academic-researcher",
    name: "Academic Researcher",
    description: "Formal structure with emphasis on publications and education. For academia and research.",
    styleTag: "Academic",
    categoryTags: ["Researchers & Academia", "All"],
    personaTags: ["Researchers & Academia", "Education & Training", "Healthcare & Medicine"],
    supportedBlocks: ["custom", "summary", "experience", "education", "skills", "additional"],
    sectionOrder: ["summary", "experience", "education", "skills", "projects", "additional"],
    preview: { kind: "gradient", value: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)" },
  },
];
