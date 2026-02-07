import "./globals.css";
import { AuthSessionProvider } from "@/components/SessionProvider";

export const metadata = {
  title: "Werbens — Autonomous Content for Your Business",
  description:
    "Create content for your business or product totally autonomously.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
