"use client";

const FACE_OPTIONS = [
  { id: "myFace", label: "My face" },
  { id: "otherPeople", label: "Other people" },
  { id: "noFaces", label: "No faces" },
];

const FRAMING_OPTIONS = [
  { id: "closeUp", label: "Close-up" },
  { id: "wide", label: "Wide" },
  { id: "mixed", label: "Mixed" },
];

function chipClass(selected) {
  return selected
    ? "border-2 border-werbens-light-cyan bg-werbens-light-cyan/25 text-werbens-alt-text font-semibold shadow-[0_0_12px_rgba(127,231,220,0.35)]"
    : "glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 hover:border-werbens-light-cyan/40 hover:bg-werbens-light-cyan/5";
}

export function Step5HumanPresence({ data, setData, onNext, onBack }) {
  const showPeople = data.showPeople ?? true;
  const faceUsage = data.faceUsage ?? "noFaces";
  const framing = data.framing ?? "mixed";

  return (
    <div className="w-full animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl font-bold text-werbens-alt-text mb-2 tracking-tight">
        People in content?
      </h1>
      <p className="text-werbens-alt-text/60 mb-6 text-sm sm:text-base">
        Human presence and framing.
      </p>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Show people</p>
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setData((d) => ({ ...d, showPeople: true }))}
          className={"flex-1 py-3 rounded-xl border transition-all text-sm font-medium " + (showPeople ? chipClass(true) : chipClass(false))}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setData((d) => ({ ...d, showPeople: false, faceUsage: "noFaces" }))}
          className={"flex-1 py-3 rounded-xl border transition-all text-sm font-medium " + (!showPeople ? chipClass(true) : chipClass(false))}
        >
          No
        </button>
      </div>

      {showPeople && (
        <>
          <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Face usage</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {FACE_OPTIONS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setData((d) => ({ ...d, faceUsage: f.id }))}
                className={"px-3 py-2 rounded-lg border text-sm transition-all " + (faceUsage === f.id ? chipClass(true) : chipClass(false))}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Framing</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {FRAMING_OPTIONS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setData((d) => ({ ...d, framing: f.id }))}
            className={"px-3 py-2 rounded-lg border text-sm transition-all " + (framing === f.id ? chipClass(true) : chipClass(false))}
          >
            {f.label}
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
