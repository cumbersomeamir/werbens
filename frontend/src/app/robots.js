const siteUrl = "https://app.werbens.com";

export default function robots() {
  return {
    rules: [
      {
        userAgent: ["OAI-SearchBot", "Claude-SearchBot", "Claude-User", "Googlebot", "bingbot"],
        allow: [
          "/app",
          "/app/portfolio",
          "/app/packages",
          "/app/pricing",
          "/app/solutions",
          "/app/industries",
          "/app/terms",
          "/app/privacy",
        ],
        disallow: [
          "/app/accounts",
          "/app/analytics",
          "/app/automatic",
          "/app/create",
          "/app/feedback-loop",
          "/app/ideation-engine",
          "/app/login",
          "/app/onboarding",
          "/app/post",
          "/app/reports",
          "/app/templates",
          "/app/youtube",
          "/app/api",
        ],
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "Google-Extended"],
        disallow: ["/"],
      },
      {
        userAgent: "*",
        allow: [
          "/app",
          "/app/portfolio",
          "/app/packages",
          "/app/pricing",
          "/app/solutions",
          "/app/industries",
          "/app/terms",
          "/app/privacy",
        ],
        disallow: [
          "/app/accounts",
          "/app/analytics",
          "/app/automatic",
          "/app/create",
          "/app/feedback-loop",
          "/app/ideation-engine",
          "/app/login",
          "/app/onboarding",
          "/app/post",
          "/app/reports",
          "/app/templates",
          "/app/youtube",
          "/app/api",
        ],
      },
    ],
    sitemap: `${siteUrl}/app/sitemap.xml`,
    host: siteUrl,
  };
}
