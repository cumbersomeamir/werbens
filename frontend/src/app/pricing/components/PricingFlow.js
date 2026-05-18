"use client";

import { PricingLayout } from "./PricingLayout";
import { PricingHero } from "./PricingHero";
import { PlanCards } from "./PlanCards";
import { CurrencySelector, usePriceCountry } from "@/components/CurrencySelector";

export function PricingFlow({ initialCountry }) {
  const { country, updateCountry } = usePriceCountry(initialCountry);

  return (
    <PricingLayout>
      <PricingHero />
      <CurrencySelector country={country} onCountryChange={updateCountry} />
      <PlanCards country={country} />
    </PricingLayout>
  );
}
