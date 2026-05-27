import { PortfolioGallery } from "./components/PortfolioGallery";
import { getApiBase, getPortfolioCatalog } from "./portfolioData";

export const revalidate = 300;

export const metadata = {
  title: "Portfolio",
  description:
    "Explore Werbens creative work across ads, food and beverages, fashion, home decor, hospitality, personal brands, and more.",
  alternates: {
    canonical: "/app/portfolio",
  },
  openGraph: {
    title: "Werbens Portfolio",
    description:
      "Category-wise creative work from Werbens across AI-powered reels, ads, brand films, and visual campaigns.",
    url: "https://app.werbens.com/app/portfolio",
  },
};

export default async function PortfolioPage() {
  const apiBase = getApiBase();
  const { catalog, error } = await getPortfolioCatalog();

  return <PortfolioGallery apiBase={apiBase} catalog={catalog} error={error} />;
}
