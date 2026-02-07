"use client";

import Link from "next/link";

export function CreateTemplateModal({ template, onClose }) {
  if (!template) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-werbens-dark-cyan/20 shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-werbens-dark-cyan">
            Create for your brand
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-werbens-text/60 hover:text-werbens-text text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <p className="text-werbens-text/80 mb-2">
          <strong>{template.title}</strong> — {template.category}
        </p>
        <p className="text-sm text-werbens-text/60 mb-6">
          This will open the creator with this template. Connect your accounts
          first if you haven&apos;t already.
        </p>
        <div className="flex gap-3">
          <Link
            href="/onboarding"
            className="flex-1 py-3 rounded-xl bg-werbens-dark-cyan text-white font-semibold text-center hover:bg-werbens-dark-cyan/90 transition"
          >
            Create now
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl border border-werbens-dark-cyan/30 text-werbens-text font-medium hover:bg-werbens-light-cyan/40 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
