"use client";

import { useState, useEffect } from "react";
import { AutomaticLayout } from "./AutomaticLayout";
import { ImageViewer } from "./ImageViewer";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import { generateAutomatic, getAutomaticImages } from "@/api/services/automaticService.js";

function AutomaticCard({ item, onClick }) {
  return (
    <div
      className="group overflow-hidden rounded-2xl bg-white/90 shadow-elevated hover-lift transition-all duration-300 border border-werbens-dark-cyan/5 cursor-pointer"
      onClick={() => onClick(item)}
    >
      <div className="aspect-[4/5] bg-werbens-cloud/60 overflow-hidden">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.prompt || "Generated content"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="p-3.5">
        <p className="text-xs text-werbens-muted leading-relaxed line-clamp-2">
          {item.prompt}
        </p>
      </div>
    </div>
  );
}

export function AutomaticFlow() {
  const { userId, loading } = useCurrentUser();
  const [items, setItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewerItem, setViewerItem] = useState(null);

  // Fetch cached images on mount
  useEffect(() => {
    if (!userId || loading) return;

    const fetchCachedImages = async () => {
      setIsLoading(true);
      try {
        const result = await getAutomaticImages({ userId });
        if (result?.items && Array.isArray(result.items)) {
          setItems(result.items);
        }
      } catch (err) {
        console.error("Error fetching cached images:", err);
        // Don't show error for initial load, just log it
      } finally {
        setIsLoading(false);
      }
    };

    fetchCachedImages();
  }, [userId, loading]);

  const handleGenerate = async () => {
    if (!userId || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateAutomatic({ userId });
      if (result?.image) {
        // Add new item to the top of the list
        const newItem = {
          prompt: result.prompt,
          imageUrl: result.image,
          createdAt: new Date().toISOString(),
        };
        setItems((prev) => [newItem, ...prev]);
      }
    } catch (err) {
      const message =
        err?.message ||
        err?.data?.error ||
        "Failed to generate personalised content";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const isDisabled = !userId || loading || isGenerating;

  return (
    <AutomaticLayout>
      <section className="px-4 sm:px-6 pt-8 sm:pt-10 pb-4 animate-fade-in-up">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                <span className="gradient-text">Automatic</span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-werbens-alt-text leading-relaxed max-w-xl">
                Personalised content for you, generated automatically from your
                context. Think of it like an explore page, tuned to your brand.
              </p>
            </div>
            <div className="flex sm:justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isDisabled}
                className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold min-w-[190px] min-h-[44px] transition-all duration-200 ${
                  isDisabled
                    ? "bg-werbens-steel/40 text-white/70 cursor-not-allowed"
                    : "bg-gradient-to-r from-werbens-dark-cyan to-werbens-midnight text-white shadow-elevated hover:shadow-elevated-lg active:scale-95"
                }`}
              >
                {isGenerating ? "Generating..." : "Generate personalised content"}
              </button>
            </div>
          </div>
          {error && (
            <p className="mt-3 text-xs text-red-600">
              {error}
            </p>
          )}
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          {isLoading && (
            <div className="py-16 sm:py-20 text-center text-werbens-muted">
              <p className="text-sm sm:text-base">Loading your content...</p>
            </div>
          )}

          {!isLoading && items.length === 0 && !isGenerating && !error && (
            <div className="py-16 sm:py-20 text-center text-werbens-muted">
              <p className="text-sm sm:text-base">
                The automatic feed is empty for now.
              </p>
              <p className="mt-2 text-xs">
                Tap &quot;Generate personalised content&quot; to create your first
                set of ideas.
              </p>
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <div className="grid gap-4 sm:gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item, idx) => (
                <AutomaticCard
                  key={item.imageKey || item.imageUrl || idx}
                  item={item}
                  onClick={(item) => setViewerItem(item)}
                />
              ))}
            </div>
          )}

          {/* Image Viewer Modal */}
          {viewerItem && (
            <ImageViewer
              image={viewerItem.imageUrl || viewerItem.image}
              prompt={viewerItem.prompt}
              imageKey={viewerItem.imageKey}
              onClose={() => setViewerItem(null)}
            />
          )}

          {/* Simple lazy loading: generate another item when user clicks */}
          {items.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isDisabled}
                className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold min-w-[160px] min-h-[44px] transition-all duration-200 ${
                  isDisabled
                    ? "bg-werbens-steel/40 text-white/70 cursor-not-allowed"
                    : "bg-white text-werbens-dark-cyan border border-werbens-dark-cyan/40 hover:bg-werbens-light-cyan/20 active:scale-95"
                }`}
              >
                {isGenerating ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      </section>
    </AutomaticLayout>
  );
}

