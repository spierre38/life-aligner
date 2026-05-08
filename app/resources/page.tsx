'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthNavbar from '@/app/components/AuthNavbar';

export default function ResourcesPage() {
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    const videos = [
        {
            id: 'intro',
            title: 'Introduction to the Tim Collins Framework',
            duration: '11:31',
            description: 'Tim Collins TEDx talk on redefining contentment',
            thumbnail: '/video-thumbnails/tedx.jpg',
            url: 'https://www.youtube.com/embed/YOUR_VIDEO_ID',
            available: false
        },
        {
            id: 'values',
            title: 'Understanding Your Values',
            duration: '5:00',
            description: 'Why values are the foundation of your LifeFrame',
            thumbnail: '/video-thumbnails/values.jpg',
            url: '',
            available: false
        },
        {
            id: 'interests',
            title: 'Discovering Your Interests',
            duration: '3:30',
            description: 'Finding activities that bring joy and fulfillment',
            thumbnail: '/video-thumbnails/interests.jpg',
            url: '',
            available: false
        },
        {
            id: 'categories',
            title: 'Life Categories & Purpose',
            duration: '6:15',
            description: 'Setting your focus areas and defining purpose',
            thumbnail: '/video-thumbnails/categories.jpg',
            url: '',
            available: false
        },
        {
            id: 'roadmap',
            title: 'Building Your Roadmap',
            duration: '8:00',
            description: 'Creating goals and tracking habits',
            thumbnail: '/video-thumbnails/roadmap.jpg',
            url: '',
            available: false
        },
        {
            id: 'quarterly',
            title: 'Quarterly Review Process',
            duration: '4:45',
            description: 'How to reflect and adjust your plan',
            thumbnail: '/video-thumbnails/review.jpg',
            url: '',
            available: false
        }
    ];

    const downloads = [
        {
            title: 'The Tim Collins Framework',
            description: 'Complete book by Tim Collins (PDF)',
            icon: '📖',
            size: '2.5 MB',
            format: 'PDF',
            url: '/downloads/lifealigner-book.pdf',
            available: true
        },
        {
            title: 'Printable Workbook',
            description: 'Physical worksheets for offline use',
            icon: '📝',
            size: '1.8 MB',
            format: 'PDF',
            url: '/downloads/lifealigner-workbook.pdf',
            available: true
        },
        {
            title: 'Goal Tracking Templates',
            description: 'Excel and Google Sheets templates',
            icon: '📊',
            size: '450 KB',
            format: 'XLSX',
            url: '/downloads/goal-templates.xlsx',
            available: false
        },
        {
            title: 'Values Reference Guide',
            description: 'Detailed explanations of all 20 values',
            icon: '📌',
            size: '800 KB',
            format: 'PDF',
            url: '/downloads/values-guide.pdf',
            available: false
        }
    ];

    const supportLinks = [
        {
            title: 'Community Forum',
            description: 'Connect with other Tim Collins Framework users',
            icon: '💬',
            url: '/community',
            available: false
        },
        {
            title: 'Contact Support',
            description: 'Get help from our team',
            icon: '📧',
            url: 'mailto:support@lifealigner.com',
            available: true
        },
        {
            title: 'Frequently Asked Questions',
            description: 'Common questions answered',
            icon: '❓',
            url: '/faq',
            available: false
        },
        {
            title: 'Schedule 1-on-1 Coaching',
            description: 'Work directly with a certified coach',
            icon: '👥',
            url: '/coaching',
            available: false
        }
    ];

    return (
        <>
            <AuthNavbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl mx-auto mb-6">
                            📚
                        </div>
                        <h1 className="text-5xl font-bold text-gray-900 mb-4">Resources & Learning</h1>
                        <p className="text-xl text-gray-800">
                            Everything you need to master the Tim Collins Framework
                        </p>
                    </div>

                    {/* Video Library */}
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl">
                                🎥
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">Video Library</h2>
                                <p className="text-gray-800">Learn at your own pace</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map((video) => (
                                <div
                                    key={video.id}
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105"
                                >
                                    <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                        {video.available ? (
                                            <button
                                                onClick={() => setSelectedVideo(video.id)}
                                                className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 hover:scale-110 transition-transform shadow-lg"
                                            >
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <div className="text-center">
                                                <div className="text-5xl mb-2">🎬</div>
                                                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
                                                    Coming Soon
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                                            {video.duration}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 mb-1">{video.title}</h3>
                                        <p className="text-sm text-gray-800">{video.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Downloads */}
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl">
                                📥
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">Downloads</h2>
                                <p className="text-gray-800">Resources for offline use</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {downloads.map((download, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                                            {download.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-1">{download.title}</h3>
                                            <p className="text-sm text-gray-800 mb-3">{download.description}</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-gray-600">
                                                    {download.format} • {download.size}
                                                </span>
                                                {download.available ? (
                                                    <a
                                                        href={download.url}
                                                        download
                                                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                                    >
                                                        Download
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                    </a>
                                                ) : (
                                                    <span className="text-sm font-semibold text-yellow-600">
                                                        Coming Soon
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Support & Help */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center text-white text-2xl">
                                💡
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">Support & Help</h2>
                                <p className="text-gray-800">We're here to help you succeed</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {supportLinks.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.available ? link.url : '#'}
                                    className={`
                    bg-white rounded-2xl shadow-lg p-6 transition-all
                    ${link.available
                                            ? 'hover:shadow-2xl hover:scale-105 cursor-pointer'
                                            : 'opacity-60 cursor-not-allowed'
                                        }
                  `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl flex items-center justify-center text-4xl">
                                            {link.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-1">{link.title}</h3>
                                            <p className="text-sm text-gray-800">{link.description}</p>
                                            {!link.available && (
                                                <span className="inline-block mt-2 text-xs font-semibold text-yellow-600">
                                                    Coming Soon
                                                </span>
                                            )}
                                        </div>
                                        {link.available && (
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Quick Links */}
                    <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-12 text-center text-white">
                        <h2 className="text-3xl font-bold mb-4">Ready to Continue?</h2>
                        <p className="text-xl mb-8 opacity-90">
                            Get back to building your path to contentment
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <Link
                                href="/workbook/lifeframe"
                                className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold hover:shadow-2xl transition-all transform hover:scale-105"
                            >
                                📋 View LifeFrame
                            </Link>
                            <Link
                                href="/roadmap"
                                className="bg-white/20 backdrop-blur-sm text-white border-2 border-white px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-all transform hover:scale-105"
                            >
                                🗺️ Open Roadmap
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Video Modal */}
                {selectedVideo && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden">
                            <div className="p-4 flex items-center justify-between border-b">
                                <h3 className="font-bold text-gray-900">
                                    {videos.find(v => v.id === selectedVideo)?.title}
                                </h3>
                                <button
                                    onClick={() => setSelectedVideo(null)}
                                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="aspect-video bg-black">
                                {/* Replace with actual video embed */}
                                <div className="w-full h-full flex items-center justify-center text-white">
                                    Video Player (embed iframe here)
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
