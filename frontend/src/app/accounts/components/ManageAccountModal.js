"use client";

const PLATFORM_META = {
  instagram: { name: "Instagram" },
  facebook: { name: "Facebook" },
  twitter: { name: "X (Twitter)" },
  linkedin: { name: "LinkedIn" },
  youtube: { name: "YouTube" },
  tiktok: { name: "TikTok" },
  pinterest: { name: "Pinterest" },
};

export function ManageAccountModal({ platformId, onClose }) {
  if (!platformId) return null;
  const name = PLATFORM_META[platformId]?.name ?? platformId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-slide-in-right sm:animate-scale-in bg-white rounded-t-3xl sm:rounded-2xl shadow-elevated-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-werbens-steel/10">
          <h2 className="text-lg sm:text-xl font-bold text-werbens-text tracking-tight">
            Manage{" "}
            <span className="text-werbens-dark-cyan">{name}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-werbens-surface text-werbens-muted transition-all duration-200 hover:bg-werbens-steel/20 hover:text-werbens-text focus-ring"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <p className="text-sm leading-relaxed text-werbens-muted">
            Account settings and preferences for {name}. OAuth re-authorization
            and posting defaults can be configured here when fully integrated.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:glow-sm focus-ring"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
