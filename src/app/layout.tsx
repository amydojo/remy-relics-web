import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";

import { getSiteUrl } from "@/config/site";
import { rootMetadata } from "@/seo/metadata";

import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = rootMetadata(getSiteUrl());

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geistMono.variable}>
      <body>{children}</body>
    </html>
  );
}
