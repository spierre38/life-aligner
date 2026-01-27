export function RealSocialProof() {
    return (
        <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4">
                {/* If you have Tim's TEDx talk */}
                <div className="text-center mb-12">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                        As Seen On TEDx
                    </h3>
                    <p className="text-lg text-gray-800 mb-8">
                        Watch Tim Collins' talk: "Redefining Contentment"
                    </p>

                    {/* Video Embed Placeholder */}
                    <div className="max-w-3xl mx-auto">
                        <div className="aspect-video bg-gray-900 rounded-2xl shadow-2xl overflow-hidden relative group cursor-pointer">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition">
                                    <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                </div>
                            </div>
                            {/* Thumbnail image would go here */}
                            <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
                                <div className="text-sm font-semibold">TEDx Endicott College</div>
                                <div className="text-xs opacity-80">11:31</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real Stats (if you have them) */}
                <div className="grid md:grid-cols-3 gap-8 mt-16">
                    <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
                        <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            40+
                        </div>
                        <p className="text-gray-800 text-lg">Years of Real-World Testing</p>
                        <p className="text-sm text-gray-500 mt-2">Created at age 19, refined over decades</p>
                    </div>

                    <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
                        <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            $2B+
                        </div>
                        <p className="text-gray-800 text-lg">Company Built Using This Framework</p>
                        <p className="text-sm text-gray-500 mt-2">Tim grew EBSCO using these exact tools</p>
                    </div>

                    <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
                        <div className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
                            Free
                        </div>
                        <p className="text-gray-800 text-lg">Always Free to Use</p>
                        <p className="text-sm text-gray-500 mt-2">No credit card required, ever</p>
                    </div>
                </div>
            </div>

            {/* Wave Divider to Testimonial Section */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-20">
                <svg className="relative block w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                        className="fill-white"></path>
                </svg>
            </div>
        </section>
    );
}
