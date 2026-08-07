'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import dynamic from 'next/dynamic';
import Wordmark from '@/app/components/Wordmark';
import Reveal from '@/app/components/Reveal';

// Heavy below-the-fold components — loaded as separate chunks
const InteractiveToolsSection = dynamic(() => import('./components/InteractiveToolsSection').then(m => ({ default: m.InteractiveToolsSection })));
const Interactive5StepJourney = dynamic(() => import('./components/Interactive5StepJourney').then(m => ({ default: m.Interactive5StepJourney })));
const RealSocialProof = dynamic(() => import('./components/RealSocialProof').then(m => ({ default: m.RealSocialProof })));
const WorkingTestimonialCarousel = dynamic(() => import('./components/WorkingTestimonialCarousel').then(m => ({ default: m.WorkingTestimonialCarousel })));
const TimCollinsStory = dynamic(() => import('./components/TimCollinsStory').then(m => ({ default: m.TimCollinsStory })));

function OrbitingSteps() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const steps = [
    { num: 1, title: 'Vision', desc: 'Set your vision', accent: 'rgba(59,130,246,0.8)', glow: 'rgba(59,130,246,0.15)', angle: 0 },
    { num: 2, title: 'Goals', desc: 'Establish goals', accent: 'rgba(168,85,247,0.8)', glow: 'rgba(168,85,247,0.15)', angle: 72 },
    { num: 3, title: 'Activities', desc: 'Define activities', accent: 'rgba(236,72,153,0.8)', glow: 'rgba(236,72,153,0.15)', angle: 144 },
    { num: 4, title: 'Action', desc: 'Take action', accent: 'rgba(249,115,22,0.8)', glow: 'rgba(249,115,22,0.15)', angle: 216 },
    { num: 5, title: 'Learn', desc: 'Learn & revise', accent: 'rgba(20,184,166,0.8)', glow: 'rgba(20,184,166,0.15)', angle: 288 },
  ];

  // Mobile: Vertical Stack
  if (isMobile) {
    return (
      <div className="relative max-w-md mx-auto mb-8">
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className="rounded-2xl p-4 backdrop-blur-sm transition-all"
              style={{
                background: step.glow,
                border: `1px solid ${step.accent.replace('0.8', '0.25')}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                  style={{ background: step.accent, boxShadow: `0 0 20px ${step.glow}` }}
                >
                  {step.num}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{step.title}</h3>
                  <p className="text-sm text-white/60">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <p className="text-sm text-white/50 font-medium">Continuous Improvement Cycle</p>
        </div>
      </div>
    );
  }

  // Desktop: Orbiting Animation
  return (
    <div className="relative max-w-3xl mx-auto mb-16">
      <div className="relative h-[600px] w-full flex items-center justify-center">
        {/* Circular path SVG */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 600">
          <circle
            cx="300"
            cy="300"
            r="200"
            fill="none"
            stroke="url(#orbitGradient)"
            strokeWidth="1"
            strokeDasharray="6,6"
            className="opacity-40"
          />
          <defs>
            <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(59,130,246,0.6)" />
              <stop offset="25%" stopColor="rgba(168,85,247,0.6)" />
              <stop offset="50%" stopColor="rgba(236,72,153,0.6)" />
              <stop offset="75%" stopColor="rgba(249,115,22,0.6)" />
              <stop offset="100%" stopColor="rgba(20,184,166,0.6)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center circle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full flex items-center justify-center z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.2))',
            border: '1px solid rgba(168,85,247,0.3)',
            boxShadow: '0 0 60px rgba(168,85,247,0.2)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="text-center text-white">
            <svg className="w-10 h-10 mx-auto animate-spin-slow opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-[10px] font-semibold mt-1 text-white/60">Cycle</p>
          </div>
        </div>

        {/* Orbiting step cards — CSS animated */}
        <div className="absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-orbit" style={{ transformOrigin: '50% 50%' }}>
          {steps.map((step) => {
            const angleRad = step.angle * (Math.PI / 180);
            const radius = 240;
            const x = 300 + Math.cos(angleRad) * radius;
            const y = 300 + Math.sin(angleRad) * radius;

            return (
              <div
                key={step.num}
                className="absolute"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Counter-rotate so cards stay upright */}
                <div className="animate-orbit-reverse">
                  <div
                    className="rounded-2xl p-4 transition-all duration-300 hover:scale-110 cursor-pointer group"
                    style={{
                      width: '140px',
                      background: step.glow,
                      border: `1px solid ${step.accent.replace('0.8', '0.25')}`,
                      backdropFilter: 'blur(12px)',
                      boxShadow: `0 0 25px ${step.glow}`,
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold mb-2 mx-auto group-hover:scale-110 transition-transform text-white"
                      style={{ background: step.accent, boxShadow: `0 0 15px ${step.glow}` }}
                    >
                      {step.num}
                    </div>
                    <h3 className="text-sm font-bold text-white text-center">{step.title}</h3>
                    <p className="text-xs text-white/50 text-center mt-1">{step.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-white/40 font-medium">Continuous Improvement Cycle</p>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        // Only redirect if we have a confirmed session with a user
        if (session && session.user) {
          router.push('/dashboard');
        }
      } catch (error) {
        // If there's an error checking auth, don't redirect
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'contentment', 'process', 'tools', 'cta'];
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#07070f' }}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{ background: 'rgba(12,12,20,0.95)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Wordmark size="sm" colorClassName="text-white" />
        </div>
        <nav className="p-6 space-y-4">
          <Link href="#preview" onClick={() => setMobileMenuOpen(false)} className="block text-lg text-white/70 hover:text-white transition py-2">Preview</Link>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-lg text-white/70 hover:text-white transition py-2">Sign In</Link>
          <Link
            href="/signup"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-center px-6 py-3 rounded-xl font-semibold text-white transition"
            style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.8), rgba(236,72,153,0.8))' }}
          >
            Get Started
          </Link>
        </nav>
      </div>

      {/* Sticky Navigation */}
      <nav
        className="fixed top-0 w-full z-50 transition-all duration-300"
        style={{
          background: scrollY > 50 ? 'rgba(7,7,15,0.85)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(20px)' : 'none',
          borderBottom: scrollY > 50 ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          paddingTop: 'max(env(safe-area-inset-top, 0px), var(--safe-top, 0px))',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center" aria-label="Tim Collins Framework — home">
              <Wordmark size="sm" colorClassName="text-white" />
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex gap-2 items-center">
              <Link
                href="#preview"
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white transition"
              >
                Preview
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.8), rgba(236,72,153,0.7))', boxShadow: '0 0 20px rgba(168,85,247,0.2)' }}
              >
                Get Started
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="hero"
        className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(168,85,247,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(236,72,153,0.08) 0%, transparent 60%), #07070f',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">

            {/* Left column — text */}
            <div className="text-center lg:text-left animate-fade-in">
              {/* Brand eyebrow */}
              <p
                className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-white/40 uppercase mb-5"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
              >
                Tim Collins Framework
              </p>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight" style={{ letterSpacing: '-0.03em' }}>
                Your Path to{' '}
                <span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899, #f59e0b)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                  Contentment
                </span>
              </h1>

              <p className="text-xl sm:text-2xl md:text-3xl text-white/60 mb-6 sm:mb-8">
                Define what contentment means for <em className="text-white/80">you</em> and create a roadmap to live it.
              </p>

              <p className="text-base sm:text-lg text-white/40 mb-8 sm:mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                A personal growth platform for <em>all ages</em>, built around the tools and frameworks
                that helped create billion-dollar success.
              </p>

              <div className="flex gap-3 sm:gap-4 justify-center lg:justify-start flex-wrap">
                <Link
                  href="/signup"
                  className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-base text-white transition hover:opacity-90 min-h-[48px] flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.8), rgba(236,72,153,0.7))', boxShadow: '0 0 30px rgba(168,85,247,0.25)' }}
                >
                  Start Your Journey
                  <span aria-hidden className="ml-2">→</span>
                </Link>
                <button
                  onClick={() => document.getElementById('contentment')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-base text-white/70 transition hover:text-white hover:border-white/30 min-h-[48px] flex items-center justify-center"
                  style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Right column — mockup with glow */}
            <div
              className="relative animate-fade-in animation-delay-500"
              style={{ transform: `translateY(${scrollY * 0.15}px)` }}
            >
              <div
                className="rounded-3xl p-4 transform hover:scale-[1.02] transition-transform duration-300"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                }}
              >
                <Image
                  src="/lifeAligner-mockup.png"
                  alt="Tim Collins Framework Mockup"
                  width={800}
                  height={600}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-auto rounded-2xl"
                  priority
                />
              </div>

              {/* Glow effects */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-40 blur-3xl" style={{ background: 'rgba(168,85,247,0.4)' }}></div>
              <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-30 blur-3xl" style={{ background: 'rgba(236,72,153,0.3)' }}></div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-20 animate-bounce text-center">
            <svg className="w-6 h-6 mx-auto text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Tim Collins Story Section */}
      <TimCollinsStory />

      {/* What is Contentment Section */}
      <section
        id="contentment"
        className="min-h-screen flex items-center py-20 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 30% 60%, rgba(59,130,246,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 70% 30%, rgba(6,182,212,0.08) 0%, transparent 55%), #07070f',
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <Reveal>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
                  What is Contentment?
                </h2>
                <blockquote
                  className="text-lg sm:text-xl md:text-2xl text-white/60 italic pl-4 sm:pl-6"
                  style={{ borderLeft: '3px solid rgba(59,130,246,0.5)' }}
                >
                  &ldquo;Feeling good about yourself and your life because you are engaging in activities
                  that you enjoy, that cause you to experience Happiness and Fulfillment.&rdquo;
                </blockquote>
                <p className="text-base sm:text-lg text-white/45 leading-relaxed">
                  <strong className="text-white/80">Happiness</strong> comes from activities that
                  rejuvenate you. But contentment also requires <strong className="text-white/80">sustained
                    fulfillment</strong> from pursuing goals aligned with your values and purpose.
                </p>
              </div>

              <div className="space-y-5">
                <Reveal delay={0}>
                  <div
                    className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]"
                    style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(168,85,247,0.25)', boxShadow: '0 0 40px rgba(168,85,247,0.08)' }}
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: 'rgba(168,85,247,0.3)', border: '1px solid rgba(168,85,247,0.4)' }}>1</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white/90">Your Values</h3>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">
                        The principles and standards of behavior that guide your life decisions
                        and bring you deep satisfaction.
                      </p>
                    </div>
                    {/* Dashboard-style glow orb */}
                    <div className="relative h-24 overflow-hidden">
                      <div className="absolute inset-0" style={{ background: 'rgba(10,10,20,0.6)' }} />
                      <div className="absolute bottom-0 left-1/4 w-32 h-20 rounded-full blur-2xl" style={{ background: 'rgba(168,85,247,0.5)' }} />
                      <div className="absolute bottom-0 left-1/2 w-28 h-16 rounded-full blur-2xl" style={{ background: 'rgba(249,115,22,0.45)' }} />
                      <div className="absolute bottom-0 right-1/4 w-24 h-14 rounded-full blur-2xl" style={{ background: 'rgba(236,72,153,0.35)' }} />
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={100}>
                  <div
                    className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]"
                    style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(20,184,166,0.25)', boxShadow: '0 0 40px rgba(20,184,166,0.08)' }}
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: 'rgba(20,184,166,0.3)', border: '1px solid rgba(20,184,166,0.4)' }}>2</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white/90">Your Interests</h3>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Activities that bring you joy, rejuvenation, and allow you to deploy
                        your creativity to benefit others.
                      </p>
                    </div>
                    <div className="relative h-24 overflow-hidden">
                      <div className="absolute inset-0" style={{ background: 'rgba(10,10,20,0.6)' }} />
                      <div className="absolute bottom-0 left-1/4 w-32 h-20 rounded-full blur-2xl" style={{ background: 'rgba(20,184,166,0.55)' }} />
                      <div className="absolute bottom-0 left-1/2 w-28 h-16 rounded-full blur-2xl" style={{ background: 'rgba(16,185,129,0.4)' }} />
                      <div className="absolute bottom-0 right-1/4 w-24 h-14 rounded-full blur-2xl" style={{ background: 'rgba(59,130,246,0.3)' }} />
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={200}>
                  <div
                    className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]"
                    style={{ background: 'rgba(10,10,20,0.9)', border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 0 40px rgba(59,130,246,0.08)' }}
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: 'rgba(59,130,246,0.3)', border: '1px solid rgba(59,130,246,0.4)' }}>3</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white/90">Your Purpose</h3>
                      </div>
                      <p className="text-white/50 text-sm leading-relaxed">
                        Long-term goals that are both meaningful to you and beneficial to others,
                        driven by your deeply held beliefs.
                      </p>
                    </div>
                    <div className="relative h-24 overflow-hidden">
                      <div className="absolute inset-0" style={{ background: 'rgba(10,10,20,0.6)' }} />
                      <div className="absolute bottom-0 left-1/4 w-32 h-20 rounded-full blur-2xl" style={{ background: 'rgba(59,130,246,0.5)' }} />
                      <div className="absolute bottom-0 left-1/2 w-28 h-16 rounded-full blur-2xl" style={{ background: 'rgba(99,102,241,0.4)' }} />
                      <div className="absolute bottom-0 right-1/4 w-24 h-14 rounded-full blur-2xl" style={{ background: 'rgba(14,165,233,0.35)' }} />
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>
        </div>
      </section>


      {/* The Process Section */}
      <section
        id="process"
        className="min-h-screen flex items-center py-20 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 60% 40%, rgba(168,85,247,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 25% 70%, rgba(236,72,153,0.07) 0%, transparent 55%), #07070f',
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <Reveal>
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6" style={{ letterSpacing: '-0.03em' }}>
                Contentment is a Process
              </h2>
              <p className="text-base sm:text-xl text-white/45 max-w-3xl mx-auto px-4">
                Not a destination. Not about crossing finish lines. It&apos;s about enjoying the journey
                of continuous growth and making an impact in areas important to you.
              </p>
            </div>
          </Reveal>

          {/* Animated Circular Flow Diagram */}
          <OrbitingSteps />

          <Reveal>
            <div
              className="mt-10 sm:mt-16 rounded-2xl p-5 sm:p-8 max-w-2xl mx-auto text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <p className="text-base sm:text-lg md:text-xl text-white/60 italic">
                &ldquo;You define what contentment means for you. You define your Interests, Values,
                and Purpose. The challenge—and the opportunity—is coming up with the right
                definitions for <em className="text-white/80">you</em>.&rdquo;
              </p>
            </div>
          </Reveal>

          {/* Interactive 5-Step Journey */}
          <Interactive5StepJourney />
        </div>
      </section>

      {/* The Tools Section */}
      <Reveal><InteractiveToolsSection /></Reveal>

      {/* Social Proof - TEDx & Real Stats */}
      <Reveal><RealSocialProof /></Reveal>

      {/* Testimonial Carousel */}
      <Reveal><WorkingTestimonialCarousel /></Reveal>

      {/* CTA Section */}
      <section
        id="cta"
        className="min-h-screen flex items-center py-12 sm:py-20 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(168,85,247,0.15) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(236,72,153,0.1) 0%, transparent 55%), #07070f',
        }}
      >
        <Reveal className="w-full">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6" style={{ letterSpacing: '-0.03em' }}>
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 text-white/45">
              Join thousands discovering their path to contentment
            </p>

            <div
              className="rounded-3xl p-6 sm:p-8 md:p-12 mb-8 sm:mb-12"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <blockquote className="text-base sm:text-lg md:text-xl lg:text-2xl italic mb-3 sm:mb-4 text-white/70">
                &ldquo;When I created my first Roadmap at age 19, I had no idea I would be using it
                for the next 40 years or that doing so would enable me to find contentment.&rdquo;
              </blockquote>
              <p className="text-sm sm:text-base md:text-lg font-semibold text-white/50">&mdash; Tim Collins, Founder</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link
                href="/signup"
                className="px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-lg sm:text-xl text-white transition transform hover:scale-105 min-h-[56px] flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.8), rgba(236,72,153,0.7))', boxShadow: '0 0 40px rgba(168,85,247,0.3)' }}
              >
                Get Started
              </Link>
              <Link
                href="#preview"
                className="px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-lg sm:text-xl text-white/70 hover:text-white transition min-h-[56px] flex items-center justify-center"
                style={{ border: '1px solid rgba(255,255,255,0.15)' }}
              >
                See a Preview
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer style={{ background: '#05050a', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <Wordmark size="sm" colorClassName="text-white" />
          </div>
          <p className="text-white/30 mb-4 sm:mb-6 text-sm sm:text-base">Your path to contentment.</p>

          {/* Copyright Notice */}
          <div className="mb-4 sm:mb-6 px-4">
            <p className="text-xs sm:text-sm text-white/20 max-w-4xl mx-auto leading-relaxed">
              &copy; 2025 Timothy Collins. All materials are owned by Timothy Collins and are protected by United States and International copyright, trademark and other laws. All rights reserved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-white/30">
            <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
            <Link href="/contact" className="hover:text-white/60 transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}