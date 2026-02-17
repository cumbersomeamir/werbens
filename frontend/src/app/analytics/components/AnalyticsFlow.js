"use client";

import { useState, useEffect } from "react";
import { AnalyticsLayout } from "./AnalyticsLayout";
import { AnalyticsHero } from "./AnalyticsHero";
import { DateRangeSelector } from "./DateRangeSelector";
import { OverviewStats } from "./OverviewStats";
import { ChannelCards } from "./ChannelCards";
import { SocialMediaSection } from "./SocialMediaSection";
import { useCurrentUser } from "@/app/onboarding/components/useCurrentUser";
import { getSocialAnalytics } from "@/lib/socialApi";

export function AnalyticsFlow() {
  const [dateRange, setDateRange] = useState("30 days");
  const [socialData, setSocialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { userId } = useCurrentUser();

  useEffect(() => {
    if (!userId) {
      setSocialData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getSocialAnalytics(userId)
      .then((r) => setSocialData(r.data || []))
      .catch(() => setSocialData([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <AnalyticsLayout>
      <AnalyticsHero
        dateRangeSelector={
          <div className="shrink-0">
            <DateRangeSelector value={dateRange} onChange={setDateRange} />
          </div>
        }
      />
      <OverviewStats socialData={socialData} loading={loading} />
      <ChannelCards socialData={socialData} loading={loading} />
      <SocialMediaSection userId={userId} />
    </AnalyticsLayout>
  );
}
