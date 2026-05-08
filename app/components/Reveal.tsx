'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

/**
 * Reveal — fades a child up into view as it scrolls into the viewport.
 *
 * Premium-feel choice: 600ms ease-out with a 30px translate. Slow enough
 * to register, fast enough not to feel sluggish. Triggered once per element.
 *
 * Respects prefers-reduced-motion: skips the animation entirely for users
 * who've requested reduced motion at the OS level.
 */
type RevealProps = {
    children: ReactNode;
    /** Delay in ms before the animation starts. Useful for staggering siblings. */
    delay?: number;
    /** Tailwind class string applied to the wrapper. */
    className?: string;
};

export default function Reveal({ children, delay = 0, className = '' }: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Honour reduced motion preference — instant reveal, no animation.
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            setVisible(true);
            return;
        }

        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(30px)',
                transition: `opacity 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}
