import type { Metadata } from "next";
import { CookieConsentProvider } from "@/components/CookieConsentProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fraudly.app"),
  title: "Fraudly — Know before you click",
  description: "Check suspicious links for scam risk in seconds.",
  icons: {
    icon: "/icon.png"
  },
  openGraph: {
    title: "Fraudly — Know before you click",
    description: "Check suspicious links for scam risk in seconds.",
    url: "https://fraudly.app",
    siteName: "Fraudly",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Fraudly — Know before you click",
    description: "Check suspicious links for scam risk in seconds."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <CookieConsentProvider>{children}</CookieConsentProvider>
      </body>
    </html>
  );
}
