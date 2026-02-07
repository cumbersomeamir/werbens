"use client";

import { useState } from "react";
import { AnalyticsLayout } from "./AnalyticsLayout";
import { AnalyticsHero } from "./AnalyticsHero";
import { DateRangeSelector } from "./DateRangeSelector";
import { OverviewStats } from "./OverviewStats";
import { ChannelCards } from "./ChannelCards";

export function AnalyticsFlow() {
  const [dateRange, setDateRange] = useState("30 days");

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
    </AnalyticsLayout>
  );
}
