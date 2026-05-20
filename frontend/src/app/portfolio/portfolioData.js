function emptyCatalog() {
  return {
    categories: [],
    generatedAt: null,
    totalImages: 0,
    totalItems: 0,
    totalVideos: 0,
  };
}

export function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "");
}

function attachMediaUrls(catalog, apiBase) {
  const source = catalog || emptyCatalog();
  const categories = Array.isArray(source.categories) ? source.categories : [];

  return {
    ...emptyCatalog(),
    ...source,
    categories: categories.map((category) => ({
      ...category,
      items: Array.isArray(category.items)
        ? category.items.map((item) => ({
            ...item,
            mediaUrl: item.mediaUrl || `${apiBase}${item.mediaPath || ""}`,
          }))
        : [],
    })),
  };
}

export async function getPortfolioCatalog() {
  const apiBase = getApiBase();

  try {
    const response = await fetch(`${apiBase}/api/portfolio`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Portfolio catalog request failed with ${response.status}`);
    }

    const catalog = await response.json();
    return {
      catalog: attachMediaUrls(catalog, apiBase),
      error: null,
    };
  } catch (error) {
    return {
      catalog: attachMediaUrls(emptyCatalog(), apiBase),
      error: "Portfolio media is unavailable right now.",
    };
  }
}
