'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import { trackLifeFrameComplete } from '@/lib/analytics';
import ConstellationMap from './ConstellationMap';

type SelectedValue = {
    name: string;
    description: string;
    priority: number;
};

type InterestData = {
    existing: string[];
    exploring: string[];
};

type CategoryDetail = {
    name: string;
    subCategories: string[];
};

type PurposeElement = {
    name: string;
    description: string;
};

type LifeCategoriesData = {
    categories: CategoryDetail[];
    purpose_elements: PurposeElement[];
};

type LifeFrameData = {
    values: SelectedValue[];
    interests: InterestData;
    lifeCategories: LifeCategoriesData;
};

// Star Field Component
const StarField = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = document.documentElement.scrollHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Create stars
        const stars: Array<{
            x: number;
            y: number;
            radius: number;
            opacity: number;
            twinkleSpeed: number;
            layer: number;
        }> = [];

        for (let i = 0; i < 300; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2,
                opacity: Math.random(),
                twinkleSpeed: Math.random() * 0.02,
                layer: Math.random() > 0.5 ? 1 : 2
            });
        }

        // Shooting stars
        let shootingStars: Array<{
            x: number;
            y: number;
            length: number;
            speed: number;
            opacity: number;
        }> = [];

        const createShootingStar = () => {
            if (Math.random() > 0.96) {
                shootingStars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height * 0.5,
                    length: Math.random() * 80 + 20,
                    speed: Math.random() * 5 + 5,
                    opacity: 1
                });
            }
        };

        // Animation loop
        let animationFrame: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Parallax effect based on scroll
            const scrollY = window.scrollY;
            const scrollProgress = scrollY / (canvas.height - window.innerHeight);

            // Draw stars
            stars.forEach(star => {
                const parallaxOffset = (scrollY * star.layer) * 0.3;
                star.opacity += star.twinkleSpeed;
                if (star.opacity > 1 || star.opacity < 0.3) {
                    star.twinkleSpeed *= -1;
                }

                ctx.beginPath();
                ctx.arc(star.x, star.y - parallaxOffset, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();
            });

            // Draw shooting stars
            createShootingStar();
            shootingStars = shootingStars.filter(star => {
                star.x += star.speed;
                star.y += star.speed;
                star.opacity -= 0.01;

                if (star.opacity > 0) {
                    const gradient = ctx.createLinearGradient(
                        star.x, star.y,
                        star.x - star.length, star.y - star.length
                    );
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    ctx.beginPath();
                    ctx.moveTo(star.x, star.y);
                    ctx.lineTo(star.x - star.length, star.y - star.length);
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    return true;
                }
                return false;
            });

            animationFrame = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.6 }}
        />
    );
};

// Constellation Connection Lines Component
const ConstellationLines = ({ activeSection }: { activeSection: string }) => {
    return (
        <svg
            className="fixed inset-0 pointer-events-none z-10"
            style={{ width: '100%', height: '100%' }}
        >
            <defs>
                <linearGradient id="line-gradient-purple" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(168, 85, 247, 0)" />
                    <stop offset="50%" stopColor="rgba(168, 85, 247, 0.6)" />
                    <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
                </linearGradient>
                <linearGradient id="line-gradient-pink" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(236, 72, 153, 0)" />
                    <stop offset="50%" stopColor="rgba(236, 72, 153, 0.6)" />
                    <stop offset="100%" stopColor="rgba(236, 72, 153, 0)" />
                </linearGradient>
                <linearGradient id="line-gradient-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(251, 191, 36, 0)" />
                    <stop offset="50%" stopColor="rgba(251, 191, 36, 0.8)" />
                    <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
                </linearGradient>
            </defs>

            {/* Values to Interests line */}
            <line
                x1="50%" y1="20%"
                x2="50%" y2="40%"
                stroke="url(#line-gradient-purple)"
                strokeWidth="2"
                className="transition-opacity duration-500"
                style={{
                    opacity: ['values', 'interests', 'categories', 'purpose'].includes(activeSection) ? 1 : 0.2
                }}
            />

            {/* Interests to Categories line */}
            <line
                x1="50%" y1="40%"
                x2="50%" y2="60%"
                stroke="url(#line-gradient-pink)"
                strokeWidth="2"
                className="transition-opacity duration-500"
                style={{
                    opacity: ['interests', 'categories', 'purpose'].includes(activeSection) ? 1 : 0.2
                }}
            />

            {/* Categories to Purpose line */}
            <line
                x1="50%" y1="60%"
                x2="50%" y2="80%"
                stroke="url(#line-gradient-gold)"
                strokeWidth="2"
                className="transition-opacity duration-500"
                style={{
                    opacity: ['categories', 'purpose'].includes(activeSection) ? 1 : 0.2
                }}
            />
        </svg>
    );
};

// SVG Icons
const ValueIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const InterestIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2.69l2.12 6.56h6.88l-5.57 4.05 2.13 6.57L12 15.82l-5.56 4.05 2.13-6.57L3 9.25h6.88z" />
    </svg>
);

const CategoryIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20M2 12h20" />
    </svg>
);

const PurposeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
);

export default function LifeFrameConstellation() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [lifeFrameData, setLifeFrameData] = useState<LifeFrameData | null>(null);
    const [activeSection, setActiveSection] = useState<'intro' | 'values' | 'interests' | 'categories' | 'purpose'>('intro');
    const [showConfetti, setShowConfetti] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const hasTrackedComplete = useRef(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // Manual scroll tracking
    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;

            const container = containerRef.current;
            const scrollTop = window.scrollY;
            const scrollHeight = container.scrollHeight - window.innerHeight;
            const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

            setScrollProgress(progress);

            // Update active section
            if (progress < 0.2) setActiveSection('intro');
            else if (progress < 0.4) setActiveSection('values');
            else if (progress < 0.6) setActiveSection('interests');
            else if (progress < 0.8) setActiveSection('categories');
            else {
                setActiveSection('purpose');
                if (progress >= 0.8) {
                    if (!showConfetti) {
                        setShowConfetti(true);
                        setTimeout(() => setShowConfetti(false), 3000);
                    }
                    if (!hasTrackedComplete.current) {
                        trackLifeFrameComplete();
                        hasTrackedComplete.current = true;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [showConfetti]);

    // Calculate section opacities
    const getOpacity = (start: number, fadeIn: number, fadeOut: number, end: number) => {
        if (scrollProgress < start) return 0;
        if (scrollProgress < fadeIn) return (scrollProgress - start) / (fadeIn - start);
        if (scrollProgress < fadeOut) return 1;
        if (scrollProgress < end) return 1 - (scrollProgress - fadeOut) / (end - fadeOut);
        return 0;
    };

    const introOpacity = scrollProgress < 0.1 ? 1 : 1 - (scrollProgress - 0) / 0.1;
    const valuesOpacity = getOpacity(0.1, 0.2, 0.3, 0.4);
    const interestsOpacity = getOpacity(0.3, 0.4, 0.5, 0.6);
    const categoriesOpacity = getOpacity(0.5, 0.6, 0.7, 0.8);
    const purposeOpacity = scrollProgress > 0.7 ? (scrollProgress - 0.7) / 0.1 : 0;

    useEffect(() => {
        const loadLifeFrame = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }

                const { data: worksheets, error } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', userWithProfile.user.id)
                    .in('category', ['values', 'interests', 'life_categories']);

                if (error) throw error;

                const valuesData = worksheets?.find(w => w.category === 'values');
                const interestsData = worksheets?.find(w => w.category === 'interests');
                const categoriesData = worksheets?.find(w => w.category === 'life_categories');

                if (valuesData && interestsData && categoriesData) {
                    setLifeFrameData({
                        values: valuesData.content.selected_values || [],
                        interests: interestsData.content || { existing: [], exploring: [] },
                        lifeCategories: categoriesData.content || { categories: [], purpose_elements: [] }
                    });
                } else {
                    // Redirect back if they haven't completed the prerequisites
                    router.push('/dashboard');
                    return;
                }
            } catch (error) {
                console.error('Error loading LifeFrame:', error);
            } finally {
                setLoading(false);
            }
        };

        loadLifeFrame();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Loading your constellation...</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
            {/* Star Field Background */}
            <StarField />

            {/* Constellation Connection Lines */}
            <ConstellationLines activeSection={activeSection} />

            {/* Constellation Map - Sticky */}
            <ConstellationMap activeSection={activeSection} />

            {/* Navigation */}
            <div
                className="fixed left-6 z-40 flex gap-2"
                style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
            >
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition"
                >
                    ← Dashboard
                </button>
                <button
                    onClick={() => router.push('/roadmap')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                    Skip to Roadmap →
                </button>
            </div>

            {/* Print & Share Buttons */}
            <div
                className="fixed right-6 z-40 flex gap-2"
                style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
            >
                <button
                    onClick={() => router.push('/lifeframe/print')}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition flex items-center gap-2"
                    title="Print LifeFrame"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="hidden md:inline">Print</span>
                </button>
                <button
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: 'My LifeFrame',
                                text: 'Check out my LifeFrame - my values, interests, and purpose!',
                                url: window.location.href
                            }).catch(() => { });
                        } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied to clipboard!');
                        }
                    }}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition flex items-center gap-2"
                    title="Share LifeFrame"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="hidden md:inline">Share</span>
                </button>
            </div>

            {/* Confetti Effect */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-30%',
                                backgroundColor: ['#fbbf24', '#ec4899', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 4)],
                                animationDelay: `${Math.random() * 0.5}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* SECTION 1: INTRO */}
            <section
                style={{ opacity: introOpacity }}
                className="min-h-screen flex items-center justify-center px-4 relative z-20"
            >
                <div className="text-center intro-wave">
                    <div className="w-32 h-32 mx-auto mb-8">
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center animate-scale-in text-white">
                            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 scroll-pop">
                        Your LifeFrame
                    </h1>
                    <p className="text-2xl text-purple-200 mb-12 scroll-pop" style={{ animationDelay: '0.2s' }}>
                        A constellation of what matters most
                    </p>
                    <div className="text-white animate-fade-in-slow">
                        <p className="mb-2">Scroll to begin your journey</p>
                        <svg className="w-6 h-6 mx-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* SECTION 2: VALUES */}
            <section
                style={{ opacity: valuesOpacity }}
                className="min-h-screen flex items-center justify-center px-4 py-20 relative z-20"
            >
                <div className="max-w-4xl w-full scroll-container">
                    <div className="text-center mb-12 scroll-pop">
                        <div className="w-24 h-24 mx-auto mb-6">
                            <div
                                className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center transition-shadow duration-300"
                                style={{
                                    boxShadow: activeSection === 'values'
                                        ? '0 0 60px rgba(168, 85, 247, 0.8)'
                                        : '0 0 20px rgba(168, 85, 247, 0.3)'
                                }}
                            >
                                <ValueIcon className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h2 className="text-5xl font-bold text-white mb-4 scroll-text-gradient">Your Values</h2>
                        <p className="text-xl text-purple-200">The guiding stars of your constellation</p>
                    </div>

                    {/* Values as ranked cards with priority glow */}
                    <div className="space-y-4">
                        {lifeFrameData?.values.map((value, index) => {
                            const glowColors = [
                                'rgba(168, 85, 247, 0.6)',
                                'rgba(236, 72, 153, 0.5)',
                                'rgba(99, 102, 241, 0.4)',
                                'rgba(139, 92, 246, 0.35)',
                                'rgba(168, 85, 247, 0.3)',
                            ];
                            const glow = glowColors[Math.min(index, glowColors.length - 1)];
                            const scale = 1 - (index * 0.01);

                            return (
                                <div
                                    key={value.name}
                                    className="group relative rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] scroll-pop"
                                    style={{
                                        animationDelay: `${index * 120}ms`,
                                        background: `linear-gradient(135deg, rgba(168,85,247,${0.15 - index * 0.015}) 0%, rgba(236,72,153,${0.1 - index * 0.01}) 100%)`,
                                        border: '1px solid rgba(168, 85, 247, 0.3)',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: `0 0 ${30 - index * 4}px ${glow}`,
                                        transform: `scale(${scale})`,
                                    }}
                                >
                                    <div className="flex items-start gap-5">
                                        {/* Priority Ring */}
                                        <div className="relative flex-shrink-0">
                                            <div
                                                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white"
                                                style={{
                                                    background: `linear-gradient(135deg, rgba(168,85,247,0.8), rgba(236,72,153,0.8))`,
                                                    boxShadow: `0 0 20px ${glow}`,
                                                }}
                                            >
                                                {value.priority}
                                            </div>
                                            <div
                                                className="absolute inset-0 rounded-full border-2 border-purple-400/40"
                                                style={{ transform: 'scale(1.3)', animation: index === 0 ? 'spin-slower 20s linear infinite' : undefined }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">{value.name}</h3>
                                            <p className="text-purple-200/80 text-sm leading-relaxed">{value.description}</p>
                                        </div>
                                        {index === 0 && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 flex-shrink-0">
                                                #1 Priority
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-8 scroll-pop">
                        <button
                            onClick={() => router.push('/workbook/values')}
                            className="inline-flex items-center gap-1.5 text-purple-300 hover:text-white transition text-sm font-medium"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            <span>Edit Values</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* SECTION 3: INTERESTS */}
            <section
                style={{ opacity: interestsOpacity }}
                className="min-h-screen flex items-center justify-center px-4 py-20 relative z-20"
            >
                <div className="max-w-4xl w-full scroll-container">
                    <div className="text-center mb-12 scroll-pop">
                        <div className="w-24 h-24 mx-auto mb-6">
                            <div
                                className="w-full h-full bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center transition-shadow duration-300"
                                style={{
                                    boxShadow: activeSection === 'interests'
                                        ? '0 0 60px rgba(236, 72, 153, 0.8)'
                                        : '0 0 20px rgba(236, 72, 153, 0.3)'
                                }}
                            >
                                <InterestIcon className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h2 className="text-5xl font-bold text-white mb-4 scroll-text-gradient">Your Interests</h2>
                        <p className="text-xl text-pink-200">Activities that bring you joy &amp; growth</p>
                    </div>

                    {/* Existing Interests */}
                    <div className="mb-10">
                        <div className="flex items-center justify-center gap-3 mb-6 scroll-pop">
                            <div className="w-8 h-8 rounded-full bg-green-500/30 border border-green-400/50 flex items-center justify-center">
                                <span className="text-green-300 text-sm font-bold">✓</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white">Currently Enjoying</h3>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-green-300">
                                {lifeFrameData?.interests.existing.length || 0}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {lifeFrameData?.interests.existing.map((interest, index) => (
                                <div
                                    key={interest}
                                    className="px-5 py-2.5 rounded-full text-white font-medium transition-all duration-300 hover:scale-110 scroll-pop cursor-default"
                                    style={{
                                        animationDelay: `${index * 40}ms`,
                                        background: `linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,185,129,0.15) 100%)`,
                                        border: '1px solid rgba(34,197,94,0.4)',
                                        backdropFilter: 'blur(12px)',
                                        boxShadow: '0 0 15px rgba(34,197,94,0.15)',
                                    }}
                                >
                                    {interest}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Exploring Interests */}
                    <div>
                        <div className="flex items-center justify-center gap-3 mb-6 scroll-pop">
                            <div className="w-8 h-8 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center">
                                <span className="text-purple-300 text-sm">⭐</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white">Want to Explore</h3>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300">
                                {lifeFrameData?.interests.exploring.length || 0}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {lifeFrameData?.interests.exploring.map((interest, index) => (
                                <div
                                    key={interest}
                                    className="px-5 py-2.5 rounded-full text-white font-medium transition-all duration-300 hover:scale-110 scroll-pop cursor-default"
                                    style={{
                                        animationDelay: `${index * 40}ms`,
                                        background: `linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(168,85,247,0.15) 100%)`,
                                        border: '1px solid rgba(139,92,246,0.4)',
                                        backdropFilter: 'blur(12px)',
                                        boxShadow: '0 0 15px rgba(139,92,246,0.15)',
                                    }}
                                >
                                    {interest}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center mt-8 scroll-pop">
                        <button
                            onClick={() => router.push('/workbook/interests')}
                            className="inline-flex items-center gap-1.5 text-pink-300 hover:text-white transition text-sm font-medium"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            <span>Edit Interests</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* SECTION 4: CATEGORIES */}
            <section
                style={{ opacity: categoriesOpacity }}
                className="min-h-screen flex items-center justify-center px-4 py-20 relative z-20"
            >
                <div className="max-w-4xl w-full scroll-container">
                    <div className="text-center mb-12 scroll-pop">
                        <div className="w-24 h-24 mx-auto mb-6">
                            <div
                                className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center transition-shadow duration-300"
                                style={{
                                    boxShadow: activeSection === 'categories'
                                        ? '0 0 60px rgba(99, 102, 241, 0.8)'
                                        : '0 0 20px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                <CategoryIcon className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h2 className="text-5xl font-bold text-white mb-4 scroll-text-gradient">Life Categories</h2>
                        <p className="text-xl text-indigo-200">The orbits of your life constellation</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        {lifeFrameData?.lifeCategories.categories.map((category, index) => {
                            const categoryGradients = [
                                'from-red-500/25 to-pink-500/15',
                                'from-pink-500/25 to-rose-500/15',
                                'from-purple-500/25 to-indigo-500/15',
                                'from-blue-500/25 to-cyan-500/15',
                                'from-cyan-500/25 to-teal-500/15',
                                'from-green-500/25 to-emerald-500/15',
                                'from-amber-500/25 to-yellow-500/15',
                                'from-orange-500/25 to-red-500/15',
                            ];
                            const borderColors = [
                                'rgba(239,68,68,0.4)', 'rgba(236,72,153,0.4)', 'rgba(168,85,247,0.4)',
                                'rgba(59,130,246,0.4)', 'rgba(6,182,212,0.4)', 'rgba(34,197,94,0.4)',
                                'rgba(245,158,11,0.4)', 'rgba(249,115,22,0.4)'
                            ];
                            const grad = categoryGradients[index % categoryGradients.length];
                            const borderColor = borderColors[index % borderColors.length];

                            return (
                                <div
                                    key={category.name}
                                    className={`group relative rounded-2xl p-5 transition-all duration-300 hover:scale-[1.03] scroll-pop bg-gradient-to-br ${grad}`}
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        border: `1px solid ${borderColor}`,
                                        backdropFilter: 'blur(16px)',
                                        boxShadow: `0 0 25px ${borderColor.replace('0.4', '0.15')}`,
                                    }}
                                >
                                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{category.name}</h3>
                                    {category.subCategories.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {category.subCategories.map((sub) => (
                                                <span
                                                    key={sub}
                                                    className="text-xs px-3 py-1.5 rounded-full font-medium"
                                                    style={{
                                                        background: `${borderColor.replace('0.4', '0.15')}`,
                                                        border: `1px solid ${borderColor.replace('0.4', '0.25')}`,
                                                        color: 'rgba(255,255,255,0.85)'
                                                    }}
                                                >
                                                    {sub}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-white/40 italic">No sub-categories defined</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center mt-8 scroll-pop">
                        <button
                            onClick={() => router.push('/workbook/life-categories')}
                            className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white transition text-sm font-medium"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            <span>Edit Categories</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* SECTION 5: PURPOSE */}
            <section
                style={{ opacity: purposeOpacity }}
                className="min-h-screen flex items-center justify-center px-4 py-20 relative z-20"
            >
                <div className="max-w-4xl w-full text-center scroll-container">
                    <div className="mb-12 scroll-pop">
                        <div className="w-40 h-40 mx-auto mb-8 relative">
                            <div
                                className="w-full h-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-full flex items-center justify-center transition-shadow duration-300"
                                style={{
                                    boxShadow: activeSection === 'purpose'
                                        ? '0 0 100px rgba(251, 191, 36, 1), 0 0 200px rgba(251, 191, 36, 0.5)'
                                        : '0 0 40px rgba(251, 191, 36, 0.3)'
                                }}
                            >
                                <PurposeIcon className="w-20 h-20 text-white" />
                            </div>
                            <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-full animate-spin-slow" style={{ transform: 'scale(1.3)' }} />
                            <div className="absolute inset-0 border-2 border-orange-400/30 rounded-full animate-spin-slower" style={{ transform: 'scale(1.5)' }} />
                        </div>
                        <h2 className="text-6xl md:text-7xl font-bold scroll-text-gradient mb-6" style={{
                            background: 'linear-gradient(60deg, #2563eb, #ff5acd, #fbda61, #ff5acd, #2563eb)',
                            backgroundSize: '400%',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent'
                        }}>
                            Your Purpose
                        </h2>
                        <p className="text-2xl text-yellow-200 mb-12">
                            The supernova at the center of your constellation
                        </p>
                    </div>

                    <div className="space-y-6 mb-12">
                        {lifeFrameData?.lifeCategories.purpose_elements.map((element, index) => (
                            <div
                                key={element.name}
                                className="relative rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] scroll-pop overflow-hidden"
                                style={{
                                    animationDelay: `${index * 200}ms`,
                                    background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(249,115,22,0.1) 50%, rgba(236,72,153,0.08) 100%)',
                                    border: '1px solid rgba(251,191,36,0.35)',
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: '0 0 40px rgba(251,191,36,0.15), inset 0 1px 0 rgba(251,191,36,0.2)',
                                }}
                            >
                                {/* Radiant glow accent */}
                                <div
                                    className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px]"
                                    style={{ background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.8), transparent)' }}
                                />
                                <h3 className="text-3xl font-bold text-white mb-3 tracking-tight">{element.name}</h3>
                                {element.description && (
                                    <p className="text-lg text-yellow-100/80 leading-relaxed">{element.description}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Final Summary Stats */}
                    <div
                        className="rounded-3xl p-8 scroll-pop relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(168,85,247,0.1) 100%)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 0 60px rgba(168,85,247,0.1)',
                        }}
                    >
                        <div
                            className="absolute top-0 left-0 right-0 h-[1px]"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
                        />
                        <p className="text-2xl text-white mb-2 font-bold flex items-center justify-center gap-2">
                            <span>Your LifeFrame is complete</span>
                            <svg className="w-6 h-6 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </p>
                        <p className="text-sm text-purple-200/60 mb-6">
                            {lifeFrameData?.values.length || 0} values • {(lifeFrameData?.interests.existing.length || 0) + (lifeFrameData?.interests.exploring.length || 0)} interests • {lifeFrameData?.lifeCategories.categories.length || 0} categories • {lifeFrameData?.lifeCategories.purpose_elements.length || 0} purpose elements
                        </p>
                        <p className="text-lg text-purple-200 mb-8">
                            Now build your Roadmap with goals aligned to these values and purpose.
                        </p>
                        <button
                            onClick={() => router.push('/roadmap')}
                            className="px-10 py-4 rounded-full font-bold text-xl text-white transition-all transform hover:scale-105"
                            style={{
                                background: 'linear-gradient(135deg, rgba(168,85,247,0.8), rgba(236,72,153,0.8))',
                                boxShadow: '0 0 40px rgba(168,85,247,0.4)',
                            }}
                        >
                            Build Your Roadmap →
                        </button>
                    </div>
                </div>
            </section>

            {/* Spacer */}
            <div className="h-screen" />

            <style jsx global>{`
                /* Elastic bounce scroll animations */
                :root {
                    --ease-elastic: linear(
                        0, 0.186 2.1%, 0.778 7.2%, 1.027 9.7%, 1.133, 1.212, 1.264, 1.292 15.4%,
                        1.296, 1.294, 1.285, 1.269 18.9%, 1.219 20.9%, 1.062 25.8%, 0.995 28.3%,
                        0.944 31.1%, 0.93, 0.921, 0.92 35.7%, 0.926, 0.94 39.7%, 1.001 47%, 1.014,
                        1.021 52.4%, 1.02 56.4%, 1 65.5%, 0.994 70.7%, 1.001 88.4%, 1
                    );
                    --ease-bounce-out: cubic-bezier(0.34, 1.56, 0.64, 1);
                    --gradient: linear-gradient(60deg, #2563eb, #ff5acd, #fbda61, #ff5acd, #2563eb);
                }

                @supports (animation-timeline: view()) {
                    .scroll-container {
                        view-timeline-name: --section;
                    }
                    
                    .scroll-pop {
                        animation: scroll-pop 600ms var(--ease-elastic) both;
                        animation-timeline: view();
                        animation-range: entry 0% entry 40%;
                    }

                    .scroll-text-gradient {
                        background: var(--gradient);
                        background-size: 400%;
                        background-clip: text;
                        -webkit-background-clip: text;
                        color: transparent;
                        animation: scroll-pop 600ms var(--ease-elastic) both,
                                   text-gradient-slide 1s ease both;
                        animation-timeline: view();
                        animation-range: entry 0% entry 40%;
                    }
                }

                @keyframes scroll-pop {
                    from {
                        opacity: 0;
                        transform: scale(0.5);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes text-gradient-slide {
                    from {
                        background-position: 0% center;
                    }
                    to {
                        background-position: 150% center;
                    }
                }

                @keyframes confetti {
                    to {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
                @keyframes scale-in {
                    from {
                        transform: scale(0);
                    }
                    to {
                        transform: scale(1);
                    }
                }
                @keyframes spin-slow {
                    from {
                        transform: scale(1.3) rotate(0deg);
                    }
                    to {
                        transform: scale(1.3) rotate(360deg);
                    }
                }
                @keyframes spin-slower {
                    from {
                        transform: scale(1.5) rotate(0deg);
                    }
                    to {
                        transform: scale(1.5) rotate(-360deg);
                    }
                }
                .animate-confetti {
                    animation: confetti forwards;
                }
                .animate-scale-in {
                    animation: scale-in 1s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .animate-fade-in-slow {
                    animation: scroll-pop 0.6s ease-out 0.5s backwards;
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                .animate-spin-slower {
                    animation: spin-slower 15s linear infinite;
                }

                /* Fallback for browsers without scroll-timeline support */
                @supports not (animation-timeline: view()) {
                    .scroll-pop {
                        animation: scroll-pop 600ms var(--ease-bounce-out) forwards;
                    }
                    .scroll-text-gradient {
                        background: var(--gradient);
                        background-size: 400%;
                        background-clip: text;
                        -webkit-background-clip: text;
                        color: transparent;
                    }
                }
            `}</style>
        </div>
    );
}