"use client";

const CATEGORIES = [
  "All",
  "Social Posts",
  "Ad Creatives",
  "Email Headers",
  "Product Showcase",
  "Testimonials",
  "Blog Graphics",
  "Video Thumbnails",
  "Brand Story",
  "Campaign Launch",
  "Seasonal Promos",
  "Carousel Layouts",
  "Story Formats",
  "LinkedIn Posts",
  "Instagram Reels",
  "TikTok Style",
];

export function CategoryFilters({ selected, onSelect }) {
  return (
    <section className="px-4 sm:px-6 pb-4 sm:pb-6 overflow-x-hidden" aria-label="Template categories">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap gap-2 -mx-1 overflow-x-auto overflow-y-hidden pb-1 sm:overflow-visible sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelect(cat)}
              className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition min-h-[40px] ${
                selected === cat
                  ? "bg-werbens-dark-cyan text-white"
                  : "bg-werbens-light-cyan/40 text-werbens-dark-cyan hover:bg-werbens-light-cyan/60 border border-werbens-dark-cyan/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
