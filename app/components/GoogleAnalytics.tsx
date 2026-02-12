'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Track page views on route changes
function GoogleAnalyticsTracker({ measurementId }: { measurementId: string }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!measurementId || typeof window === 'undefined') return;

        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

        // Send page_view event to GA4
        window.gtag?.('config', measurementId, {
            page_path: url,
        });
    }, [pathname, searchParams, measurementId]);

    return null;
}

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
    if (!measurementId) return null;

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_auto_event: true,
              send_page_view: false,
            });
          `,
                }}
            />
            <Suspense fallback={null}>
                <GoogleAnalyticsTracker measurementId={measurementId} />
            </Suspense>
        </>
    );
}
