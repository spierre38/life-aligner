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

        // DEBUG: Log to console
        console.log('📊 GA4 Page View:', url);

        // Send page_view event to GA4
        window.gtag?.('config', measurementId, {
            page_path: url,
        });
    }, [pathname, searchParams, measurementId]);

    return null;
}

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
    // DEBUG: Log measurement ID
    console.log('🔍 GA4 Measurement ID:', measurementId);

    if (!measurementId) {
        console.warn('⚠️ GA4 Measurement ID is missing!');
        return null;
    }

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
                onLoad={() => console.log('✅ GA4 Script Loaded!')}
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
            console.log('✅ GA4 Initialized!');
          `,
                }}
            />
            <Suspense fallback={null}>
                <GoogleAnalyticsTracker measurementId={measurementId} />
            </Suspense>
        </>
    );
}
