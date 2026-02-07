import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-werbens-dark-cyan text-werbens-alt-text">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
          Ready to create content on autopilot?
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-werbens-alt-text/80 mb-8 sm:mb-10">
          Join thousands of brands using Werbens. Start free, no credit card
          required. Scale your content without scaling your team.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
          <Link
            href="/onboarding"
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-werbens-light-cyan text-werbens-text font-semibold text-base sm:text-lg hover:bg-werbens-light-cyan/90 transition hover:scale-105 min-h-[48px] flex items-center justify-center"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl border-2 border-werbens-alt-text/30 text-werbens-alt-text font-semibold text-base sm:text-lg hover:bg-werbens-alt-text/10 transition min-h-[48px] flex items-center justify-center"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-6 text-sm text-werbens-alt-text/60">
          Free plan includes 10 content pieces per month. Upgrade anytime.
        </p>
      </div>
    </section>
  );
}
