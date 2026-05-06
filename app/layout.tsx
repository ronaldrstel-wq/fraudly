import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { CookieConsentProvider } from "@/components/CookieConsentProvider";
import { JsonLd } from "@/components/JsonLd";
import { InstallPromptProvider } from "@/components/save-fraudly/install-prompt-context";
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
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

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
          <InstallPromptProvider>
            <PwaServiceWorkerRegister />
            <JsonLd />
            <CookieConsentProvider>{children}</CookieConsentProvider>
          </InstallPromptProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
