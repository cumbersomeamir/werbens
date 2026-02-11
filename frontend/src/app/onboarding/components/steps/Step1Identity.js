"use client";

import { useState } from "react";

const ROLES = [
  { id: "founder", label: "Founder" },
  { id: "creator", label: "Creator" },
  { id: "marketer", label: "Marketer" },
  { id: "freelancer", label: "Freelancer" },
  { id: "student", label: "Student" },
  { id: "other", label: "Other" },
];

const INDUSTRY_SUGGESTIONS = [
  "Technology", "E-commerce", "SaaS", "Agency", "Education", "Health", "Finance",
  "Real Estate", "Retail", "Media", "Food & Beverage", "Fashion", "Other",
];

const AUDIENCE_TYPES = [
  { id: "founders", label: "Founders" },
  { id: "consumers", label: "Consumers" },
  { id: "developers", label: "Developers" },
  { id: "recruiters", label: "Recruiters" },
  { id: "localCustomers", label: "Local customers" },
  { id: "students", label: "Students" },
  { id: "businessOwners", label: "Business owners" },
  { id: "other", label: "Other" },
];

function chipClass(selected) {
  return selected
    ? "border-2 border-werbens-light-cyan bg-werbens-light-cyan/25 text-werbens-alt-text font-semibold shadow-[0_0_12px_rgba(127,231,220,0.35)]"
    : "glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 hover:border-werbens-light-cyan/40 hover:bg-werbens-light-cyan/5";
}

export function Step1Identity({ data, setData, onNext, onBack }) {
  const [industrySearch, setIndustrySearch] = useState("");
  const industries = data.industries || [];
  const audienceTypes = data.audienceTypes || [];
  const industryOptions = INDUSTRY_SUGGESTIONS.filter((i) =>
    i.toLowerCase().includes(industrySearch.toLowerCase())
  );

  const toggleIndustry = (name) => {
    if (industries.includes(name)) {
      setData((d) => ({ ...d, industries: industries.filter((x) => x !== name) }));
    } else if (industries.length < 2) {
      setData((d) => ({ ...d, industries: [...industries, name] }));
    }
  };

  const toggleAudience = (id) => {
    const next = audienceTypes.includes(id) ? audienceTypes.filter((x) => x !== id) : [...audienceTypes, id];
    setData((d) => ({ ...d, audienceTypes: next }));
  };

  return (
    <div className="w-full animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl font-bold text-werbens-alt-text mb-2 tracking-tight">
        Who are you?
      </h1>
      <p className="text-werbens-alt-text/60 mb-6 text-sm sm:text-base">
        Identity and role. We use this to tailor content.
      </p>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Your role</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setData((d) => ({ ...d, primaryRole: r.id }))}
            className={"py-3 rounded-xl border transition-all text-sm font-medium " + (data.primaryRole === r.id ? chipClass(true) : chipClass(false))}
          >
            {r.label}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Industries (max 2)</p>
      <input
        type="text"
        value={industrySearch}
        onChange={(e) => setIndustrySearch(e.target.value)}
        placeholder="Search or pick below"
        className="w-full px-4 py-2.5 rounded-xl bg-werbens-slate/50 border border-werbens-steel text-werbens-alt-text placeholder:text-werbens-muted text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-werbens-glow/40"
      />
      <div className="flex flex-wrap gap-2 mb-6">
        {industryOptions.slice(0, 10).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => toggleIndustry(name)}
            className={"px-3 py-2 rounded-lg border text-sm transition-all " + (industries.includes(name) ? chipClass(true) : chipClass(false))}
          >
            {name}
          </button>
        ))}
      </div>

      <p className="text-sm font-medium text-werbens-alt-text/80 mb-2">Audience types</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {AUDIENCE_TYPES.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => toggleAudience(a.id)}
            className={"px-3 py-2 rounded-lg border text-sm transition-all " + (audienceTypes.includes(a.id) ? chipClass(true) : chipClass(false))}
          >
            {a.label}
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
