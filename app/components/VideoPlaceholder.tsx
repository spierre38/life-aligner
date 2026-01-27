'use client';

import { useState } from 'react';

type VideoPlaceholderProps = {
    title: string;
    description: string;
    duration?: string;
    worksheetPath: string;
    icon?: string;
};

export function VideoPlaceholder({
    title,
    description,
    duration = "3-5 min",
    worksheetPath,
    icon = "🎥"
}: VideoPlaceholderProps) {
    const [showVideo, setShowVideo] = useState(true);

    return (
        <>
            {showVideo && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-200 rounded-2xl p-8 mb-8">
                    <div className="flex items-start gap-6">
                        {/* Video Thumbnail Placeholder */}
                        <div className="flex-shrink-0">
                            <div className="relative w-64 h-36 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden group cursor-pointer">
                                {/* Play Button */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-all group-hover:scale-110">
                                        <svg className="w-8 h-8 text-purple-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Duration Badge */}
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    {duration}
                                </div>

                                {/* "Coming Soon" Overlay */}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">{icon}</div>
                                        <div className="text-white font-semibold">Video Coming Soon</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Video Info */}
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
                            <p className="text-gray-800 mb-4">{description}</p>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setShowVideo(false)}
                                    className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-2"
                                >
                                    Skip to Worksheet
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </button>

                                <div className="text-sm text-gray-500">
                                    • Optional introduction video
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!showVideo && (
                <button
                    onClick={() => setShowVideo(true)}
                    className="mb-6 text-sm text-purple-600 hover:text-purple-800 flex items-center gap-2 font-medium"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    Watch Introduction Video ({duration})
                </button>
            )}
        </>
    );
}
