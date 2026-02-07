"use client";

import Link from "next/link";

export function TemplatesAdminFlow() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-werbens-dark-cyan mb-2">
        Manage templates
      </h1>
      <p className="text-werbens-text/80 mb-8">
        Add new templates, categorise them, and control sort order. Changes
        appear on the public templates page.
      </p>
      <div className="bg-white rounded-2xl border border-werbens-dark-cyan/10 p-6 sm:p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-werbens-dark-cyan mb-2">
              Add template
            </h2>
            <p className="text-sm text-werbens-text/70 mb-4">
              Upload template preview, set title, category, and sort order.
              Backend integration coming soon.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled
                className="px-4 py-2.5 rounded-xl bg-werbens-dark-cyan/20 text-werbens-text/50 font-medium cursor-not-allowed min-h-[44px]"
              >
                Add template (coming soon)
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-werbens-dark-cyan mb-2">
              Categories
            </h2>
            <p className="text-sm text-werbens-text/70 mb-4">
              Create and manage categories. These appear as filter keywords for
              SEO and discovery.
            </p>
            <button
              type="button"
              disabled
              className="px-4 py-2.5 rounded-xl bg-werbens-dark-cyan/20 text-werbens-text/50 font-medium cursor-not-allowed min-h-[44px]"
            >
              Manage categories (coming soon)
            </button>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-werbens-dark-cyan mb-2">
              Sort order
            </h2>
            <p className="text-sm text-werbens-text/70">
              Drag and drop to reorder templates. Backend integration required.
            </p>
          </div>
        </div>
      </div>
      <p className="mt-6 text-sm text-werbens-text/60">
        Admin authentication and backend API for template CRUD will be added in
        a future release.
      </p>
    </div>
  );
}
