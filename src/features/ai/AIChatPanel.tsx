import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Plus, ArrowUpRight, X, Sparkles, FileText, Wand2, Check } from "lucide-react";

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** Whether to render this assistant message as a \"card\" with an Apply button. */
  asCard?: boolean;
}

export interface AIChatPanelProps {
  onClose?: () => void;
  // Placeholder for future Gemini integration. The shape of the patch is intentionally loose for now.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onProposePatch?: (patch: any) => void;
}

export function AIChatPanel({ onClose, onProposePatch }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "m1",
      role: "assistant",
      content:
        "I can help you rewrite your summary, polish experience bullets, and tailor your resume for different roles.",
    },
    {
      id: "m2",
      role: "assistant",
      asCard: true,
      content:
        "- Generate project descriptions from short notes\n- Restructure sections for better flow\n- Optimize for ATS while keeping your voice",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Always scroll to bottom when messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    // Fake assistant response after a short delay
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        asCard: true,
        content:
          "Here's a draft improvement based on your message:\n\n- Highlight measurable impact and key technologies\n- Tighten wording to one or two strong bullets\n- Keep the tone consistent with the rest of your resume",
      };
      setMessages((prev) => [...prev, reply]);
      setSending(false);
    }, 400);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 rounded-xl border border-[hsl(var(--border))] bg-white px-3 py-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
            <h2 className="text-sm font-semibold text-foreground">Ask Resume2Web</h2>
          </div>
          <p className="text-xs text-gray-500">Edit your resume using chat. I’ll never change anything until you apply it.</p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500 hover:text-gray-900"
            onClick={onClose}
            aria-label="Close AI chat"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-[hsl(var(--border))] bg-gray-50 px-3 py-3"
      >
        {messages.map((message) => {
          const isUser = message.role === "user";
          const bubbleBase =
            "max-w-full rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap";
          const bubbleClass = isUser
            ? "ml-auto bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
            : "mr-auto bg-white text-foreground border border-[hsl(var(--border))]";

          if (message.role === "assistant" && message.asCard) {
            return (
              <div
                key={message.id}
                className="mr-auto flex max-w-full flex-col gap-2 rounded-2xl border border-[hsl(var(--border))] bg-white px-3 py-2 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  Smart suggestion
                </div>
                <div className="space-y-1.5 text-sm text-foreground">
                  {message.content.split("\n").map((line, idx) => {
                    if (line.startsWith("- ")) {
                      return (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                          <span>{line.replace(/^-\\s*/, "")}</span>
                        </div>
                      );
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-7 gap-1.5 border-dashed text-xs text-gray-500"
                    disabled
                    onClick={() => onProposePatch?.({})}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    Apply (coming soon)
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-7 gap-1.5 text-xs text-gray-500 hover:text-gray-800"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    See diff
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={cn("flex", isUser ? "justify-end" : "justify-start")}
            >
              <div className={cn(bubbleBase, bubbleClass)}>
                {message.content}
                {!isUser && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400">
                    <Check className="h-3 w-3" />
                    Draft only — not applied yet
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!messages.length && (
          <div className="text-center text-xs text-gray-500">
            Ask anything about your resume and I&apos;ll suggest edits here.
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="mt-1 flex flex-col gap-1.5 rounded-xl border border-[hsl(var(--border))] bg-white p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-900"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-dashed text-xs text-gray-600"
            >
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              Plan
            </Button>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Ask Resume2Web..."
            className="min-h-[44px] flex-1 resize-none border-none bg-transparent px-2 py-1 text-sm focus-visible:ring-0"
          />
          <Button
            type="button"
            size="icon"
            className="h-9 w-9 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            aria-label="Send message"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

