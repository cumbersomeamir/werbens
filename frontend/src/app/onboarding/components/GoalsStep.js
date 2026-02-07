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
    <div className="w-full max-w-2xl">
      <h1 className="text-2xl font-bold text-werbens-dark-cyan mb-2">
        What do you want to create?
      </h1>
      <p className="text-werbens-text/80 mb-6">
        Helps us tailor content. Optional — you can change this anytime.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {GOALS.map((goal) => {
          const isSelected = goals.includes(goal.id);
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => toggleGoal(goal.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                isSelected
                  ? "border-werbens-dark-cyan bg-werbens-dark-cyan/10 text-werbens-dark-cyan"
                  : "border-werbens-dark-cyan/20 bg-white text-werbens-text hover:border-werbens-dark-cyan/40"
              }`}
            >
              <span className="text-xl mb-2">{goal.icon}</span>
              <span className="text-sm font-medium text-center">{goal.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onSkip(goals)}
          className="flex-1 py-3 rounded-xl border border-werbens-dark-cyan/20 text-werbens-dark-cyan font-medium hover:bg-werbens-dark-cyan/5 transition"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => onComplete(goals)}
          className="flex-1 py-3 rounded-xl bg-werbens-dark-cyan text-werbens-alt-text font-medium hover:bg-werbens-dark-cyan/90 transition"
        >
          Finish
        </button>
      </div>
    </div>
  );
}
