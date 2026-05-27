import { PortfolioGallery } from "../components/PortfolioGallery";
import { getApiBase, getPortfolioCatalog } from "../portfolioData";

export const revalidate = 300;

function toCategoryName(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const categoryName = toCategoryName(resolvedParams?.category);
  const categoryPath = `/app/portfolio/${resolvedParams?.category || ""}`;

  return {
    title: `${categoryName || "Portfolio"} Work`,
    description: `Explore Werbens ${categoryName || "portfolio"} creative work, including AI-powered videos, reels, ads, images, and brand campaign assets.`,
    alternates: {
      canonical: categoryPath,
    },
    openGraph: {
      title: `${categoryName || "Portfolio"} Work | Werbens`,
      description: `Category-wise Werbens creative work for ${categoryName || "brand campaigns"}.`,
      url: `https://app.werbens.com${categoryPath}`,
    },
  };
}

export default async function PortfolioCategoryPage({ params }) {
  const resolvedParams = await params;
  const apiBase = getApiBase();
  const { catalog, error } = await getPortfolioCatalog();

  return (
    <PortfolioGallery
      apiBase={apiBase}
      catalog={catalog}
      error={error}
      initialCategorySlug={resolvedParams?.category || ""}
    />
  );
}
