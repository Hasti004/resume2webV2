/**
 * Template registry: filter templates by category/persona.
 * All data from templateManifests; no Supabase.
 */

import {
  TEMPLATE_MANIFESTS,
  TEMPLATE_CATEGORIES,
  type TemplateManifest,
} from "./templateManifests";

const ALL_ID = "All";

/** All categories including "All" */
export function getCategories(): readonly string[] {
  return TEMPLATE_CATEGORIES;
}

/** Get template by id */
export function getTemplateById(id: string): TemplateManifest | undefined {
  return TEMPLATE_MANIFESTS.find((t) => t.id === id);
}

/** Filter templates by selected category chip. "All" returns every template. */
export function getFilteredTemplates(selectedCategory: string): TemplateManifest[] {
  if (selectedCategory === ALL_ID || !selectedCategory) {
    return [...TEMPLATE_MANIFESTS];
  }
  return TEMPLATE_MANIFESTS.filter(
    (t) =>
      t.categoryTags.includes(selectedCategory) || t.personaTags.includes(selectedCategory)
  );
}

/** All templates (no filter) */
export function getAllTemplates(): TemplateManifest[] {
  return [...TEMPLATE_MANIFESTS];
}
