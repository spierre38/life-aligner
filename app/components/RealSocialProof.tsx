export function RealSocialProof() {
    return (
        <section className="py-12 sm:py-16 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4">
                {/* If you have Tim's TEDx talk */}
                <div className="text-center mb-8 sm:mb-12">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                        As Seen On TEDx
                    </h3>
                    <p className="text-base sm:text-lg text-gray-800 mb-6 sm:mb-8">
                        Watch Tim Collins&apos; talk: &quot;Redefining Contentment&quot;
                    </p>

                    {/* TEDx Video */}
                    <div className="max-w-3xl mx-auto">
                        <div className="aspect-video rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden relative bg-gray-900">
                            <video
                                className="w-full h-full object-cover"
                                src="/timvideo.mp4"
                                controls
                                playsInline
                                preload="metadata"
                                aria-label="Tim Collins TEDx talk: Redefining Contentment"
                            />
                            {/* Badge */}
                            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-black/70 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg pointer-events-none">
                                <div className="text-xs sm:text-sm font-semibold">TEDx Endicott College</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mt-10 sm:mt-16">
                    <div className="text-center bg-white rounded-2xl p-5 sm:p-8 shadow-lg">
                        <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            40+
                        </div>
                        <p className="text-gray-800 text-base sm:text-lg">Years of Real-World Testing</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2">Created at age 19, refined over decades</p>
                    </div>

                    <div className="text-center bg-white rounded-2xl p-5 sm:p-8 shadow-lg">
                        <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            $2B+
                        </div>
                        <p className="text-gray-800 text-base sm:text-lg">Company Built Using This Framework</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2">Tim grew EBSCO using these exact tools</p>
                    </div>

                    <div className="text-center bg-white rounded-2xl p-5 sm:p-8 shadow-lg">
                        <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
                            Proven
                        </div>
                        <p className="text-gray-800 text-base sm:text-lg">Time-Tested Framework</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2">Validated by decades of consistent results</p>
                    </div>
                </div>
            </div>

            {/* Wave Divider to Testimonial Section */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-20">
                <svg className="relative block w-full h-16 sm:h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                        className="fill-white"></path>
                </svg>
            </div>
        </section>
    );
}
