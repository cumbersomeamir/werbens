export function AnalyticsHero({ dateRangeSelector }) {
  return (
    <section className="px-6 pt-12 pb-8">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-werbens-dark-cyan">
            Analytics
          </h1>
          <p className="mt-2 text-werbens-text/80 max-w-2xl">
            Unified dashboard to track the performance of all channels — social
            media, ad creatives, and email campaigns in one place.
          </p>
        </div>
        {dateRangeSelector}
      </div>
    </section>
  );
}
