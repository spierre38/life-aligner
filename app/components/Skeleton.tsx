'use client';

type SkeletonProps = {
    variant?: 'text' | 'rect' | 'circle';
    width?: string;
    height?: string;
    className?: string;
};

export default function Skeleton({
    variant = 'text',
    width,
    height,
    className = ''
}: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-gray-200 rounded';


    const variantClasses = {
        text: 'h-4 w-full rounded',
        rect: 'w-full h-24 rounded-lg',
        circle: 'rounded-full'
    };

    const style = {
        width: width,
        height: height || (variant === 'circle' ? width : undefined)
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
            role="status"
            aria-label="Loading content"
        />
    );
}

// Pre-built skeleton layouts for common patterns
export function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
            <div className="flex items-center gap-3 mb-4">
                <Skeleton variant="circle" width="48px" height="48px" />
                <div className="flex-1">
                    <Skeleton width="60%" className="mb-2" />
                    <Skeleton width="40%" className="h-3" />
                </div>
            </div>
            <Skeleton variant="rect" className="mb-3" />
            <Skeleton width="80%" />
        </div>
    );
}

export function SkeletonGoalCard() {
    return (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-3">
                    <Skeleton width="70%" height="24px" />
                    <Skeleton width="90%" />
                </div>
            </div>
            <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    );
}
