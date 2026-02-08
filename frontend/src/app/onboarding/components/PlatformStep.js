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
    <div className="w-full max-w-2xl animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl font-bold text-werbens-alt-text mb-2 tracking-tight">
        Connect your platforms
      </h1>
      <p className="text-werbens-alt-text/60 mb-8 text-sm sm:text-base">
        Select at least one platform to continue. You can add more later.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {PLATFORMS.map((platform, index) => {
          const isConnected = connectedPlatforms.includes(platform.id);
          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => onToggle(platform.id)}
              className={`animate-fade-in-up stagger-${Math.min(index + 1, 8)} group flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border transition-all duration-200 text-center min-h-[100px] sm:min-h-0 ${
                isConnected
                  ? "glass-dark border-werbens-light-cyan glow-sm bg-werbens-light-cyan/10 text-werbens-alt-text"
                  : "glass-dark border-werbens-steel/50 text-werbens-alt-text/80 hover:border-werbens-light-cyan/40 hover:bg-werbens-light-cyan/5"
              }`}
            >
              <span className={`text-2xl sm:text-3xl mb-2.5 transition-transform duration-200 group-hover:scale-110 ${
                isConnected ? "drop-shadow-[0_0_8px_rgba(0,188,212,0.4)]" : ""
              }`}>
                {platform.icon}
              </span>
              <span className="text-sm font-medium">{platform.name}</span>
              <span className={`text-xs mt-1.5 font-medium transition-colors ${
                isConnected ? "text-werbens-light-cyan" : "text-werbens-muted"
              }`}>
                {isConnected ? "Connected" : "Connect"}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-400 mb-4 animate-fade-in">{error}</p>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!hasAtLeastOne}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan text-werbens-alt-text font-semibold glow hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:glow-none transition-all duration-200 min-h-[48px] shadow-elevated"
      >
        Continue
      </button>
    </div>
  );
}
