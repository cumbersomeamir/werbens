import Link from "next/link";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-werbens-midnight py-20 text-werbens-alt-text sm:py-24 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(127,231,220,0.14),transparent_28%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(49,104,121,0.2),transparent_32%)]" />
      <div className="hero-grid absolute inset-0 opacity-20" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="panel-surface-dark rounded-[2.4rem] px-6 py-8 sm:px-10 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-werbens-light-cyan/68">
                Start now
              </p>
              <h2 className="font-display mt-4 text-4xl font-bold text-white sm:text-[3.4rem]">
                Ready to create content on autopilot?
              </h2>
            </div>

            <div className="lg:pl-10">
              <p className="text-lg leading-relaxed text-white/68">
                Join thousands of brands using Werbens to move from idea to
                finished campaign faster. Start free, no credit card required.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/onboarding"
                  className="inline-flex min-h-[56px] items-center justify-center rounded-2xl bg-gradient-to-r from-werbens-light-cyan to-[#a3f3ea] px-8 py-4 text-base font-semibold text-werbens-midnight shadow-[0_20px_55px_rgba(127,231,220,0.22)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-[56px] items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-8 py-4 text-base font-semibold text-white/88 transition-all duration-300 hover:border-werbens-light-cyan/28 hover:bg-white/[0.07]"
                >
                  Sign in
                </Link>
              </div>

              <p className="mt-5 text-sm uppercase tracking-[0.18em] text-white/42">
                Free plan includes 10 content pieces per month. Upgrade anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
