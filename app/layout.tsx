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
  title: "Kairos - Find the perfect time",
  description:
    "Track time zones across the globe for global travelers and remote teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${manrope.variable} ${firaMono.variable} antialiased bg-black text-white font-sans`}
        style={{ margin: 0, padding: 0, backgroundColor: "#000000" }}
      >
        {children}
      </body>
    </html>
  );
}
