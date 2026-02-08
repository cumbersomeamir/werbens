import { TemplateCard } from "./TemplateCard";

export function TemplatesGrid({ templates, onCreate }) {
  return (
    <section
      className="px-4 sm:px-6 pb-16 sm:pb-24"
      aria-label="Template gallery"
    >
      <div className="mx-auto max-w-7xl animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onCreate={onCreate}
            />
          ))}
        </div>
        {templates.length === 0 && (
          <div className="text-center py-24 animate-fade-in-up">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-werbens-surface flex items-center justify-center">
              <svg className="w-8 h-8 text-werbens-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-werbens-muted text-lg font-medium">
              No templates in this category yet
            </p>
            <p className="text-werbens-muted/60 text-sm mt-2">
              Check back soon — new templates are added regularly.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
