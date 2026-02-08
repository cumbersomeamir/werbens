export function AnalyticsHero({ dateRangeSelector }) {
  return (
    <section className="px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 animate-fade-in-up">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            <span className="gradient-text">Analytics</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-werbens-muted max-w-2xl leading-relaxed">
            Unified dashboard to track the performance of all channels — social
            media, ad creatives, and email campaigns in one place.
          </p>
        </div>
        {dateRangeSelector}
      </div>
    </section>
  );
}
