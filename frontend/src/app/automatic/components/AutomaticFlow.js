"use client";

import { useState, useEffect } from "react";
import { AutomaticLayout } from "./AutomaticLayout";
import { ImageViewer } from "./ImageViewer";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import { generateAutomatic, getAutomaticImages, deleteAutomaticImage } from "@/api/services/automaticService.js";
import { getSocialAccounts } from "@/lib/socialApi";

const PLATFORM_LABELS = {
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  pinterest: "Pinterest",
};

function AutomaticCard({ item, onClick, onDelete, userId }) {
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!userId || !item.imageKey || !onDelete) return;
    try {
      await deleteAutomaticImage({ userId, imageKey: item.imageKey });
      onDelete(item);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div
      className="group overflow-hidden rounded-2xl bg-white/90 shadow-elevated hover-lift transition-all duration-300 border border-werbens-dark-cyan/5 cursor-pointer relative"
      onClick={() => onClick(item)}
    >
      {item.imageKey && (
        <button
          type="button"
          onClick={handleDelete}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/90 shadow-sm border border-werbens-steel/20 text-werbens-muted hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all focus:outline-none"
          aria-label="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
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
        {item.platform && (
          <span className="inline-block text-[10px] font-medium text-werbens-dark-cyan/80 uppercase tracking-wide mb-1">
            {PLATFORM_LABELS[item.platform] || item.platform}
          </span>
        )}
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
  const [selectedPlatform, setSelectedPlatform] = useState(null); // null = priority
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);

  // Fetch connected platforms
  useEffect(() => {
    if (!userId || loading) return;
    getSocialAccounts(userId).then((res) => {
      const platforms = [...new Set((res?.accounts || []).map((a) => a.platform).filter(Boolean))];
      setConnectedPlatforms(platforms);
    }).catch(() => {});
  }, [userId, loading]);

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
      const result = await generateAutomatic({
        userId,
        platform: selectedPlatform || undefined,
      });
      if (result?.image) {
        const newItem = {
          prompt: result.prompt,
          imageUrl: result.image,
          imageKey: result.imageKey,
          platform: result.platform || null,
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
          {/* Platform selector */}
          {connectedPlatforms.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-werbens-muted font-medium">Generate for:</span>
              <button
                type="button"
                onClick={() => setSelectedPlatform(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPlatform === null
                    ? "bg-werbens-dark-cyan text-white border-2 border-werbens-dark-cyan"
                    : "bg-white/80 text-werbens-muted border border-werbens-dark-cyan/20 hover:border-werbens-dark-cyan/40"
                }`}
              >
                Priority
              </button>
              {connectedPlatforms.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedPlatform === p
                      ? "bg-werbens-dark-cyan text-white border-2 border-werbens-dark-cyan"
                      : "bg-white/80 text-werbens-muted border border-werbens-dark-cyan/20 hover:border-werbens-dark-cyan/40"
                  }`}
                >
                  {PLATFORM_LABELS[p] || p}
                </button>
              ))}
            </div>
          )}
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
                  userId={userId}
                  onClick={(item) => setViewerItem(item)}
                  onDelete={(item) => setItems((prev) => prev.filter((i) => (i.imageKey || i.imageUrl) !== (item.imageKey || item.imageUrl)))}
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

