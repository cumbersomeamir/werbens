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
        className="flex items-center gap-2.5 rounded-xl border border-werbens-dark-cyan/15 bg-white px-4 py-2.5 text-sm font-medium text-werbens-text shadow-elevated hover:border-werbens-dark-cyan/30 hover:shadow-elevated-lg transition-all duration-200 min-h-[44px] shrink-0"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <svg
          className="h-4 w-4 text-werbens-dark-cyan"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
        {value}
        <svg
          className={`h-4 w-4 text-werbens-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
            className="absolute right-0 z-20 mt-2 min-w-[160px] rounded-xl border border-werbens-dark-cyan/10 bg-white py-1.5 shadow-elevated-lg animate-scale-in origin-top-right"
          >
            {RANGES.map((range) => (
              <li key={range} role="option" aria-selected={value === range}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(range);
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm min-h-[44px] flex items-center gap-2.5 transition-colors duration-150 ${
                    value === range
                      ? "bg-werbens-light-cyan/20 text-werbens-dark-cyan font-semibold"
                      : "text-werbens-text hover:bg-werbens-mist/60"
                  }`}
                >
                  {value === range && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-werbens-dark-cyan" />
                  )}
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
