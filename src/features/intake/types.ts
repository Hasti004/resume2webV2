/**
 * Universal Resume Intake — structured context for any occupation.
 * Used before parsing or manual block creation.
 */

export type Seniority =
  | "student"
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "executive"
  | "freelancer";

export type Tone = "ATS" | "Modern" | "Academic" | "Creative";

export type ResumeGoal = "job" | "internship" | "freelance" | "masters" | "portfolio";

export interface IntakeConstraints {
  onePage?: boolean;
  noFabrication?: true;
}

/** Step 6: how the user brings content into the editor */
export type ImportMode = "paste" | "manual" | "hybrid";

export interface IntakeProfile {
  targetRole: string;
  industry?: string;
  seniority?: Seniority;
  locationPreference?: string;
  tone?: Tone;
  resumeGoal?: ResumeGoal;
  /** User-written wins / highlights */
  highlights?: string[];
  constraints?: IntakeConstraints;
  /** Step 3: task descriptions */
  tasks?: string[];
  /** Step 3: optional outcome/impact/metrics per task (same order as tasks) */
  taskOutcomes?: string[];
  /** Step 4: tools/skills (chips) */
  skills?: string[];
  /** Step 5: basic info + links */
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  /** Optional headline / tagline */
  headline?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  /** Other links (e.g. personal site) */
  otherLinks?: string[];
  /** Step 6: A) paste, B) manual, C) hybrid */
  importMode?: ImportMode;
  /** When importMode === "paste" or "hybrid": pasted resume text */
  pastedResumeText?: string;
}

export const SENIORITY_OPTIONS: { value: Seniority; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "intern", label: "Intern" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
  { value: "freelancer", label: "Freelancer" },
];

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "ATS", label: "ATS-optimized" },
  { value: "Modern", label: "Modern" },
  { value: "Academic", label: "Academic" },
  { value: "Creative", label: "Creative" },
];

export const GOAL_OPTIONS: { value: ResumeGoal; label: string }[] = [
  { value: "job", label: "Full-time job" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
  { value: "masters", label: "Masters / PhD" },
  { value: "portfolio", label: "Portfolio" },
];
