import type { Metadata, Viewport } from "next";
import { Allura, DM_Sans, Montserrat, Varela_Round } from "next/font/google";
import { Footer } from "@/components/footer";
import { WaFab } from "@/components/wa-fab";
import { SearchSheet } from "@/components/search-sheet";
import { ShopProvider } from "@/components/shop-provider";
import { SITE_URL } from "@/lib/whatsapp";
import "./globals.css";

const display = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-display", display: "swap" });
const ui = Varela_Round({ subsets: ["latin"], weight: "400", variable: "--font-ui", display: "swap" });
const script = Allura({ subsets: ["latin"], weight: "400", variable: "--font-script", display: "swap" });
const badge = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-badge", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Minimo Atelier · Return gifts and hampers, Hyderabad", template: "%s · Minimo Atelier" },
  description:
    "Return gifts kids actually keep, and hampers built from real stock. Gift-wrapped, name-tagged and ready in 48 hours. Free pickup inside Honer Vivantis, Hyderabad.",
  applicationName: "Minimo Atelier",
  openGraph: { siteName: "Minimo Atelier", type: "website", locale: "en_IN" },
  formatDetection: { telephone: false },
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
        <ShopProvider>
          <a className="m-skip" href="#main">
            Skip to content
          </a>
          {children}
          <Footer />
          <WaFab />
          <SearchSheet />
        </ShopProvider>
      </body>
    </html>
  );
}
