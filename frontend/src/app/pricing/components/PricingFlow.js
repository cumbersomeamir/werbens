"use client";

import { PricingLayout } from "./PricingLayout";
import { PricingHero } from "./PricingHero";
import { PlanCards } from "./PlanCards";

export function PricingFlow() {
  return (
    <PricingLayout>
      <PricingHero />
      <PlanCards />
    </PricingLayout>
  );
}
