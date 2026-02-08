"use client";

import { useState } from "react";
import { AnalyticsLayout } from "./AnalyticsLayout";
import { AnalyticsHero } from "./AnalyticsHero";
import { DateRangeSelector } from "./DateRangeSelector";
import { OverviewStats } from "./OverviewStats";
import { ChannelCards } from "./ChannelCards";
import { SocialMediaSection } from "./SocialMediaSection";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";

export function AnalyticsFlow() {
  const [dateRange, setDateRange] = useState("30 days");
  const { userId } = useCurrentUser();

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        dateRangeSelector={
          <div className="shrink-0">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
          </div>
        }
      />
      <OverviewStats />
      <ChannelCards />
      <SocialMediaSection userId={userId} />
    </AnalyticsLayout>
  );
}
