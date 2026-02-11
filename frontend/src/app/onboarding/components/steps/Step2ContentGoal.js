"use client";

const GOALS = [
  { id: "growAudience", label: "Grow audience", short: "Audience" },
  { id: "getLeads", label: "Get leads", short: "Leads" },
  { id: "buildAuthority", label: "Build authority", short: "Authority" },
  { id: "sellProduct", label: "Sell product", short: "Sell" },
  { id: "stayVisible", label: "Stay visible", short: "Visible" },
];

function cardClass(selected) {
  return selected
    ? "border-2 border-werbens-light-cyan bg-werbens-light-cyan/25 text-werbens-alt-text font-semibold shadow-[0_0_12px_rgba(127,231,220,0.35)]"
    : "glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 hover:border-werbens-light-cyan/40 hover:bg-werbens-light-cyan/5";
}

export function Step2ContentGoal({ data, setData, onNext, onBack }) {
  const secondaryGoal = data.secondaryGoal;

  return (
    <div className="w-full animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl font-bold text-werbens-alt-text mb-2 tracking-tight">
        What&apos;s your main content goal?
      </h1>
      <p className="text-werbens-alt-text/60 mb-6 text-sm sm:text-base">
        Why you create — we&apos;ll align copy and CTAs.
      </p>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Primary goal</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {GOALS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setData((d) => ({ ...d, primaryGoal: g.id }))}
            className={`p-4 rounded-2xl border transition-all text-left ${data.primaryGoal === g.id ? cardClass(true) : cardClass(false)}`}
          >
            <span className="font-medium">{g.label}</span>
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Secondary (optional)</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {GOALS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setData((d) => ({ ...d, secondaryGoal: secondaryGoal === g.id ? undefined : g.id }))}
            className={`px-3 py-2 rounded-lg border text-sm transition-all ${secondaryGoal === g.id ? cardClass(true) : cardClass(false)}`}
          >
            {g.short}
          </button>
        ))}
      </div>

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
