import { industryPages, solutionPages } from "./seoPages";

const siteUrl = "https://app.werbens.com";

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

  const solutionUrls = solutionPages.map((page) => ({
    path: `/app/solutions/${page.slug}`,
    priority: 0.85,
    changeFrequency: "monthly",
  }));
  const industryUrls = industryPages.map((page) => ({
    path: `/app/industries/${page.slug}`,
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  return [...publicPages, ...solutionUrls, ...industryUrls].map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
