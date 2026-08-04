export function RealSocialProof() {
    return (
        <section
            className="py-12 sm:py-16 relative overflow-hidden"
            style={{
                background: 'radial-gradient(ellipse 60% 45% at 40% 50%, rgba(59,130,246,0.06) 0%, transparent 60%), #07070f',
                borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
        >
            <div className="max-w-6xl mx-auto px-4">
                {/* TEDx Section */}
                <div className="text-center mb-8 sm:mb-12">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4" style={{ letterSpacing: '-0.02em' }}>
                        As Seen On TEDx
                    </h3>
                    <p className="text-base sm:text-lg text-white/45 mb-6 sm:mb-8">
                        Watch Tim Collins&apos; talk: &quot;Redefining Contentment&quot;
                    </p>

                    {/* TEDx Video */}
                    <div className="max-w-3xl mx-auto">
                        <div
                            className="aspect-video rounded-xl sm:rounded-2xl overflow-hidden relative"
                            style={{
                                background: '#0a0a14',
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            }}
                        >
                            <video
                                className="w-full h-full object-cover"
                                src="/timvideo.mp4"
                                controls
                                playsInline
                                preload="metadata"
                                aria-label="Tim Collins TEDx talk: Redefining Contentment"
                            />
                            {/* Badge */}
                            <div
                                className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg pointer-events-none"
                                style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <div className="text-xs sm:text-sm font-semibold text-white/80">TEDx Endicott College</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-10 sm:mt-16">
                    <div
                        className="text-center rounded-2xl p-5 sm:p-8 transition-all hover:-translate-y-1"
                        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
                    >
                        <div
                            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #a855f7)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}
                        >
                            40+
                        </div>
                        <p className="text-white/70 text-base sm:text-lg">Years of Real-World Testing</p>
                        <p className="text-xs sm:text-sm text-white/30 mt-2">Created at age 19, refined over decades</p>
                    </div>

                    <div
                        className="text-center rounded-2xl p-5 sm:p-8 transition-all hover:-translate-y-1"
                        style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}
                    >
                        <div
                            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2"
                            style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}
                        >
                            $2B+
                        </div>
                        <p className="text-white/70 text-base sm:text-lg">Company Built Using This Framework</p>
                        <p className="text-xs sm:text-sm text-white/30 mt-2">Tim grew EBSCO using these exact tools</p>
                    </div>

                    <div
                        className="text-center rounded-2xl p-5 sm:p-8 transition-all hover:-translate-y-1"
                        style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)' }}
                    >
                        <div
                            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2"
                            style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}
                        >
                            Proven
                        </div>
                        <p className="text-white/70 text-base sm:text-lg">Time-Tested Framework</p>
                        <p className="text-xs sm:text-sm text-white/30 mt-2">Validated by decades of consistent results</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
