import { PackagesHero } from "./PackagesHero";
import { PackageCards } from "./PackageCards";

export function PackagesFlow() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-werbens-mist to-werbens-surface">
      <main>
        <PackagesHero />
        <PackageCards />
      </main>
    </div>
  );
}
