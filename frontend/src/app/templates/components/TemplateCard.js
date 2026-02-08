"use client";

import Link from "next/link";

export function TemplateCard({ template, onCreate }) {
  return (
    <article className="group rounded-2xl overflow-hidden bg-white shadow-elevated hover-lift transition-all duration-300">
      <div
        className="aspect-[4/5] w-full relative overflow-hidden"
        style={{ background: template.preview }}
      >
        {/* Subtle persistent gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5" />

        {/* Hover overlay with backdrop blur */}
        <div className="absolute inset-0 bg-gradient-to-t from-werbens-midnight/80 via-werbens-deep/40 to-transparent opacity-0 sm:group-hover:opacity-100 backdrop-blur-[2px] sm:group-hover:backdrop-blur-[2px] transition-all duration-500" />

        {/* CTA button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-500 ease-out">
          <button
            type="button"
            onClick={() => onCreate(template)}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-werbens-dark-cyan to-werbens-light-cyan text-white font-semibold glow-sm hover:shadow-lg transition-all duration-300 min-h-[44px] text-sm sm:text-base"
          >
            Create for my brand
          </button>
        </div>

        {/* Category badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg glass-dark text-white text-xs font-medium tracking-wide">
          {template.category}
        </span>
      </div>

      <div className="p-3.5 sm:p-4">
        <h3 className="font-semibold text-werbens-text text-sm sm:text-base leading-snug">
          {template.title}
        </h3>
        <p className="text-xs sm:text-sm text-werbens-muted mt-1">
          {template.category}
        </p>
      </div>
    </article>
  );
}
