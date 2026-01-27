import Image from 'next/image';

export function TimCollinsStory() {
    return (
        <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 relative">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Tim's Photo */}
                    <div className="flex justify-center md:justify-end">
                        <div className="relative">
                            {/* Decorative background blob */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 transform scale-110"></div>

                            {/* Photo container */}
                            <div className="relative w-64 h-64 md:w-80 md:h-80">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full opacity-10"></div>
                                <Image
                                    src="/timmyC.webp"
                                    alt="Tim Collins, Creator of LifeAligner"
                                    width={320}
                                    height={320}
                                    className="rounded-full object-cover shadow-2xl border-4 border-white"
                                    priority
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tim's Story */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                After 40 Years, I Finally{' '}
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Understood Contentment
                                </span>
                            </h2>
                        </div>

                        <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                            <p>
                                I spent decades developing and creating <strong>EBSCO</strong>,
                                building a <strong>$2 billion company</strong>. On paper, I had everything.
                                But something was missing.
                            </p>

                            <p>
                                Then I discovered a simple truth: <em>contentment doesn't come from achieving more—it
                                    comes from aligning what you do with who you are.</em>
                            </p>

                            <p className="text-xl font-medium text-gray-900">
                                This framework changed my life. Now, I want to share it with you.
                            </p>
                        </div>

                        {/* Attribution */}
                        <div className="pt-4 border-t border-gray-200">
                            <p className="font-semibold text-gray-900 text-lg">Tim Collins</p>
                            <p className="text-gray-800">Former Executive and Co-Founder, The EBSCO Company</p>
                            <p className="text-gray-800">TEDx Speaker • Framework Creator</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wave Divider - transitions to dark navy contentment section */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-20">
                <svg className="relative block w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="timWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#0a1f44', stopOpacity: 1 }} />
                            <stop offset="50%" style={{ stopColor: '#1e4d7b', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#3b8b9f', stopOpacity: 1 }} />
                        </linearGradient>
                    </defs>
                    <path
                        d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                        fill="url(#timWaveGradient)"
                    />
                </svg>
            </div>
        </section>
    );
}
