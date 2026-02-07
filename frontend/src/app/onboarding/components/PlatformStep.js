"use client";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📷" },
  { id: "facebook", name: "Facebook", icon: "👍" },
  { id: "twitter", name: "X (Twitter)", icon: "𝕏" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "youtube", name: "YouTube", icon: "▶️" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "pinterest", name: "Pinterest", icon: "📌" },
];

export function PlatformStep({ connectedPlatforms, onToggle, onContinue, error }) {
  const hasAtLeastOne = connectedPlatforms.length >= 1;

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold text-werbens-dark-cyan mb-2">
        Connect your platforms
      </h1>
      <p className="text-werbens-text/80 mb-6">
        Select at least one platform to continue. You can add more later.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {PLATFORMS.map((platform) => {
          const isConnected = connectedPlatforms.includes(platform.id);
          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => onToggle(platform.id)}
              className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition text-center min-h-[90px] sm:min-h-0 ${
                isConnected
                  ? "border-werbens-dark-cyan bg-werbens-dark-cyan/10 text-werbens-dark-cyan"
                  : "border-werbens-dark-cyan/20 bg-white text-werbens-text hover:border-werbens-dark-cyan/40"
              }`}
            >
              <span className="text-2xl mb-2">{platform.icon}</span>
              <span className="text-sm font-medium">{platform.name}</span>
              <span className="text-xs mt-1 opacity-80">
                {isConnected ? "Connected" : "Connect"}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!hasAtLeastOne}
        className="w-full py-3 rounded-xl bg-werbens-dark-cyan text-werbens-alt-text font-medium hover:bg-werbens-dark-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[48px]"
      >
        Continue
      </button>
    </div>
  );
}
