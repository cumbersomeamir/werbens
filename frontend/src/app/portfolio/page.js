import { PortfolioGallery } from "./components/PortfolioGallery";
import { getApiBase, getPortfolioCatalog } from "./portfolioData";

export const revalidate = 300;

export const metadata = {
  title: "Portfolio | Werbens",
  description: "Werbens portfolio work grouped by category.",
};

export default async function PortfolioPage() {
  const apiBase = getApiBase();
  const { catalog, error } = await getPortfolioCatalog();

  return <PortfolioGallery apiBase={apiBase} catalog={catalog} error={error} />;
}
