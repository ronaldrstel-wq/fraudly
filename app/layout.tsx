import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkAppProvider } from "@/components/providers/ClerkAppProvider";
import { CookieConsentProvider } from "@/components/CookieConsentProvider";
import { LocalePreferenceBoundary } from "@/components/i18n/LocalePreferenceBoundary";
import { logClerkProductionMisconfigWarnings } from "@/lib/clerkConfig";
import { JsonLd } from "@/components/JsonLd";
import { PwaServiceWorkerRegister } from "@/components/PwaServiceWorkerRegister";
import { OG_IMAGE } from "@/lib/seo-metadata";
import {
  defaultDescription,
  defaultKeywords,
  defaultOgDescription,
  defaultTitle,
  SITE_URL
} from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const viewport: Viewport = {
  themeColor: "#f9fafb",
  width: "device-width",
  initialScale: 1
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: "%s | Fraudly"
  },
  description: defaultDescription,
  keywords: [...defaultKeywords],
  applicationName: "Fraudly",
  authors: [{ name: "Fraudly" }],
  creator: "Fraudly",
  icons: {
    icon: "/icon.png"
  },
  openGraph: {
    type: "website",
    siteName: "Fraudly",
    locale: "en_US",
    url: SITE_URL,
    title: defaultTitle,
    description: defaultOgDescription,
    images: [OG_IMAGE]
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultOgDescription,
    images: [OG_IMAGE.url]
  },
  verification: {
    google: "yvX4fwn6V2j7VJX3YXVjh6qnuCuXndcSN2UXBhhve64"
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  }
};

logClerkProductionMisconfigWarnings();

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <PwaServiceWorkerRegister />
        <JsonLd />
        <ClerkAppProvider>
          <CookieConsentProvider>
            <LocalePreferenceBoundary />
            {children}
          </CookieConsentProvider>
        </ClerkAppProvider>
      </body>
    </html>
  );
}
