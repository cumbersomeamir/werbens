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
    <section className="px-4 sm:px-6 pb-6 sm:pb-8 overflow-x-hidden" aria-label="Template categories">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap gap-2.5 -mx-1 overflow-x-auto overflow-y-hidden pb-2 sm:overflow-visible sm:pb-0 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelect(cat)}
              className={`shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 min-h-[40px] ${
                selected === cat
                  ? "bg-werbens-dark-cyan text-white shadow-md glow-sm scale-[1.02]"
                  : "glass text-werbens-dark-cyan hover:bg-werbens-light-cyan/50 hover:scale-[1.04] hover:shadow-sm border border-werbens-dark-cyan/10"
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
