import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const dinCond = localFont({ src: "./fonts/DINPro-Cond.otf", variable: "--font-din-cond", display: "swap" });
const dinBold = localFont({ src: "./fonts/DINPro-CondBold.otf", variable: "--font-din-bold", display: "swap" });
const dinMedium = localFont({ src: "./fonts/DINPro-CondMedium.otf", variable: "--font-din-medium", display: "swap" });

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("futclaw:theme") || "dark";
    const resolved = stored === "system"
      ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : stored;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.classList.toggle("dark", resolved !== "light");
  } catch {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.classList.add("dark");
  }
})();
`;

const TITLE = "FutClaw — your GitHub, rated out of 99";
const DESCRIPTION =
  "Rate any GitHub profile out of 99 as a FIFA-Ultimate-Team-style player card, scored from real commits, stars and contributions. Get scouted and share your card.";

export const metadata: Metadata = {
  metadataBase: new URL("https://futclaw.com"),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "GitHub profile card",
    "rate my GitHub",
    "GitHub stats",
    "developer trading card",
    "FUT card",
    "GitHub rating",
    "World Cup",
    "FutClaw",
  ],
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { url: "/android-chrome-192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://futclaw.com",
    siteName: "FutClaw",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${dinCond.variable} ${dinBold.variable} ${dinMedium.variable} dark antialiased`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
