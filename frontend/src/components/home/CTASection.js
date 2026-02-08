import Link from "next/link";

export function CTASection() {
  return (
    <section className="relative py-20 sm:py-24 md:py-32 bg-werbens-midnight text-werbens-alt-text overflow-hidden noise">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-werbens-dark-cyan/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-werbens-light-cyan/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-werbens-glow/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 sm:mb-7 gradient-text-light leading-tight tracking-tight animate-fade-in stagger-1">
          Ready to create content on autopilot?
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-werbens-alt-text/60 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in stagger-2">
          Join thousands of brands using Werbens. Start free, no credit card
          required. Scale your content without scaling your team.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-5 animate-fade-in stagger-3">
          <Link
            href="/onboarding"
            className="px-9 sm:px-11 py-4 sm:py-[18px] rounded-2xl bg-werbens-light-cyan text-werbens-midnight font-semibold text-base sm:text-lg glow animate-pulse-glow hover:scale-105 transition-transform duration-200 min-h-[52px] flex items-center justify-center"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="px-9 sm:px-11 py-4 sm:py-[18px] rounded-2xl glass-dark font-semibold text-base sm:text-lg text-werbens-alt-text/90 hover:text-werbens-alt-text hover-lift transition-all duration-200 min-h-[52px] flex items-center justify-center"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-8 text-sm text-werbens-alt-text/40 animate-fade-in stagger-4">
          Free plan includes 10 content pieces per month. Upgrade anytime.
        </p>
      </div>
    </section>
  );
}
