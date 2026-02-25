import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type IntakeProfile,
  type ImportMode,
  SENIORITY_OPTIONS,
  TONE_OPTIONS,
  GOAL_OPTIONS,
} from "@/features/intake/types";
import { getIntakeDraft, setIntakeDraft, clearIntakeDraft } from "@/features/intake/storage";
import { createResume, setIntake } from "@/lib/resumeRepo";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = 6;
const STEP_LABELS = [
  "Target details",
  "Goal & tone",
  "Tasks",
  "Skills / tools",
  "Links & location",
  "Import mode",
];

const emptyProfile: Partial<IntakeProfile> = {
  targetRole: "",
  industry: "",
  seniority: undefined,
  locationPreference: "",
  tone: undefined,
  resumeGoal: undefined,
  constraints: {},
  tasks: [""],
  taskOutcomes: [""],
  skills: [],
  name: "",
  email: "",
  phone: "",
  location: "",
  headline: "",
  linkedin: "",
  github: "",
  portfolio: "",
  otherLinks: [],
  importMode: undefined,
  pastedResumeText: "",
};

const IMPORT_MODE_OPTIONS: { value: ImportMode; label: string; description: string }[] = [
  { value: "paste", label: "Paste resume text", description: "Paste your existing resume and we'll parse it with your context." },
  { value: "manual", label: "Start from scratch", description: "Build your resume step by step with placeholder sections." },
  { value: "hybrid", label: "Import + follow-up", description: "Import now, then we'll ask follow-up questions for missing info." },
];

export default function Intake() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeIdFromQuery = searchParams.get("resumeId");
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<IntakeProfile>>(() => getIntakeDraft() ?? { ...emptyProfile });
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    setIntakeDraft(profile);
  }, [profile]);

  const update = (patch: Partial<IntakeProfile>) => setProfile((p) => ({ ...p, ...patch }));

  const canNext = () => {
    if (step === 1) return !!profile.targetRole?.trim();
    if (step === 2) return !!profile.resumeGoal && !!profile.tone;
    if (step === 6) return !!profile.importMode && (profile.importMode !== "paste" && profile.importMode !== "hybrid" ? true : !!profile.pastedResumeText?.trim());
    return true;
  };

  const handleNext = () => {
    if (step < STEPS) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const addTask = () => {
    setProfile((p) => ({
      ...p,
      tasks: [...(p.tasks ?? [""]), ""],
      taskOutcomes: [...(p.taskOutcomes ?? [""]), ""],
    }));
  };
  const removeTask = (i: number) =>
    setProfile((p) => ({
      ...p,
      tasks: (p.tasks ?? []).filter((_, idx) => idx !== i),
      taskOutcomes: (p.taskOutcomes ?? []).filter((_, idx) => idx !== i),
    }));
  const setTask = (i: number, v: string) =>
    setProfile((p) => ({
      ...p,
      tasks: (p.tasks ?? []).map((t, idx) => (idx === i ? v : t)),
    }));
  const setTaskOutcome = (i: number, v: string) =>
    setProfile((p) => ({
      ...p,
      taskOutcomes: (p.taskOutcomes ?? []).map((o, idx) => (idx === i ? v : o)),
    }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    setProfile((p) => ({ ...p, skills: [...(p.skills ?? []), s] }));
    setSkillInput("");
  };
  const removeSkill = (i: number) =>
    setProfile((p) => ({ ...p, skills: (p.skills ?? []).filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      let resumeId = resumeIdFromQuery;
      if (!resumeId) resumeId = await createResume(user.id);

      const tasks = profile.tasks ?? [];
      const taskOutcomes = profile.taskOutcomes ?? [];
      const fullProfile: IntakeProfile = {
        targetRole: profile.targetRole ?? "",
        industry: profile.industry,
        seniority: profile.seniority,
        locationPreference: profile.locationPreference,
        tone: profile.tone,
        resumeGoal: profile.resumeGoal,
        constraints: profile.constraints,
        tasks,
        taskOutcomes: taskOutcomes.slice(0, tasks.length),
        skills: profile.skills,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        headline: profile.headline,
        linkedin: profile.linkedin,
        github: profile.github,
        portfolio: profile.portfolio,
        otherLinks: profile.otherLinks?.filter(Boolean),
        importMode: profile.importMode,
        pastedResumeText: profile.pastedResumeText,
      };
      await setIntake(resumeId!, fullProfile);
      clearIntakeDraft();
      navigate(`/dashboard/editor/${resumeId}`, {
        state: {
          fromIntake: true,
          importMode: profile.importMode,
          pastedResumeText: profile.pastedResumeText?.trim() || undefined,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-foreground">Resume intake</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Step {step} of {STEPS}: {STEP_LABELS[step - 1]}
          </p>

          <div className="mt-6 flex gap-1">
            {Array.from({ length: STEPS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i + 1 <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          <div className="mt-8 space-y-6">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Target role *</Label>
                  <Input
                    placeholder="e.g. Frontend Developer, Doctor, Fashion Designer"
                    value={profile.targetRole ?? ""}
                    onChange={(e) => update({ targetRole: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seniority</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={profile.seniority ?? ""}
                    onChange={(e) => update({ seniority: (e.target.value || undefined) as IntakeProfile["seniority"] })}
                  >
                    <option value="">Select...</option>
                    {SENIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Industry (optional)</Label>
                  <Input
                    placeholder="e.g. Healthcare, Tech, Finance"
                    value={profile.industry ?? ""}
                    onChange={(e) => update({ industry: e.target.value })}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Goal *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={profile.resumeGoal ?? ""}
                    onChange={(e) => update({ resumeGoal: (e.target.value || undefined) as IntakeProfile["resumeGoal"] })}
                  >
                    <option value="">Select...</option>
                    {GOAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tone *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={profile.tone ?? ""}
                    onChange={(e) => update({ tone: (e.target.value || undefined) as IntakeProfile["tone"] })}
                  >
                    <option value="">Select...</option>
                    {TONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="onePage"
                    checked={profile.constraints?.onePage ?? false}
                    onChange={(e) =>
                      update({
                        constraints: { ...profile.constraints, onePage: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="onePage" className="cursor-pointer font-normal">
                    Prefer one-page resume
                  </Label>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-sm text-muted-foreground">
                  What did you do? Add tasks/responsibilities. Optionally add outcome or impact (e.g. &quot;reduced time by 30%&quot;).
                </p>
                {(profile.tasks ?? [""]).map((t, i) => (
                  <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Task / responsibility"
                        value={t}
                        onChange={(e) => setTask(i, e.target.value)}
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTask(i)}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Outcome / impact / metrics (optional)"
                      value={profile.taskOutcomes?.[i] ?? ""}
                      onChange={(e) => setTaskOutcome(i, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addTask} className="gap-1">
                  <Plus className="h-4 w-4" /> Add another
                </Button>
              </>
            )}

            {step === 4 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Skills and tools (type and press Enter to add). e.g. React, SQL, Canva, Figma, Leadership
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. React, Figma, Communication"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" onClick={addSkill}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(profile.skills ?? []).map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-sm text-primary"
                    >
                      {s}
                      <button type="button" onClick={() => removeSkill(i)} className="hover:opacity-80">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div className="space-y-2">
                  <Label>Location / address</Label>
                  <Input
                    placeholder="City, Country or full address"
                    value={profile.location ?? ""}
                    onChange={(e) => update({ location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Headline (optional)</Label>
                  <Input
                    placeholder="e.g. Senior Frontend Developer | React & TypeScript"
                    value={profile.headline ?? ""}
                    onChange={(e) => update({ headline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    placeholder="https://linkedin.com/in/..."
                    value={profile.linkedin ?? ""}
                    onChange={(e) => update({ linkedin: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GitHub URL</Label>
                  <Input
                    placeholder="https://github.com/..."
                    value={profile.github ?? ""}
                    onChange={(e) => update({ github: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Portfolio URL</Label>
                  <Input
                    placeholder="https://..."
                    value={profile.portfolio ?? ""}
                    onChange={(e) => update({ portfolio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Other links (one per line)</Label>
                  <Textarea
                    placeholder="Personal site, blog, etc."
                    value={(profile.otherLinks ?? []).join("\n")}
                    onChange={(e) =>
                      update({
                        otherLinks: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    rows={2}
                  />
                </div>
              </>
            )}

            {step === 6 && (
              <>
                <p className="text-sm text-muted-foreground">
                  How do you want to bring your content into the editor?
                </p>
                <div className="space-y-3">
                  {IMPORT_MODE_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className={cn(
                        "rounded-lg border-2 p-4 transition-colors cursor-pointer",
                        profile.importMode === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => update({ importMode: opt.value })}
                      onKeyDown={(e) => e.key === "Enter" && update({ importMode: opt.value })}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="font-medium text-foreground">{opt.label}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{opt.description}</div>
                    </div>
                  ))}
                </div>
                {(profile.importMode === "paste" || profile.importMode === "hybrid") && (
                  <div className="mt-6 space-y-2">
                    <Label>Paste your resume text</Label>
                    <Textarea
                      placeholder="Paste your existing resume or CV text here. We'll use your intake context to parse it."
                      value={profile.pastedResumeText ?? ""}
                      onChange={(e) => update({ pastedResumeText: e.target.value })}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-10 flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={step === 1}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < STEPS ? (
              <Button onClick={handleNext} disabled={!canNext()}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : "Continue"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
