import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/app/components/Toast";
import { GoogleAnalytics } from "@/app/components/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";
import ServiceWorkerRegistrar from "@/app/components/ServiceWorkerRegistrar";
import InstallPromptBanner from "@/app/components/InstallPromptBanner";
import ScrollToTop from "@/app/components/ScrollToTop";

// Body font — unchanged
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// New brand font for the wordmark only — not body text.
// Exposed as --font-cormorant, consumed by app/components/Wordmark.tsx.
const cormorant = Cormorant_Garamond({
    variable: "--font-cormorant",
    subsets: ["latin"],
    // We only need a couple of weights for the wordmark; fewer weights = smaller bundle.
    weight: ["500", "600"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Tim Collins Framework",
    description: "Align your goals with your values and purpose.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Tim Collins Framework",
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
                <meta name="apple-mobile-web-app-title" content="Tim Collins Framework" />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable}`}>
                <ServiceWorkerRegistrar />
                <InstallPromptBanner />
                <ScrollToTop />
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
