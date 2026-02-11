"use client";

const TONES = [
  { id: "direct", label: "Direct" },
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "inspirational", label: "Inspirational" },
  { id: "opinionated", label: "Opinionated" },
];

const EMOJI_LEVELS = [
  { id: "none", label: "None" },
  { id: "few", label: "Few" },
  { id: "normal", label: "Normal" },
  { id: "heavy", label: "Heavy" },
];

const CTA_STYLES = [
  { id: "never", label: "Never" },
  { id: "soft", label: "Soft" },
  { id: "clear", label: "Clear" },
];

function cardClass(selected) {
  return selected
    ? "border-2 border-werbens-light-cyan bg-werbens-light-cyan/25 text-werbens-alt-text font-semibold shadow-[0_0_12px_rgba(127,231,220,0.35)]"
    : "glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 hover:border-werbens-light-cyan/40 hover:bg-werbens-light-cyan/5";
}

export function Step6VoiceDna({ data, setData, onSubmit, onBack, submitting }) {
  const formality = data.formality ?? 50;

  return (
    <div className="w-full animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl font-bold text-werbens-alt-text mb-2 tracking-tight">
        How you sound
      </h1>
      <p className="text-werbens-alt-text/60 mb-6 text-sm sm:text-base">
        Voice DNA. Tone, emojis, CTAs, formality.
      </p>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Tone</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {TONES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setData((d) => ({ ...d, tone: t.id }))}
            className={"p-3 rounded-xl border transition-all text-sm " + (data.tone === t.id ? cardClass(true) : cardClass(false))}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Emoji level</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {EMOJI_LEVELS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setData((d) => ({ ...d, emojiLevel: e.id }))}
            className={"px-3 py-2 rounded-lg border text-sm transition-all " + (data.emojiLevel === e.id ? cardClass(true) : cardClass(false))}
          >
            {e.label}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">CTA style</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {CTA_STYLES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setData((d) => ({ ...d, ctaStyle: c.id }))}
            className={"px-3 py-2 rounded-lg border text-sm transition-all " + (data.ctaStyle === c.id ? cardClass(true) : cardClass(false))}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Formality: Casual ↔ Formal</p>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-werbens-muted">Casual</span>
        <input
          type="range"
          min={0}
          max={100}
          value={formality}
          onChange={(e) => setData((d) => ({ ...d, formality: Number(e.target.value) }))}
          className="flex-1 h-2 rounded-full appearance-none bg-werbens-slate accent-werbens-light-cyan"
        />
        <span className="text-xs text-werbens-muted">Formal</span>
      </div>
      <p className="text-xs text-werbens-muted mb-8">{formality}%</p>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} disabled={submitting} className="flex-1 py-3.5 rounded-2xl glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 font-medium hover:text-werbens-alt-text min-h-[48px] disabled:opacity-50">
          Back
        </button>
        <button
          type="button"
          onClick={() => onSubmit(data)}
          disabled={submitting}
          className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan text-werbens-alt-text font-semibold glow hover:opacity-90 min-h-[48px] shadow-elevated disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving…" : "Finish"}
        </button>
      </div>
    </div>
  );
}
