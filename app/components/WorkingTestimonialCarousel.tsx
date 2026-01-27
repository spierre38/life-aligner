'use client';

import { useState, useEffect } from 'react';

export function WorkingTestimonialCarousel() {
    const [current, setCurrent] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    const testimonials = [
        {
            initial: 'S',
            name: 'Sarah Chen',
            role: 'Graduate Student, Stanford',
            text: 'LifeAligner helped me navigate the chaos of grad school. For the first time, I have clarity on what truly matters to me. The 5-step process transformed my approach to both academics and life.',
            gradient: 'from-blue-500 to-purple-500',
            bgGradient: 'from-blue-50 to-purple-50',
        },
        {
            initial: 'M',
            name: 'Marcus Johnson',
            role: 'Undergraduate, MIT',
            text: 'I was overwhelmed trying to figure out my major and career path. LifeAligner\'s framework helped me identify my core values and align them with my goals. Now I wake up excited about my future.',
            gradient: 'from-purple-500 to-pink-500',
            bgGradient: 'from-purple-50 to-pink-50',
        },
        {
            initial: 'A',
            name: 'Aisha Patel',
            role: 'PhD Candidate, UC Berkeley',
            text: 'As a doctoral student, I struggled with burnout and questioning my purpose. LifeAligner gave me a structured way to rediscover what contentment means to me. It\'s been life-changing.',
            gradient: 'from-teal-500 to-blue-500',
            bgGradient: 'from-teal-50 to-blue-50',
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

    return (
        <section className="py-20 bg-white relative overflow-hidden">
            {/* Path Background Pattern */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: 'url(/path-background.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            <div className="max-w-4xl mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Helping Thousands Find Their Path
                    </h2>
                    <p className="text-xl text-gray-600">
                        Students, professionals, and life-seekers discovering contentment
                    </p>
                </div>

                {/* Carousel Container */}
                <div className="relative">
                    <div className="overflow-hidden rounded-3xl">
                        <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(-${current * 100}%)` }}
                        >
                            {testimonials.map((testimonial, index) => (
                                <div key={index} className="min-w-full">
                                    <div className={`bg-gradient-to-br ${testimonial.bgGradient} rounded-3xl p-12 shadow-xl`}>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={`w-16 h-16 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
                                                {testimonial.initial}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                                                <p className="text-gray-600">{testimonial.role}</p>
                                            </div>
                                        </div>
                                        <p className="text-xl text-gray-700 italic leading-relaxed mb-4">
                                            "{testimonial.text}"
                                        </p>
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
                        aria-label="Previous testimonial"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
                        aria-label="Next testimonial"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Indicators */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`transition-all ${current === index
                                    ? 'w-8 h-3 bg-purple-600 rounded-full'
                                    : 'w-3 h-3 bg-gray-300 rounded-full hover:bg-gray-400'
                                    }`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Wave Divider to CTA Section */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-20">
                <svg className="relative block w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="waveGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
                            <stop offset="50%" style={{ stopColor: '#9333ea', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                        </linearGradient>
                    </defs>
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                        fill="url(#waveGradient3)"></path>
                </svg>
            </div>
        </section>
    );
}
