import { PortfolioGallery } from "../components/PortfolioGallery";
import { getApiBase, getPortfolioCatalog } from "../portfolioData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portfolio | Werbens",
  description: "Werbens portfolio work grouped by category.",
};

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
