import { useResumeDocStore } from "./resumeDocStore";
import { PreviewRenderer as TemplatePreview } from "@/features/templates/PreviewRenderer";

/** Live preview: reads from store and re-renders on every basics/blocks/theme change. */
export function PreviewRenderer() {
  const templateId = useResumeDocStore((s) => s.templateId);
  const theme = useResumeDocStore((s) => s.theme);
  const basics = useResumeDocStore((s) => s.basics);
  const blocks = useResumeDocStore((s) => s.blocks);

  return (
    <TemplatePreview
      templateId={templateId}
      theme={theme}
      basics={basics}
      blocks={blocks}
    />
  );
}
