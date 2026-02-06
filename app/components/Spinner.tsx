'use client';

type SpinnerProps = {
    size?: 'sm' | 'md' | 'lg';
    color?: 'indigo' | 'white' | 'gray';
};

export default function Spinner({ size = 'md', color = 'indigo' }: SpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    const colorClasses = {
        indigo: 'border-indigo-600 border-t-transparent',
        white: 'border-white border-t-transparent',
        gray: 'border-gray-400 border-t-transparent'
    };

    return (
        <div
            className={`
                ${sizeClasses[size]} 
                ${colorClasses[color]} 
                rounded-full 
                animate-spin
            `}
            role="status"
            aria-label="Loading"
        />
    );
}
