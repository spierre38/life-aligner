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

                {/* iOS home screen icon */}
                <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

                {/* iOS PWA splash screens */}
                <link rel="apple-touch-startup-image"
                    media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
                    href="/splash/apple-splash-1290-2796.png" />
                <link rel="apple-touch-startup-image"
                    media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
                    href="/splash/apple-splash-1170-2532.png" />
                <link rel="apple-touch-startup-image"
                    media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                    href="/splash/apple-splash-828-1792.png" />

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
                        position="top-center"
                        containerStyle={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
                        toastOptions={{
                            duration: 3500,
                            style: {
                                background: 'rgba(18,18,24,0.96)',
                                color: '#ffffff',
                                border: '1px solid rgba(167,139,250,0.25)',
                                borderRadius: '14px',
                                fontFamily: 'var(--font-primary)',
                                backdropFilter: 'blur(12px)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                                padding: '12px 16px',
                                fontSize: '14px',
                            },
                            success: {
                                iconTheme: { primary: '#a78bfa', secondary: '#0a0a0a' },
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
