import type { IntakeProfile } from "./types";

const INTAKE_DRAFT_KEY = "resume2web-intake-draft";

export function getIntakeDraft(): Partial<IntakeProfile> | null {
  try {
    const raw = localStorage.getItem(INTAKE_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<IntakeProfile>;
  } catch {
    return null;
  }
}

export function setIntakeDraft(profile: Partial<IntakeProfile>): void {
  try {
    localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function clearIntakeDraft(): void {
  try {
    localStorage.removeItem(INTAKE_DRAFT_KEY);
  } catch {
    // ignore
  }
}
