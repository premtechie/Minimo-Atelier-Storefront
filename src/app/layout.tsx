import type { Metadata, Viewport } from "next";
import { Allura, DM_Sans, Montserrat, Varela_Round } from "next/font/google";
import { Clarity } from "@/components/clarity";
import { Footer } from "@/components/footer";
import { SiteTracking } from "@/components/site-tracking";
import { WaFab } from "@/components/wa-fab";
import { SearchSheet } from "@/components/search-sheet";
import { ShopProvider } from "@/components/shop-provider";
import { AccountProvider } from "@/components/account-provider";
import { ldJson, OG_IMAGE, siteGraph } from "@/lib/seo";
import { SITE_URL } from "@/lib/whatsapp";
import "./globals.css";

const display = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-display", display: "swap" });
const ui = Varela_Round({ subsets: ["latin"], weight: "400", variable: "--font-ui", display: "swap" });
const script = Allura({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });
const badge = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-badge", display: "swap" });

const DESCRIPTION =
  "Birthday return gifts for kids in Hyderabad, from under ₹99 a guest. Ready-made return-gift packs, build-your-own bags and hampers, gift-wrapped and name-tagged in 48 hours. Pickup in Gopanpally, delivery across Hyderabad and India.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Birthday Return Gifts in Hyderabad, Kids' Party Packs & Hampers · Minimo Atelier", template: "%s · Minimo Atelier" },
  description: DESCRIPTION,
  applicationName: "Minimo Atelier",
  openGraph: { siteName: "Minimo Atelier", type: "website", locale: "en_IN", images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  formatDetection: { telephone: false },
  // Search Console and Bing ownership checks, set in the host's settings when ready.
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } } : {}),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6B4433",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${display.variable} ${ui.variable} ${badge.variable} ${script.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(siteGraph()) }} />
        <ShopProvider>
          <AccountProvider>
            <a className="m-skip" href="#main">
              Skip to content
            </a>
            {children}
            <Footer />
            <WaFab />
            <SearchSheet />
          </AccountProvider>
        </ShopProvider>
        <Clarity />
        <SiteTracking />
      </body>
    </html>
  );
}
