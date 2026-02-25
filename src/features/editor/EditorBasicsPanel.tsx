import { useResumeDocStore } from "./resumeDocStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function EditorBasicsPanel() {
  const basics = useResumeDocStore((s) => s.basics);
  const updateBasics = useResumeDocStore((s) => s.updateBasics);

  const set = (key: string, value: string) => updateBasics({ [key]: value || undefined });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Basic Info</h3>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={(basics.name as string) ?? ""}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Full name"
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={(basics.email as string) ?? ""}
          onChange={(e) => set("email", e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          value={(basics.phone as string) ?? ""}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+1 234 567 8900"
        />
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <Input
          value={(basics.location as string) ?? ""}
          onChange={(e) => set("location", e.target.value)}
          placeholder="City, Country"
        />
      </div>
      <div className="space-y-2">
        <Label>Headline</Label>
        <Input
          value={(basics.headline as string) ?? ""}
          onChange={(e) => set("headline", e.target.value)}
          placeholder="e.g. Senior Frontend Developer"
        />
      </div>
      <div className="space-y-2">
        <Label>Summary</Label>
        <Textarea
          value={(basics.summary as string) ?? ""}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="Brief professional summary"
          rows={3}
          className="resize-none"
        />
      </div>
      <div className="space-y-2">
        <Label>LinkedIn</Label>
        <Input
          value={(basics.linkedin as string) ?? ""}
          onChange={(e) => set("linkedin", e.target.value)}
          placeholder="https://linkedin.com/in/..."
        />
      </div>
      <div className="space-y-2">
        <Label>GitHub</Label>
        <Input
          value={(basics.github as string) ?? ""}
          onChange={(e) => set("github", e.target.value)}
          placeholder="https://github.com/..."
        />
      </div>
      <div className="space-y-2">
        <Label>Portfolio</Label>
        <Input
          value={(basics.portfolio as string) ?? ""}
          onChange={(e) => set("portfolio", e.target.value)}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}
