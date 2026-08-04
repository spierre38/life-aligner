import Image from 'next/image';

export function TimCollinsStory() {
    return (
        <section
            className="py-20 relative"
            style={{
                background: 'radial-gradient(ellipse 60% 50% at 70% 40%, rgba(59,130,246,0.07) 0%, transparent 60%), #07070f',
                borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Tim's Photo */}
                    <div className="flex justify-center md:justify-end">
                        <div className="relative">
                            {/* Glow behind photo */}
                            <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: 'rgba(168,85,247,0.4)' }}></div>

                            {/* Photo container */}
                            <div className="relative w-64 h-64 md:w-80 md:h-80">
                                <Image
                                    src="/timmyC.webp"
                                    alt="Tim Collins, Creator of the Tim Collins Framework"
                                    width={320}
                                    height={320}
                                    className="rounded-full object-cover"
                                    style={{
                                        boxShadow: '0 0 40px rgba(168,85,247,0.15)',
                                        border: '2px solid rgba(255,255,255,0.1)',
                                    }}
                                    priority
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tim's Story */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
                                After 20 Years, I Finally{' '}
                                <span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                                    Understood Contentment
                                </span>
                            </h2>
                        </div>

                        <div className="space-y-4 text-lg text-white/50 leading-relaxed">
                            <p>
                                It took me <strong className="text-white/80">20 years</strong> to build the company I co-founded while in college
                                into a <strong className="text-white/80">successful industry leader</strong>...only to learn that despite all
                                my accomplishments in business, <strong className="text-white/80">I wasn&apos;t feeling content</strong>.
                            </p>

                            <p>
                                Then I discovered a simple truth: <em className="text-white/60">contentment doesn&apos;t come from achieving more—it
                                    comes from aligning what you do with who you are.</em>
                            </p>

                            <p className="text-xl font-medium text-white/80">
                                This framework changed my life. Now, I want to share it with you.
                            </p>
                        </div>

                        {/* Attribution */}
                        <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <p className="font-semibold text-white text-lg">Tim Collins</p>
                            <p className="text-white/40">Founder EBSCO Publishing, Former CEO </p>
                            <p className="text-white/40">TEDx Speaker • Tim Collins Framework Creator</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
