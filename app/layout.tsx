import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = "https://modkitswatch.afifzafri.com";

export const metadata: Metadata = {
  title: "ModKit Swatch | Gunpla & Model Kit Paint Color Matcher",
  description:
    "The easiest way to find the right paint for your Gunpla or Gundam model kit. Upload a reference photo and instantly match colors across Mr. Color, Tamiya, Gaianotes, Jumpwind, and more. Free tool, no signup required.",
  keywords: [
    "gunpla paint matcher",
    "model kit paint finder",
    "hobby paint color match",
    "mr color paint chart",
    "tamiya paint equivalent",
    "gaianotes color chart",
    "jumpwind paint",
    "scale model paint",
    "paint color comparison",
    "delta e color matching",
    "gundam paint guide",
    "miniature painting tool",
  ],
  authors: [{ name: "ModKit Swatch" }],
  creator: "ModKit Swatch",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: "ModKit Swatch | Gunpla & Model Kit Paint Color Matcher",
    description:
      "Find the right paint for your Gunpla or Gundam model kit. Upload a photo and match colors across Mr. Color, Tamiya, Gaianotes, Jumpwind, and more.",
    siteName: "ModKit Swatch",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ModKit Swatch | Gunpla & Scale Model Paint Color Matcher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ModKit Swatch | Gunpla Paint Color Matcher",
    description:
      "Upload a photo, pick a color, get instant paint matches. Free tool for Gunpla, Gundam model kit, and scale model builders.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL(appUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ModKit Swatch",
    description:
      "Upload a photo and find matching hobby paints from Mr. Color, Tamiya, Gaianotes, Jumpwind, and more.",
    url: appUrl,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
