"use client";

import { useState } from "react";

const GOALS = [
  { id: "social", label: "Social media posts", icon: "📱" },
  { id: "ads", label: "Ad campaigns", icon: "📢" },
  { id: "email", label: "Email marketing", icon: "✉️" },
  { id: "blog", label: "Blog & articles", icon: "📝" },
  { id: "video", label: "Video content", icon: "🎬" },
  { id: "brand", label: "Brand consistency", icon: "✨" },
];

export function GoalsStep({ initialGoals, onComplete, onSkip }) {
  const [goals, setGoals] = useState(initialGoals ?? []);

  const toggleGoal = (id) => {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full max-w-2xl animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl font-bold text-werbens-alt-text mb-2 tracking-tight">
        What do you want to create?
      </h1>
      <p className="text-werbens-alt-text/60 mb-8 text-sm sm:text-base">
        Helps us tailor content. Optional — you can change this anytime.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {GOALS.map((goal, index) => {
          const isSelected = goals.includes(goal.id);
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={`animate-fade-in-up stagger-${Math.min(index + 1, 8)} group flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border transition-all duration-200 min-h-[100px] sm:min-h-0 ${
                isSelected
                  ? "glass-dark border-werbens-light-cyan glow-sm bg-werbens-light-cyan/10 text-werbens-alt-text"
                  : "glass-dark border-werbens-steel/50 text-werbens-alt-text/80 hover:border-werbens-light-cyan/40 hover:bg-werbens-light-cyan/5"
              }`}
            >
              <span className={`text-2xl sm:text-3xl mb-2.5 transition-transform duration-200 group-hover:scale-110 ${
                isSelected ? "drop-shadow-[0_0_8px_rgba(0,188,212,0.4)]" : ""
              }`}>
                {goal.icon}
              </span>
              <span className="text-sm font-medium text-center">{goal.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => onSkip(goals)}
          className="flex-1 py-3.5 rounded-2xl glass-dark border border-werbens-steel/50 text-werbens-alt-text/80 font-medium hover:text-werbens-alt-text hover:border-werbens-light-cyan/40 transition-all duration-200 min-h-[48px]"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => onComplete(goals)}
          className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan text-werbens-alt-text font-semibold glow hover:opacity-90 transition-all duration-200 min-h-[48px] shadow-elevated"
        >
          Finish
        </button>
      </div>
    </div>
  );
}
