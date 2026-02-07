"use client";

import Link from "next/link";

export function TemplateCard({ template, onCreate }) {
  return (
    <article className="group rounded-2xl overflow-hidden bg-white border border-werbens-dark-cyan/15 hover:border-werbens-dark-cyan/30 shadow-sm hover:shadow-md transition-all duration-300">
      <div
        className="aspect-[4/5] w-full relative overflow-hidden"
        style={{ background: template.preview }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
          <button
            type="button"
            onClick={() => onCreate(template)}
            className="w-full py-3 rounded-xl bg-werbens-light-cyan text-werbens-dark-cyan font-semibold hover:bg-werbens-light-cyan/90 transition"
          >
            Create for my brand
          </button>
        </div>
        <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 text-white text-xs font-medium">
          {template.category}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-werbens-text">{template.title}</h3>
        <p className="text-sm text-werbens-text/60 mt-1">
          {template.category}
        </p>
      </div>
    </article>
  );
}
