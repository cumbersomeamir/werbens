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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-werbens-dark-cyan">
            Manage {name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-werbens-text/60 hover:text-werbens-text text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-werbens-text/70">
            Account settings and preferences for {name}. OAuth re-authorization
            and posting defaults can be configured here when fully integrated.
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-werbens-dark-cyan text-werbens-alt-text font-medium hover:bg-werbens-dark-cyan/90 transition min-h-[48px]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
