import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Guest Portal | Fast Send",
  description: "Your personalized trip gallery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {/* Eruda Mobile Console for debugging */}
        <Script src="//cdn.jsdelivr.net/npm/eruda" strategy="beforeInteractive" />
        <Script id="eruda-init" strategy="afterInteractive">
          {`if (typeof eruda !== 'undefined') eruda.init();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
