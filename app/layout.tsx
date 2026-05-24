import type { Metadata } from "next";
import { Bonbon, Roboto } from "next/font/google";
import "./globals.css";

const bonbon = Bonbon({
  variable: "--font-bonbon",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Guinea Pig Photobooth",
  description: "Create cute guineapig photobooth strips with stickers",
  metadataBase: new URL("https://example.com"),
  applicationName: "Guinea Pig Photobooth",
  authors: [{ name: "Patcharalak Tulyakul" }],
  creator: "Patcharalak Tulyakul",
  keywords: [
    "guinea pig",
    "photobooth",
    "stickers",
  ],
  icons: {
    icon: "/lunar.png",
    shortcut: "/lunar.png",
    apple: "/lunar.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bonbon.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
