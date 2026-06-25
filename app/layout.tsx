import type { Metadata } from "next";
import { Inter, Geist_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/app/components/Toast";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { GoogleAnalytics } from "@/app/components/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";
import ServiceWorkerRegistrar from "@/app/components/ServiceWorkerRegistrar";
import InstallPromptBanner from "@/app/components/InstallPromptBanner";
import ScrollToTop from "@/app/components/ScrollToTop";
import MobileBottomNav from "@/app/components/MobileBottomNav";

// Tim 2026 primary font — matches the kit's typography spec exactly.
// Exposed as --font-inter, used by globals.css --font-primary token.
const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// Wordmark-only brand font — Cormorant Garamond stays for Wordmark.tsx.
const cormorant = Cormorant_Garamond({
    variable: "--font-cormorant",
    subsets: ["latin"],
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
    themeColor: "#000000",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-theme="dark">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/icons/icon.svg" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Tim Collins Framework" />
            </head>
            <body className={`${inter.variable} ${geistMono.variable} ${cormorant.variable}`}>
                <ThemeProvider>
                    <ServiceWorkerRegistrar />
                    <InstallPromptBanner />
                    <ScrollToTop />
                    <ToastProvider>
                        {children}
                    </ToastProvider>
                    <MobileBottomNav />
                    <Toaster
                        toastOptions={{
                            style: {
                                background: '#1a1a1a',
                                color: '#ffffff',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontFamily: 'var(--font-primary)',
                            },
                        }}
                    />
                    <GoogleAnalytics measurementId="G-DHFVLL796L" />
                    <Analytics />
                </ThemeProvider>
            </body>
        </html>
    );
}
