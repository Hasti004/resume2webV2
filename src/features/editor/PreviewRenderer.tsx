import { useResumeDocStore } from "./resumeDocStore";
import { PreviewRenderer as TemplatePreview } from "@/features/templates/PreviewRenderer";

/** Live preview: reads from store and re-renders on every basics/blocks/theme change. */
export function PreviewRenderer() {
  const templateId = useResumeDocStore((s) => s.templateId);
  const previewTemplateId = useResumeDocStore((s) => s.previewTemplateId);
  const theme = useResumeDocStore((s) => s.theme);
  const basics = useResumeDocStore((s) => s.basics);
  const blocks = useResumeDocStore((s) => s.blocks);

  const effectiveTemplateId = previewTemplateId ?? templateId;

  return (
    <TemplatePreview
      templateId={effectiveTemplateId}
      theme={theme}
      basics={basics}
      blocks={blocks}
    />
  );
}
