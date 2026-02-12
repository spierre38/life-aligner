'use client';

import { useCallback } from 'react';
import { trackEvent, analytics } from '@/lib/analytics';

/**
 * React hook for tracking analytics events.
 * Provides both the pre-defined analytics object and a generic trackEvent function.
 *
 * @example
 * const { analytics, trackEvent } = useAnalytics();
 * analytics.completeWorksheet('values');
 * trackEvent({ action: 'custom_action', category: 'custom' });
 */
export function useAnalytics() {
    const track = useCallback(
        (params: Parameters<typeof trackEvent>[0]) => {
            trackEvent(params);
        },
        []
    );

    return {
        analytics,
        trackEvent: track,
    };
}
