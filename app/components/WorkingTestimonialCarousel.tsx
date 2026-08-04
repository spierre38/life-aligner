'use client';

import { useState, useEffect, useRef } from 'react';

export function WorkingTestimonialCarousel() {
    const [current, setCurrent] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Touch/swipe support
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const testimonials = [
        {
            initial: 'S',
            name: 'Sarah Chen',
            role: 'Graduate Student, Stanford',
            text: 'The Tim Collins Framework helped me navigate the chaos of grad school. For the first time, I have clarity on what truly matters to me. The 5-step process transformed my approach to both academics and life.',
            accent: 'rgba(59,130,246,0.8)',
            glow: 'rgba(59,130,246,0.12)',
            border: 'rgba(59,130,246,0.2)',
        },
        {
            initial: 'M',
            name: 'Marcus Johnson',
            role: 'Undergraduate, MIT',
            text: 'I was overwhelmed trying to figure out my major and career path. The Tim Collins Framework helped me identify my core values and align them with my goals. Now I wake up excited about my future.',
            accent: 'rgba(168,85,247,0.8)',
            glow: 'rgba(168,85,247,0.12)',
            border: 'rgba(168,85,247,0.2)',
        },
        {
            initial: 'A',
            name: 'Aisha Patel',
            role: 'PhD Candidate, UC Berkeley',
            text: 'As a doctoral student, I struggled with burnout and questioning my purpose. The Tim Collins Framework gave me a structured way to rediscover what contentment means to me. It\'s been life-changing.',
            accent: 'rgba(20,184,166,0.8)',
            glow: 'rgba(20,184,166,0.12)',
            border: 'rgba(20,184,166,0.2)',
        },
    ];

    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % testimonials.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, testimonials.length]);

    const goToSlide = (index: number) => {
        setCurrent(index);
        setIsAutoPlaying(false);
    };

    const nextSlide = () => {
        setCurrent((prev) => (prev + 1) % testimonials.length);
        setIsAutoPlaying(false);
    };

    const prevSlide = () => {
        setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
        setIsAutoPlaying(false);
    };

    // Touch handlers for swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        const diff = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;

        if (Math.abs(diff) > minSwipeDistance) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    };

    return (
        <section
            className="py-12 sm:py-20 relative overflow-hidden"
            style={{
                background: '#07070f',
                borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
        >
            <div className="max-w-4xl mx-auto px-4 relative z-10">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4" style={{ letterSpacing: '-0.02em' }}>
                        Helping Thousands Find Their Path
                    </h2>
                    <p className="text-base sm:text-xl text-white/45">
                        Students, professionals, and life-seekers discovering contentment
                    </p>
                </div>

                {/* Carousel Container */}
                <div className="relative">
                    <div
                        ref={containerRef}
                        className="overflow-hidden rounded-2xl sm:rounded-3xl"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${current * 100}%)` }}
                        >
                            {testimonials.map((testimonial, index) => (
                                <div key={index} className="min-w-full">
                                    <div
                                        className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12"
                                        style={{
                                            background: testimonial.glow,
                                            border: `1px solid ${testimonial.border}`,
                                        }}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                                            <div
                                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-bold flex-shrink-0"
                                                style={{ background: testimonial.accent, boxShadow: `0 0 20px ${testimonial.glow}` }}
                                            >
                                                {testimonial.initial}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-base sm:text-lg">{testimonial.name}</h4>
                                                <p className="text-sm sm:text-base text-white/45">{testimonial.role}</p>
                                            </div>
                                        </div>
                                        <p className="text-base sm:text-lg md:text-xl text-white/60 italic leading-relaxed mb-4">
                                            &quot;{testimonial.text}&quot;
                                        </p>
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className="w-4 h-4 sm:w-5 sm:h-5" fill="rgba(251,191,36,0.7)" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSlide}
                        className="hidden sm:flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full items-center justify-center transition"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
                        aria-label="Previous testimonial"
                    >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={nextSlide}
                        className="hidden sm:flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full items-center justify-center transition"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
                        aria-label="Next testimonial"
                    >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Swipe hint for mobile */}
                    <p className="text-center text-xs text-white/25 mt-3 sm:hidden">
                        Swipe to see more →
                    </p>

                    {/* Indicators */}
                    <div className="flex justify-center gap-3 sm:gap-2 mt-6 sm:mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className="transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                aria-label={`Go to testimonial ${index + 1}`}
                            >
                                <span
                                    className="block transition-all rounded-full"
                                    style={current === index
                                        ? { width: 32, height: 12, background: 'rgba(168,85,247,0.8)' }
                                        : { width: 12, height: 12, background: 'rgba(255,255,255,0.15)' }
                                    }
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
