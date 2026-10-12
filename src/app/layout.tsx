import type { Metadata, Viewport } from "next";
import { Outfit, Pixelify_Sans, Press_Start_2P } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const ui = Outfit({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
const pixel = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixel", display: "swap" });
const logo = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-logo", display: "swap" });

export const metadata: Metadata = {
  title: "Daily Battle",
  description: "Uma batalha por dia contra um campeão. Mesmo time para todo o servidor.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070b18",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${ui.variable} ${pixel.variable} ${logo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
