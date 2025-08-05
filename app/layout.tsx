import type { Metadata } from "next";
import { Fira_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const firaMono = Fira_Mono({
  variable: "--font-fira-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kairos-time.app"),
  title: "Kairos – Smart World Clock & Timezone Converter",
  description:
    "Easily compare timezones, track current times in cities worldwide, and plan meetings smarter with Kairos – your sleek, modern timezone companion.",
  keywords: [
    "timezone app",
    "world clock app",
    "timezone converter",
    "time difference calculator",
    "meeting planner tool",
    "global time tracker",
    "compare timezones",
    "current time in cities",
  ],
  authors: [{ name: "Burak Başcı" }],
  creator: "Burak Başcı",
  publisher: "Burak Başcı",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kairos",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Kairos – Smart World Clock & Timezone Converter",
    description:
      "Easily compare timezones, track current times in cities worldwide, and plan meetings smarter with Kairos – your sleek, modern timezone companion.",
    url: "https://kairos-time.app",
    siteName: "Kairos",
    images: [
      {
        url: "https://kairos-time.app/social-preview.png",
        width: 1200,
        height: 630,
        alt: "Kairos - Smart World Clock & Timezone Converter",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kairos – Smart World Clock & Timezone Converter",
    description:
      "Easily compare timezones, track current times in cities worldwide, and plan meetings smarter with Kairos – your sleek, modern timezone companion.",
    images: ["https://kairos-time.app/social-preview.png"],
    site: "@kairos",
    creator: "@burakbasci",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-F2PBJ7JQCF"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-F2PBJ7JQCF');
            `,
          }}
        />
      </head>
      <body
        className={`${manrope.variable} ${firaMono.variable} antialiased bg-black text-white font-sans`}
        style={{ margin: 0, padding: 0, backgroundColor: "#000000" }}
      >
        {children}
      </body>
    </html>
  );
}
