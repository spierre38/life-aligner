/**
 * Wordmark component
 *
 * The brand lockup: "TIM COLLINS" stacked above smaller "FRAMEWORK".
 * Uses the Cormorant Garamond serif loaded in app/layout.tsx via the
 * --font-cormorant CSS variable.
 *
 * One place for the brand — change it here and everything follows.
 */

type WordmarkSize = 'sm' | 'md' | 'lg';

type WordmarkProps = {
    size?: WordmarkSize;
    /**
     * Tailwind color class applied to both lines. Defaults to text-gray-900.
     * Override for dark backgrounds (e.g. "text-white").
     */
    colorClassName?: string;
};

// Size presets. Each entry is [topLineClass, bottomLineClass].
// The bottom line is always smaller and more spaced out than the top.
const SIZES: Record<WordmarkSize, { top: string; bottom: string }> = {
    sm: {
        top: 'text-lg leading-none',
        bottom: 'text-[10px] tracking-[0.25em] leading-none',
    },
    md: {
        top: 'text-2xl leading-none',
        bottom: 'text-xs tracking-[0.3em] leading-none',
    },
    lg: {
        top: 'text-4xl leading-none',
        bottom: 'text-sm tracking-[0.35em] leading-none',
    },
};

export default function Wordmark({
    size = 'sm',
    colorClassName = 'text-gray-900',
}: WordmarkProps) {
    const { top, bottom } = SIZES[size];

    return (
        <span
            // font-cormorant is wired in app/layout.tsx
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
            className={`inline-flex flex-col items-start ${colorClassName}`}
            aria-label="Tim Collins Framework"
        >
            <span className={`${top} font-semibold`}>TIM COLLINS</span>
            <span className={`${bottom} font-medium mt-1`}>FRAMEWORK</span>
        </span>
    );
}
