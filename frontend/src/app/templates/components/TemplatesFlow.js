"use client";

import { useState, useMemo } from "react";
import { TemplatesLayout } from "./TemplatesLayout";
import { TemplatesHero } from "./TemplatesHero";
import { CategoryFilters } from "./CategoryFilters";
import { TemplatesGrid } from "./TemplatesGrid";
import { CreateTemplateModal } from "./CreateTemplateModal";
import { TEMPLATES } from "../data/templates";

export function TemplatesFlow() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [createTemplate, setCreateTemplate] = useState(null);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "All") return TEMPLATES;
    return TEMPLATES.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <TemplatesLayout>
      <TemplatesHero />
      <CategoryFilters
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <TemplatesGrid
        templates={filteredTemplates}
        onCreate={setCreateTemplate}
      />
      {createTemplate && (
        <CreateTemplateModal
          template={createTemplate}
          onClose={() => setCreateTemplate(null)}
        />
      )}
    </TemplatesLayout>
  );
}
