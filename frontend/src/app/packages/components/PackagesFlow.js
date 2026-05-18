"use client";

import { CurrencySelector, usePriceCountry } from "@/components/CurrencySelector";
import { PackagesHero } from "./PackagesHero";
import { PackageCards } from "./PackageCards";

export function PackagesFlow({ initialCountry }) {
  const { country, updateCountry } = usePriceCountry(initialCountry);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-werbens-mist to-werbens-surface">
      <main>
        <PackagesHero />
        <CurrencySelector country={country} onCountryChange={updateCountry} />
        <PackageCards country={country} />
      </main>
    </div>
  );
}
