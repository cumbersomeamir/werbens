import Link from "next/link";

export function FooterSection() {
  return (
    <footer className="py-10 sm:py-12 md:py-16 bg-werbens-text text-werbens-alt-text">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-12">
          <div>
            <p className="text-xl font-bold text-werbens-light-cyan">Werbens</p>
            <p className="mt-2 text-sm text-werbens-alt-text/70">
              Autonomous content creation for modern marketing teams.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-werbens-alt-text/80">
              <li>
                <Link href="/onboarding" className="hover:text-werbens-light-cyan">
                  Get started
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-werbens-light-cyan">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/accounts" className="hover:text-werbens-light-cyan">
                  Accounts
                </Link>
              </li>
              <li>
                <Link href="/templates" className="hover:text-werbens-light-cyan">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-werbens-light-cyan">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-werbens-light-cyan">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-werbens-light-cyan">
                  Create
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-werbens-light-cyan">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-werbens-light-cyan">
                  Integrations
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-werbens-alt-text/80">
              <li>
                <a href="#" className="hover:text-werbens-light-cyan">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-werbens-light-cyan">
                  Help center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-werbens-light-cyan">
                  API docs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-werbens-alt-text/80">
              <li>
                <a href="#" className="hover:text-werbens-light-cyan">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-werbens-light-cyan">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-werbens-light-cyan">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-werbens-light-cyan">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-6 sm:pt-8 border-t border-werbens-alt-text/20 text-xs sm:text-sm text-werbens-alt-text/60 break-words">
          <p>
            © {new Date().getFullYear()} Werbens. AI content creation platform
            for social media, email marketing, and brand consistency.
          </p>
          <p className="mt-2">
            Keywords: AI content creation, autonomous content, social media
            automation, brand voice AI, content marketing platform, social
            media management, email copy AI, marketing automation, content at
            scale.
          </p>
        </div>
      </div>
    </footer>
  );
}
