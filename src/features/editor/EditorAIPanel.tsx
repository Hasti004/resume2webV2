import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResumeDocStore } from "./resumeDocStore";
import { aiEdit } from "@/lib/resumeRepo";
import type { ResumeBasics, ResumeBlock } from "@/lib/resumeRepo";
import { Send, Check, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const QUICK_CHIPS = [
  { label: "Optimize for ATS", instruction: "Optimize my resume for ATS (applicant tracking systems): improve keywords and phrasing while keeping my experience accurate." },
  { label: "Shorten", instruction: "Shorten my resume: make it more concise without losing important information. Prefer action verbs and remove filler." },
  { label: "Add impact metrics", instruction: "Suggest adding quantifiable impact or metrics to my experience and project bullets where possible. Keep my wording where I already have numbers." },
];

function getBasicKeys(b: Record<string, unknown>): string[] {
  const known = ["name", "email", "phone", "location", "headline", "summary", "linkedin", "github", "portfolio"];
  const fromObj = Object.keys(b);
  return Array.from(new Set([...known, ...fromObj]));
}

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function EditorAIPanel() {
  const basics = useResumeDocStore((s) => s.basics);
  const selectedBlockId = useResumeDocStore((s) => s.selectedBlockId);
  const updateBasics = useResumeDocStore((s) => s.updateBasics);
  const updateBlock = useResumeDocStore((s) => s.updateBlock);
  const addBlockWithContent = useResumeDocStore((s) => s.addBlockWithContent);
  const setBasicsAndBlocks = useResumeDocStore((s) => s.setBasicsAndBlocks);
  const getState = useResumeDocStore.getState;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<{ basicsProposed: ResumeBasics; blocksProposed: ResumeBlock[] } | null>(null);
  const [acceptedBasicKeys, setAcceptedBasicKeys] = useState<Set<string>>(new Set());
  const [acceptedBlockIndices, setAcceptedBlockIndices] = useState<Set<number>>(new Set());

  const runAiEdit = useCallback(
    async (instruction: string) => {
      setLoading(true);
      setProposal(null);
      setAcceptedBasicKeys(new Set());
      setAcceptedBlockIndices(new Set());
      setMessages((m) => [...m, { role: "user", content: instruction }]);
      try {
        const result = await aiEdit({
          basics: getState().basics,
          blocks: getState().blocks,
          instruction,
          scope: selectedBlockId ? "block" : "full",
          selectedBlockId: selectedBlockId ?? undefined,
        });
        setProposal({ basicsProposed: result.basicsProposed, blocksProposed: result.blocksProposed });
        setMessages((m) => [...m, { role: "assistant", content: "Here are the suggested edits. Review the diff and accept or reject below." }]);
      } catch (err) {
        setMessages((m) => [...m, { role: "assistant", content: err instanceof Error ? err.message : "Something went wrong." }]);
      } finally {
        setLoading(false);
      }
    },
    [selectedBlockId]
  );

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    runAiEdit(text);
  };

  const handleAcceptAll = () => {
    if (!proposal) return;
    setBasicsAndBlocks(proposal.basicsProposed, proposal.blocksProposed);
    setProposal(null);
    setAcceptedBasicKeys(new Set());
    setAcceptedBlockIndices(new Set());
    setMessages((m) => [...m, { role: "assistant", content: "All edits applied." }]);
  };

  const handleRejectAll = () => {
    setProposal(null);
    setAcceptedBasicKeys(new Set());
    setAcceptedBlockIndices(new Set());
    setMessages((m) => [...m, { role: "assistant", content: "Edits discarded." }]);
  };

  const acceptBasicKey = (key: string) => {
    if (!proposal) return;
    const value = proposal.basicsProposed[key];
    updateBasics({ [key]: value });
    setAcceptedBasicKeys((s) => new Set(s).add(key));
  };

  const acceptBlock = (block: ResumeBlock, index: number) => {
    if (!proposal) return;
    const id = block.id ?? "";
    const exists = getState().blocks.some((b) => (b.id ?? "") === id);
    if (exists && id) {
      updateBlock(id, { type: block.type, content: block.content ?? {} });
    } else {
      addBlockWithContent(block.type, block.content ?? {}, block.sort_order);
    }
    setAcceptedBlockIndices((s) => new Set(s).add(index));
  };

  const basicKeysDiff = proposal
    ? getBasicKeys(proposal.basicsProposed).filter(
        (key) => !acceptedBasicKeys.has(key) && !isEqual(basics[key], proposal.basicsProposed[key])
      )
    : [];
  const blocksDiff = proposal
    ? proposal.blocksProposed
        .map((b, i) => ({ block: b, index: i }))
        .filter(({ block: b, index: i }) => {
          if (acceptedBlockIndices.has(i)) return false;
          const id = b.id ?? "";
          const cur = getState().blocks.find((x) => (x.id ?? "") === id);
          return cur ? !isEqual(cur.content, b.content ?? {}) : true;
        })
    : [];

  const hasDiff = basicKeysDiff.length > 0 || blocksDiff.length > 0;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip) => (
          <Button
            key={chip.label}
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => runAiEdit(chip.instruction)}
            className="text-xs"
          >
            {chip.label}
          </Button>
        ))}
      </div>

      <ScrollArea className="flex-1 min-h-[200px] rounded-md border border-border p-3">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                msg.role === "user" ? "bg-primary/10 ml-6" : "bg-muted mr-6"
              )}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Thinking…
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          placeholder="Ask AI to edit your resume…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          disabled={loading}
        />
        <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {proposal && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Suggested edits</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAcceptAll} className="gap-1">
                <CheckCircle2 className="h-4 w-4" /> Accept All
              </Button>
              <Button size="sm" variant="outline" onClick={handleRejectAll} className="gap-1">
                <XCircle className="h-4 w-4" /> Reject All
              </Button>
            </div>
          </div>

          {basicKeysDiff.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Basics</p>
              <ul className="space-y-2">
                {basicKeysDiff.map((key) => (
                  <li key={key} className="flex flex-wrap items-start justify-between gap-2 rounded border border-border bg-background p-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-muted-foreground">{key}:</span>
                      <div className="mt-0.5">
                        <span className="line-through text-muted-foreground">
                          {String(basics[key] ?? "") || "—"}
                        </span>
                        <span className="ml-2 text-foreground">
                          {String(proposal!.basicsProposed[key] ?? "") || "—"}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="shrink-0" onClick={() => acceptBasicKey(key)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {blocksDiff.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Blocks</p>
              <ul className="space-y-2">
                {blocksDiff.map(({ block, index }) => {
                  const cur = getState().blocks.find((x) => (x.id ?? "") === (block.id ?? ""));
                  return (
                    <li key={`${block.id ?? "new"}-${index}`} className="flex flex-wrap items-start justify-between gap-2 rounded border border-border bg-background p-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-muted-foreground">{block.type}</span>
                        <div className="mt-1 flex flex-col gap-1">
                          {cur ? (
                            <>
                              <span className="text-muted-foreground line-through text-xs">
                                {JSON.stringify(cur.content ?? {}, null, 1)}
                              </span>
                              <span className="text-foreground text-xs">
                                {JSON.stringify(block.content ?? {}, null, 1)}
                              </span>
                            </>
                          ) : (
                            <span className="text-foreground text-xs">New: {JSON.stringify(block.content ?? {}, null, 1)}</span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="shrink-0" onClick={() => acceptBlock(block, index)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {!hasDiff && (
            <p className="text-sm text-muted-foreground">No remaining changes to show; accept or reject above.</p>
          )}
        </div>
      )}
    </div>
  );
}
