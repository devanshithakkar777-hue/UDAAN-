import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "UDAAN — Find Your Wings",
  description: "A personal growth and emotional wellness companion. Comfort when needed, challenge when necessary, encourage always.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "UDAAN", statusBarStyle: "default" },
  robots: { index: false },
};
export const viewport: Viewport = { themeColor: "#fff7ee", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
