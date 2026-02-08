"use client";

import Link from "next/link";

export function TemplatesAdminFlow() {
  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">
        <span className="gradient-text">Manage templates</span>
      </h1>
      <p className="text-werbens-muted mb-10 text-lg">
        Add new templates, categorise them, and control sort order. Changes
        appear on the public templates page.
      </p>

      <div className="bg-white rounded-2xl shadow-elevated border border-werbens-dark-cyan/8 p-6 sm:p-8">
        <div className="space-y-8">
          <div className="pb-8 border-b border-werbens-dark-cyan/8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-werbens-dark-cyan to-werbens-light-cyan flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-werbens-dark-cyan">
                Add template
              </h2>
            </div>
            <p className="text-sm text-werbens-muted mb-5 ml-12">
              Upload template preview, set title, category, and sort order.
              Backend integration coming soon.
            </p>
            <div className="ml-12">
              <button
                type="button"
                disabled
                className="px-5 py-2.5 rounded-xl bg-werbens-surface text-werbens-muted font-medium cursor-not-allowed min-h-[44px] border border-werbens-dark-cyan/8 text-sm"
              >
                Add template (coming soon)
              </button>
            </div>
          </div>

          <div className="pb-8 border-b border-werbens-dark-cyan/8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-werbens-light-cyan to-werbens-glow flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-werbens-midnight" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-werbens-dark-cyan">
                Categories
              </h2>
            </div>
            <p className="text-sm text-werbens-muted mb-5 ml-12">
              Create and manage categories. These appear as filter keywords for
              SEO and discovery.
            </p>
            <div className="ml-12">
              <button
                type="button"
                disabled
                className="px-5 py-2.5 rounded-xl bg-werbens-surface text-werbens-muted font-medium cursor-not-allowed min-h-[44px] border border-werbens-dark-cyan/8 text-sm"
              >
                Manage categories (coming soon)
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-werbens-amber to-werbens-amber/70 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-werbens-dark-cyan">
                Sort order
              </h2>
            </div>
            <p className="text-sm text-werbens-muted ml-12">
              Drag and drop to reorder templates. Backend integration required.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-werbens-muted/70">
        Admin authentication and backend API for template CRUD will be added in
        a future release.
      </p>
    </div>
  );
}
