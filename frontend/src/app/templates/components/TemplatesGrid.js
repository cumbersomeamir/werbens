import { TemplateCard } from "./TemplateCard";

export function TemplatesGrid({ templates, onCreate }) {
  return (
    <section
      className="px-6 pb-16"
      aria-label="Template gallery"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onCreate={onCreate}
            />
          ))}
        </div>
        {templates.length === 0 && (
          <div className="text-center py-16">
            <p className="text-werbens-text/70">
              No templates in this category yet. Check back soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
