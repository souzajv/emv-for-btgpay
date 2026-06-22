"use client";

import { useEffect, useState } from "react";
import type { ContentSection } from "@/domain/entities";
import { filterSectionsByAnchors } from "@/application/content/verificationTree";
import { ContentProse } from "./ContentProse";

interface MaterialContentProps {
  sections: ContentSection[];
}

function resolveFilterAnchors(sectionsParam: string | null): string[] | undefined {
  if (!sectionsParam) return undefined;
  const ids = sectionsParam.split(",").filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}

export function MaterialContent({ sections }: MaterialContentProps) {
  const [visible, setVisible] = useState(sections);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const anchorIds = resolveFilterAnchors(params.get("sections"));
    setVisible(
      anchorIds ? filterSectionsByAnchors(sections, anchorIds) : sections
    );
  }, [sections]);

  return <ContentProse sections={visible} />;
}
