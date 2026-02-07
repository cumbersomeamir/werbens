"use client";

const PLATFORM_META = {
  instagram: { name: "Instagram", icon: "📷", color: "bg-pink-500/10" },
  facebook: { name: "Facebook", icon: "👍", color: "bg-blue-500/10" },
  twitter: { name: "X (Twitter)", icon: "𝕏", color: "bg-gray-900/10" },
  linkedin: { name: "LinkedIn", icon: "💼", color: "bg-blue-600/10" },
  youtube: { name: "YouTube", icon: "▶️", color: "bg-red-500/10" },
  tiktok: { name: "TikTok", icon: "🎵", color: "bg-black/10" },
  pinterest: { name: "Pinterest", icon: "📌", color: "bg-red-600/10" },
};

export function AccountCard({ platformId, isConnected, username, onConnect, onRemove, onManage }) {
  const meta = PLATFORM_META[platformId] ?? { name: platformId, icon: "🔗", color: "bg-gray-500/10" };

  return (
    <div
      className={`rounded-2xl border-2 p-6 transition ${
        isConnected
          ? "border-werbens-dark-cyan/30 bg-white shadow-sm"
          : "border-werbens-dark-cyan/10 bg-white/80"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl ${meta.color} flex items-center justify-center text-2xl`}
          >
            {meta.icon}
          </div>
          <div>
            <h3 className="font-semibold text-werbens-dark-cyan">{meta.name}</h3>
            {isConnected ? (
              <p className="text-sm text-werbens-text/70 mt-0.5">
                {username || "Connected"}
              </p>
            ) : (
              <p className="text-sm text-werbens-text/50">Not connected</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          {isConnected ? (
            <>
              <button
                type="button"
                onClick={() => onManage(platformId)}
                className="px-4 py-2.5 rounded-lg border border-werbens-dark-cyan/20 text-werbens-dark-cyan text-sm font-medium hover:bg-werbens-dark-cyan/5 transition min-h-[40px]"
              >
                Manage
              </button>
              <button
                type="button"
                onClick={() => onRemove(platformId)}
                className="px-4 py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition min-h-[40px]"
              >
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onConnect(platformId)}
              className="px-4 py-2.5 rounded-lg bg-werbens-dark-cyan text-werbens-alt-text text-sm font-medium hover:bg-werbens-dark-cyan/90 transition min-h-[40px]"
            >
              Add account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
