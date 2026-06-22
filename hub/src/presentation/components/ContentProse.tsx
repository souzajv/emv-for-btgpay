import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentSection } from "@/domain/entities";
import { normalizeSection } from "@/application/content/normalizeSection";

interface ContentProseProps {
  sections: ContentSection[];
}

export function ContentProse({ sections }: ContentProseProps) {
  return (
    <article className="prose-content max-w-3xl">
      {sections.map((section) => {
        const normalized = normalizeSection(section);
        return (
          <section key={section.anchorId} id={section.anchorId} className="mb-10">
            <h2>{normalized.heading}</h2>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{normalized.bodyMd}</ReactMarkdown>
            {normalized.btgpayNote && (
              <aside className="mt-6 p-4 border-2 border-ink bg-highlight/20 rounded-sm text-sm">
                {normalized.btgpayNote}
              </aside>
            )}
          </section>
        );
      })}
    </article>
  );
}
