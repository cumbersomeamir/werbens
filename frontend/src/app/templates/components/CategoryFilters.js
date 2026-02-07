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
    <section className="px-6 pb-6" aria-label="Template categories">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSelect(cat)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
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
