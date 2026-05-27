import { getPortfolioCatalog } from "./portfolio/portfolioData";

const siteUrl = "https://app.werbens.com";

function toCategorySlug(value) {
  return String(value || "")
    .trim()
    .replace(/&/g, "and")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function sitemap() {
  const now = new Date();
  const publicPages = [
    { path: "/app", priority: 1, changeFrequency: "weekly" },
    { path: "/app/portfolio", priority: 0.9, changeFrequency: "daily" },
    { path: "/app/packages", priority: 0.85, changeFrequency: "weekly" },
    { path: "/app/pricing", priority: 0.8, changeFrequency: "weekly" },
    { path: "/app/terms", priority: 0.2, changeFrequency: "yearly" },
    { path: "/app/privacy", priority: 0.2, changeFrequency: "yearly" },
  ];

  const { catalog } = await getPortfolioCatalog();
  const portfolioCategories = (catalog?.categories || []).map((category) => ({
    path: `/app/portfolio/${toCategorySlug(category.name)}`,
    priority: 0.7,
    changeFrequency: "daily",
  }));

  return [...publicPages, ...portfolioCategories].map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
