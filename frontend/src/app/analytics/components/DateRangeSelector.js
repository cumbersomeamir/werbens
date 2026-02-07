"use client";

import { useState } from "react";

const RANGES = ["7 days", "30 days", "90 days"];

export function DateRangeSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-werbens-dark-cyan/20 bg-white px-3 py-2 text-sm text-werbens-text hover:bg-werbens-light-cyan/20 transition"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {value}
        <svg
          className="h-4 w-4 text-werbens-text/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute right-0 z-20 mt-1 min-w-[120px] rounded-lg border border-werbens-dark-cyan/10 bg-white py-1 shadow-lg"
          >
            {RANGES.map((range) => (
              <li key={range} role="option">
                <button
                  type="button"
                  onClick={() => {
                    onChange(range);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm ${
                    value === range
                      ? "bg-werbens-light-cyan/30 text-werbens-dark-cyan font-medium"
                      : "text-werbens-text hover:bg-werbens-light-cyan/20"
                  }`}
                >
                  {range}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
