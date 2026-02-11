"use client";

const VIBES = [
  { id: "minimal", label: "Minimal" },
  { id: "cinematic", label: "Cinematic" },
  { id: "bold", label: "Bold" },
  { id: "cleanCorporate", label: "Clean / Corporate" },
  { id: "playful", label: "Playful" },
  { id: "darkMoody", label: "Dark / Moody" },
  { id: "futuristic", label: "Futuristic" },
  { id: "lifestyle", label: "Lifestyle" },
];

const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "brandNeutral", label: "Brand neutral" },
];

function chipClass(selected) {
  return selected
    ? "border-2 border-werbens-light-cyan bg-werbens-light-cyan/25 text-werbens-alt-text font-semibold shadow-[0_0_12px_rgba(127,231,220,0.35)]"
    : "glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 hover:border-werbens-light-cyan/40 hover:bg-werbens-light-cyan/5";
}

export function Step4VisualStyle({ data, setData, onNext, onBack }) {
  const vibes = data.visualVibes || [];
  const toggleVibe = (id) => {
    if (vibes.includes(id)) {
      setData((d) => ({ ...d, visualVibes: vibes.filter((x) => x !== id) }));
    } else if (vibes.length < 3) {
      setData((d) => ({ ...d, visualVibes: [...vibes, id] }));
    }
  };

  const complexity = data.complexityPreference ?? 50;

  return (
    <div className="w-full animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl font-bold text-werbens-alt-text mb-2 tracking-tight">
        Visual style
      </h1>
      <p className="text-werbens-alt-text/60 mb-6 text-sm sm:text-base">
        Images and videos. Pick up to 3 vibes.
      </p>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Vibes (max 3)</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {VIBES.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => toggleVibe(v.id)}
            className={"px-3 py-2 rounded-lg border text-sm transition-all " + (vibes.includes(v.id) ? chipClass(true) : chipClass(false))}
          >
            {v.label}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Theme (optional)</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setData((d) => ({ ...d, visualTheme: data.visualTheme === t.id ? undefined : t.id }))}
            className={"px-3 py-2 rounded-lg border text-sm transition-all " + (data.visualTheme === t.id ? chipClass(true) : chipClass(false))}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Complexity: Simple ↔ Detailed</p>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-werbens-muted">Simple</span>
        <input
          type="range"
          min={0}
          max={100}
          value={complexity}
          onChange={(e) => setData((d) => ({ ...d, complexityPreference: Number(e.target.value) }))}
          className="flex-1 h-2 rounded-full appearance-none bg-werbens-slate accent-werbens-light-cyan"
        />
        <span className="text-xs text-werbens-muted">Detailed</span>
      </div>
      <p className="text-xs text-werbens-muted mb-8">{complexity}%</p>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-3.5 rounded-2xl glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 font-medium hover:text-werbens-alt-text min-h-[48px]">
          Back
        </button>
        <button type="button" onClick={onNext} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan text-werbens-alt-text font-semibold glow hover:opacity-90 min-h-[48px] shadow-elevated">
          Next
        </button>
      </div>
    </div>
  );
}
