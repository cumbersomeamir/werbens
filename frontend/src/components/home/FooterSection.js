import Link from "next/link";

const footerLinkClass =
  "inline-block text-werbens-alt-text/50 hover:text-werbens-light-cyan hover:translate-x-0.5 transition-all duration-200";

export function FooterSection() {
  return (
    <footer className="py-14 sm:py-16 md:py-20 bg-werbens-midnight text-werbens-alt-text">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 sm:gap-12 md:gap-16 mb-12 sm:mb-16">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-2xl font-bold gradient-text tracking-tight">Werbens</p>
            <p className="mt-3 text-sm text-werbens-alt-text/40 leading-relaxed max-w-xs">
              Autonomous content creation for modern marketing teams.
            </p>
          </div>

          {/* Product column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-werbens-alt-text/30 mb-5">
              Product
            </h4>
            <ul className="space-y-3 text-sm">
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
                <Link href="/analytics" className={footerLinkClass}>
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={footerLinkClass}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/create" className={footerLinkClass}>
                  Create
                </Link>
              </li>
              <li>
                <a href="#" className={footerLinkClass}>
                  Features
                </a>
              </li>
              <li>
                <a href="#" className={footerLinkClass}>
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-werbens-alt-text/30 mb-5">
              Resources
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className={footerLinkClass}>
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className={footerLinkClass}>
                  Help center
                </a>
              </li>
              <li>
                <a href="#" className={footerLinkClass}>
                  API docs
                </a>
              </li>
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-werbens-alt-text/30 mb-5">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className={footerLinkClass}>
                  About
                </a>
              </li>
              <li>
                <a href="#" className={footerLinkClass}>
                  Contact
                </a>
              </li>
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
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-werbens-alt-text/8">
          <p className="text-xs text-werbens-alt-text/30">
            &copy; {new Date().getFullYear()} Werbens. AI content creation platform
            for social media, email marketing, and brand consistency.
          </p>
        </div>
      </div>
    </footer>
  );
}
