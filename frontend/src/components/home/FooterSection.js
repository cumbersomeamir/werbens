import Link from "next/link";

const footerLinkClass =
  "inline-block text-werbens-alt-text/56 transition-colors duration-200 hover:text-werbens-light-cyan";

export function FooterSection() {
  return (
    <footer className="bg-werbens-midnight py-14 text-werbens-alt-text sm:py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] px-6 py-8 backdrop-blur-xl sm:px-8 sm:py-10">
          <div className="grid gap-10 md:grid-cols-[1.25fr_0.75fr_0.75fr_0.75fr]">
            <div>
              <p className="font-display gradient-text text-3xl font-bold">
                Werbens
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-werbens-alt-text/46">
                Autonomous content creation for modern marketing teams that need
                more output without more operational overhead.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-werbens-alt-text/32">
                Product
              </h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <Link href="/onboarding" className={footerLinkClass}>
                    Get started
                  </Link>
                </li>
                <li>
                  <Link href="/login" className={footerLinkClass}>
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/analytics" className={footerLinkClass}>
                    Analytics
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className={footerLinkClass}>
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-werbens-alt-text/32">
                Explore
              </h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <Link href="/create" className={footerLinkClass}>
                    Create
                  </Link>
                </li>
                <li>
                  <Link href="/accounts" className={footerLinkClass}>
                    Accounts
                  </Link>
                </li>
                <li>
                  <Link href="/templates" className={footerLinkClass}>
                    Templates
                  </Link>
                </li>
                <li>
                  <Link href="/automatic" className={footerLinkClass}>
                    Automatic
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-werbens-alt-text/32">
                Company
              </h4>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <Link href="/privacy" className={footerLinkClass}>
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className={footerLinkClass}>
                    Terms
                  </Link>
                </li>
                <li>
                  <a href="#" className={footerLinkClass}>
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className={footerLinkClass}>
                    About
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/8 pt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-werbens-alt-text/30">
              &copy; {new Date().getFullYear()} Werbens. AI content creation
              platform for social media, email marketing, and brand
              consistency.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
