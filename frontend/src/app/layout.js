import "./globals.css";
import { AuthSessionProvider } from "@/components/SessionProvider";
import { Header } from "@/components/Header";

export const metadata = {
  title: "Werbens — AI Content Creation Platform | Autonomous Social Media, Ads & Email",
  description:
    "Create content for your business autonomously. AI-powered social media posts, ad copy, email marketing & brand-consistent campaigns at scale. Free trial.",
  keywords: [
    "AI content creation",
    "autonomous content",
    "social media automation",
    "brand voice AI",
    "content marketing platform",
    "social media management",
    "email copy AI",
    "marketing automation",
    "content at scale",
    "brand consistency",
    "AI writing tool",
  ].join(", "),
  openGraph: {
    title: "Werbens — AI Content Creation for Your Business",
    description: "Create content autonomously. Social media, ads, email—all at scale.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          <Header />
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
