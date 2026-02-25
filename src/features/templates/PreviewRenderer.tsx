import type { ResumeBasics, ResumeBlock } from "@/lib/resumeRepo";

export interface PreviewRendererProps {
  templateId: string | null;
  basics: ResumeBasics;
  blocks: ResumeBlock[];
}

/**
 * Renders resume from props. Re-renders instantly when basics/blocks change.
 * Name + headline, contact row, sections by block.title or default label for type.
 */
export function PreviewRenderer({ templateId, basics, blocks }: PreviewRendererProps) {
  const name = [basics.name].filter(Boolean).join(" ") || "Your Name";
  const contact: string[] = [];
  if (basics.email) contact.push(basics.email as string);
  if (basics.phone) contact.push(basics.phone as string);
  if (basics.location) contact.push(basics.location as string);
  const headline = basics.headline ?? basics.summary;
  const links = [
    basics.linkedin && { label: "LinkedIn", url: basics.linkedin },
    basics.github && { label: "GitHub", url: basics.github },
    basics.portfolio && { label: "Portfolio", url: basics.portfolio },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <div className="min-h-[600px] rounded-lg border border-border bg-card p-6 shadow-sm">
      <article className="text-foreground">
        <header className="border-b border-border pb-3">
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          {headline && (
            <p className="mt-1 text-sm text-muted-foreground">{String(headline)}</p>
          )}
          {contact.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {contact.join(" · ")}
            </p>
          )}
          {links.length > 0 && (
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0 text-xs">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={String(l.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {l.label}
                </a>
              ))}
            </p>
          )}
        </header>

        <div className="mt-4 space-y-4">
          {blocks.map((block, i) => (
            <SectionBlock key={block.id ?? i} block={block} />
          ))}
        </div>

        {templateId && (
          <p className="mt-6 text-right text-xs text-muted-foreground">
            Template: {templateId}
          </p>
        )}
      </article>
    </div>
  );
}

function SectionBlock({ block }: { block: ResumeBlock }) {
  const title =
    (block.content?.title as string) ??
    block.type.charAt(0).toUpperCase() + block.type.slice(1).replace(/_/g, " ");
  const items = Array.isArray(block.content?.items)
    ? (block.content.items as Record<string, unknown>[])
    : block.content?.text
      ? [{ text: block.content.text }]
      : [];

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ul className="mt-2 space-y-2">
        {items.length > 0 ? (
          items.map((item, i) => (
            <li key={i} className="text-sm">
              {"title" in item && item.title ? (
                <span className="font-medium">{String(item.title)}</span>
              ) : null}
              {"subtitle" in item && item.subtitle ? (
                <span className="text-muted-foreground"> — {String(item.subtitle)}</span>
              ) : null}
              {"text" in item && item.text ? (
                <p className="mt-0.5 text-muted-foreground">{String(item.text)}</p>
              ) : null}
              {!("text" in item) && "title" in item ? (
                <p className="mt-0.5 text-muted-foreground">
                  {JSON.stringify(item)}
                </p>
              ) : null}
            </li>
          ))
        ) : (
          <li className="text-sm text-muted-foreground italic">No content yet.</li>
        )}
      </ul>
    </section>
  );
}
