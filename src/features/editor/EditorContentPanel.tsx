import { useResumeDocStore } from "./resumeDocStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function EditorContentPanel() {
  const blocks = useResumeDocStore((s) => s.blocks);
  const selectedBlockId = useResumeDocStore((s) => s.selectedBlockId);
  const addBlock = useResumeDocStore((s) => s.addBlock);
  const deleteBlock = useResumeDocStore((s) => s.deleteBlock);
  const selectBlock = useResumeDocStore((s) => s.selectBlock);
  const updateBlock = useResumeDocStore((s) => s.updateBlock);

  const selectedBlock = blocks.find((b) => (b.id ?? "") === selectedBlockId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Content</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addBlock("section", "New Section")}
          className="gap-1"
        >
          <Plus className="h-4 w-4" /> Add block
        </Button>
      </div>

      <ul className="space-y-1">
        {blocks.map((b) => (
          <li key={b.id ?? b.type}>
            <button
              type="button"
              onClick={() => selectBlock(b.id ?? null)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                selectedBlockId === (b.id ?? "")
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <span className="font-medium capitalize">{b.type}</span>
              {(b.content?.title as string) && (
                <span className="ml-2 text-muted-foreground">— {String(b.content.title)}</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {selectedBlock && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <Label>Block: {selectedBlock.type}</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => selectedBlock.id && deleteBlock(selectedBlock.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={(selectedBlock.content?.title as string) ?? ""}
                onChange={(e) =>
                  updateBlock(selectedBlock.id!, {
                    content: { ...selectedBlock.content, title: e.target.value },
                  })
                }
                placeholder="Section title"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
