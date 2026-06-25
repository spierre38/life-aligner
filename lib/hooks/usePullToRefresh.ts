import { useEffect, useRef, useState, useCallback } from 'react';

interface PullToRefreshOptions {
    onRefresh: () => Promise<void>;
    threshold?: number;    // px to pull before triggering
    maxPull?: number;      // px cap on pull distance
}

interface PullToRefreshResult {
    pullDistance: number;  // 0–maxPull, for driving a spinner rotation/opacity
    isRefreshing: boolean;
    containerProps: {
        onTouchStart: (e: React.TouchEvent) => void;
        onTouchMove: (e: React.TouchEvent) => void;
        onTouchEnd: () => void;
    };
}

export function usePullToRefresh({
    onRefresh,
    threshold = 72,
    maxPull = 100,
}: PullToRefreshOptions): PullToRefreshResult {
    const startY = useRef(0);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const pulling = useRef(false);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Only activate pull-to-refresh when scrolled to the very top
        const scrollable = (e.currentTarget as HTMLElement).closest('[data-pull-scroll]') as HTMLElement | null;
        const scrollTop = scrollable ? scrollable.scrollTop : window.scrollY;
        if (scrollTop > 0) return;
        startY.current = e.touches[0].clientY;
        pulling.current = true;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!pulling.current || isRefreshing) return;
        const dy = e.touches[0].clientY - startY.current;
        if (dy <= 0) { setPullDistance(0); return; }
        // Rubber-band effect: resistance increases as you pull further
        const resistance = 0.45;
        setPullDistance(Math.min(dy * resistance, maxPull));
    }, [isRefreshing, maxPull]);

    const handleTouchEnd = useCallback(async () => {
        if (!pulling.current) return;
        pulling.current = false;

        if (pullDistance >= threshold) {
            setIsRefreshing(true);
            setPullDistance(threshold); // lock at threshold while refreshing
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [pullDistance, threshold, onRefresh]);

    return {
        pullDistance,
        isRefreshing,
        containerProps: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
    };
}
