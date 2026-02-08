"use client";

import Link from "next/link";

export function CreateTemplateModal({ template, onClose }) {
  if (!template) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-elevated-lg max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto animate-scale-in border border-werbens-dark-cyan/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-werbens-dark-cyan">
            Create for your brand
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-werbens-muted hover:text-werbens-text hover:bg-werbens-surface transition-all duration-200"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="h-24 rounded-xl mb-4 overflow-hidden" style={{ background: template.preview }}>
            <div className="w-full h-full bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <p className="text-werbens-text font-semibold text-lg">
            {template.title}
          </p>
          <p className="text-sm text-werbens-muted mt-1">
            {template.category}
          </p>
        </div>

        <p className="text-sm text-werbens-muted mb-8 leading-relaxed">
          This will open the creator with this template. Connect your accounts
          first if you haven&apos;t already.
        </p>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Link
            href="/onboarding"
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-dark-cyan/90 text-white font-semibold text-center hover:shadow-lg hover:shadow-werbens-dark-cyan/20 transition-all duration-300 min-h-[48px] flex items-center justify-center glow-sm"
          >
            Create now
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-werbens-dark-cyan/15 text-werbens-text font-medium hover:bg-werbens-surface hover:border-werbens-dark-cyan/25 transition-all duration-200 min-h-[48px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
