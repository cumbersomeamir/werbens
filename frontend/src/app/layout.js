import "./globals.css";
import { AuthSessionProvider } from "@/components/SessionProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { Manrope, Space_Grotesk } from "next/font/google";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  metadataBase: new URL("https://app.werbens.com"),
  title: {
    default: "Werbens — Marketing Company and AI Content Platform",
    template: "%s | Werbens",
  },
  description:
    "Werbens is a marketing company that owns and operates an AI-powered platform for brand content, social posts, ad creatives, visuals, and campaign assets.",
  keywords: [
    "AI content creation",
    "AI content creation platform",
    "social media automation",
    "AI reels",
    "AI video content",
    "AI ad creatives",
    "brand voice AI",
    "brand content studio",
    "content marketing platform",
    "social media management",
    "marketing automation",
  ].join(", "),
  alternates: {
    canonical: "https://app.werbens.com/app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Werbens — Marketing Company and AI Content Platform",
    description:
      "A marketing company operating an AI-powered platform for brand content, social posts, ad creatives, visuals, and campaign assets.",
    url: "https://app.werbens.com/app",
    siteName: "Werbens",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Werbens — Marketing Company and AI Content Platform",
    description:
      "A marketing company operating an AI-powered platform for brand content, social posts, ad creatives, visuals, and campaign assets.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  if (window.localStorage.getItem("werbens-theme") === "night") {
    document.documentElement.classList.add("night");
  }
} catch (_) {}
            `.trim(),
          }}
        />
        <AuthSessionProvider>
          <AuthGuard>
            <Header />
            <div className="pt-28 sm:pt-32">
              {children}
            </div>
          </AuthGuard>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
