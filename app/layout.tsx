import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/app/components/Toast";
import { GoogleAnalytics } from "@/app/components/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";
import ServiceWorkerRegistrar from "@/app/components/ServiceWorkerRegistrar";
import InstallPromptBanner from "@/app/components/InstallPromptBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LifeAligner",
  description: "Align your goals with your values and purpose",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LifeAligner",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LifeAligner" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ServiceWorkerRegistrar />
        <InstallPromptBanner />
        <ToastProvider>
          {children}
        </ToastProvider>
        <Toaster />
        <GoogleAnalytics measurementId="G-DHFVLL796L" />
        <Analytics />
      </body>
    </html>
  );
}
