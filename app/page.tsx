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
    { num: 1, title: 'Vision', desc: 'Set your vision', color: 'from-blue-500 to-blue-600', angle: 0 },
    { num: 2, title: 'Goals', desc: 'Establish goals', color: 'from-purple-500 to-purple-600', angle: 72 },
    { num: 3, title: 'Activities', desc: 'Define activities', color: 'from-pink-500 to-pink-600', angle: 144 },
    { num: 4, title: 'Action', desc: 'Take action', color: 'from-orange-500 to-orange-600', angle: 216 },
    { num: 5, title: 'Learn', desc: 'Learn & revise', color: 'from-teal-500 to-teal-600', angle: 288 },
  ];

  // Mobile: Vertical Stack
  if (isMobile) {
    return (
      <div className="relative max-w-md mx-auto mb-8">
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-white rounded-xl p-4 shadow-md border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${step.color} text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0`}>
                  {step.num}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <p className="text-sm text-white/80 font-medium">Continuous Improvement Cycle</p>
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
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeDasharray="8,8"
            className="opacity-30"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="25%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="75%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl z-10">
          <div className="text-center text-white">
            <svg className="w-12 h-12 mx-auto animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-xs font-bold mt-1">Improvement Cycle</p>
          </div>
        </div>

        {/* Orbiting step cards — CSS animated, centered container */}
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
                    className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer group border border-gray-100"
                    style={{ width: '140px' }}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${step.color} text-white rounded-full flex items-center justify-center text-xl font-bold mb-2 mx-auto group-hover:scale-110 transition-transform`}>
                      {step.num}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 text-center">{step.title}</h3>
                    <p className="text-xs text-gray-800 text-center mt-1">{step.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-white/80 font-medium">Continuous Improvement Cycle</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="p-6 border-b border-gray-200">
          <Wordmark size="sm" />
        </div>
        <nav className="p-6 space-y-4">
          <Link href="#preview" onClick={() => setMobileMenuOpen(false)} className="block text-lg text-gray-800 hover:text-gray-900 transition py-2">Preview</Link>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-lg text-gray-800 hover:text-gray-900 transition py-2">Sign In</Link>
          <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block bg-gray-900 text-white text-center px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition">Get Started</Link>
        </nav>
      </div>

      {/* Sticky Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Wordmark — same component used in the authenticated app */}
            <Link href="/" className="flex items-center" aria-label="Tim Collins Framework — home">
              <Wordmark size="sm" />
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex gap-2 items-center">
              <Link
                href="#preview"
                className="link-underline px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition"
              >
                Preview
              </Link>
              <Link
                href="/login"
                className="link-underline px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile hamburger — uses your existing mobileMenuOpen state */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className="min-h-screen flex items-center justify-center bg-[#FAFAF7] pt-16 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">

            {/* Left column — text */}
            <div className="text-center lg:text-left animate-fade-in">
              {/* Brand eyebrow — establishes whose framework this is */}
              <p
                className="text-xs sm:text-sm font-semibold tracking-[0.3em] text-gray-500 uppercase mb-5"
                style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
              >
                Tim Collins Framework
              </p>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Your Path to Contentment
              </h1>

              <p className="text-xl sm:text-2xl md:text-3xl text-gray-700 mb-6 sm:mb-8">
                Define what contentment means for <em>you</em> and create a roadmap to live it.
              </p>

              <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                A personal growth platform for <em>all ages</em>, built around the tools and frameworks
                that helped create billion-dollar success.
              </p>

              <div className="flex gap-3 sm:gap-4 justify-center lg:justify-start flex-wrap">
                <Link
                  href="/signup"
                  className="bg-gray-900 text-white px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-base hover:bg-gray-800 transition min-h-[48px] flex items-center justify-center"
                >
                  Start Your Journey
                  <span aria-hidden className="ml-2">→</span>
                </Link>
                <button
                  onClick={() => document.getElementById('contentment')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border border-gray-300 text-gray-700 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-base hover:border-gray-900 hover:text-gray-900 transition min-h-[48px] flex items-center justify-center"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Right column — preserved mockup visual, parallax depth effect */}
            <div
              className="relative animate-fade-in animation-delay-500"
              style={{ transform: `translateY(${scrollY * 0.3}px)` }}
            >
              <div className="bg-white rounded-3xl shadow-2xl p-4 transform hover:scale-105 transition-transform duration-300">
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

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-50 blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-50 blur-2xl"></div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="mt-20 animate-bounce text-center">
            <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Tim Collins Story Section */}
      <TimCollinsStory />

      {/* What is Contentment Section */}
      <section id="contentment" className="min-h-screen flex items-center py-20 bg-gradient-to-r from-[#0a1f44] via-[#1e4d7b] to-[#3b8b9f] relative overflow-hidden">
        {/* Decorative illustration - peaceful meditation */}
        <Image
          src="/illustrations/peaceful-reflection.png"
          alt=""
          width={128}
          height={128}
          className="absolute top-8 right-8 w-32 h-32 opacity-80 pointer-events-none hidden md:block"
        />
        <div className="max-w-6xl mx-auto px-4">
          <Reveal>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                  What is Contentment?
                </h2>
                <blockquote className="text-lg sm:text-xl md:text-2xl text-blue-100 italic border-l-4 border-blue-400 pl-4 sm:pl-6">
                  "Feeling good about yourself and your life because you are engaging in activities
                  that you enjoy, that cause you to experience Happiness and Fulfillment."
                </blockquote>
                <p className="text-base sm:text-lg text-blue-200 leading-relaxed">
                  <strong className="text-white">Happiness</strong> comes from activities that
                  rejuvenate you. But contentment also requires <strong className="text-white">sustained
                    fulfillment</strong> from pursuing goals aligned with your values and purpose.
                </p>
              </div>

              <div className="space-y-6">
                <Reveal delay={0}>
                  <div className="bg-gradient-to-br from-blue-700 to-blue-800 p-5 sm:p-8 rounded-2xl border border-blue-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <h3 className="text-xl sm:text-2xl font-bold text-blue-100 mb-3 sm:mb-4">Your Values</h3>
                    <p className="text-blue-200">
                      The principles and standards of behavior that guide your life decisions
                      and bring you deep satisfaction.
                    </p>
                  </div>
                </Reveal>

                <Reveal delay={100}>
                  <div className="bg-gradient-to-br from-pink-700 to-pink-800 p-5 sm:p-8 rounded-2xl border border-pink-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <h3 className="text-xl sm:text-2xl font-bold text-pink-100 mb-3 sm:mb-4">Your Interests</h3>
                    <p className="text-pink-200">
                      Activities that bring you joy, rejuvenation, and allow you to deploy
                      your creativity to benefit others.
                    </p>
                  </div>
                </Reveal>

                <Reveal delay={200}>
                  <div className="bg-gradient-to-br from-purple-700 to-purple-800 p-5 sm:p-8 rounded-2xl border border-purple-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <h3 className="text-xl sm:text-2xl font-bold text-purple-100 mb-3 sm:mb-4">Your Purpose</h3>
                    <p className="text-purple-200">
                      Long-term goals that are both meaningful to you and beneficial to others,
                      driven by your deeply held beliefs.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Wave Divider - matches next section's background */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-20">
          <svg className="relative block w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#a78bca', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#8b5fbf', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#5d2a8f', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              fill="url(#waveGradient2)"></path>
          </svg>
        </div>
      </section >


      {/* The Process Section */}
      <section id="process" className="min-h-screen flex items-center py-20 bg-gradient-to-r from-[#a78bca] via-[#8b5fbf] to-[#5d2a8f] relative overflow-hidden">
        {/* Decorative illustration - journey path */}
        <Image
          src="/illustrations/journey-path.png"
          alt=""
          width={128}
          height={128}
          className="absolute bottom-256 left-8 w-32 h-32 opacity-100 pointer-events-none hidden md:block"
        />
        <div className="max-w-6xl mx-auto px-4">
          <Reveal>
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                Contentment is a Process
              </h2>
              <p className="text-base sm:text-xl text-purple-100 max-w-3xl mx-auto px-4">
                Not a destination. Not about crossing finish lines. It&apos;s about enjoying the journey
                of continuous growth and making an impact in areas important to you.
              </p>
            </div>
          </Reveal>

          {/* Animated Circular Flow Diagram */}
          <OrbitingSteps />

          <Reveal>
            <div className="mt-10 sm:mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-5 sm:p-8 shadow-lg max-w-2xl mx-auto text-center border border-white/20">
              <p className="text-base sm:text-lg md:text-xl text-white italic">
                "You define what contentment means for you. You define your Interests, Values,
                and Purpose. The challenge—and the opportunity—is coming up with the right
                definitions for <em>you</em>."
              </p>
            </div>
          </Reveal>
          {/* Decorative illustration - values thinking */}
          <Image
            src="/illustrations/values-person.png"
            alt=""
            width={128}
            height={128}
            className="absolute top-8 right-8 w-32 h-32 opacity-80 pointer-events-none hidden md:block"
          />
          {/* Interactive 5-Step Journey */}
          <Interactive5StepJourney />
        </div>

        {/* Wave Divider - matches next section's background (white) */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180 z-20">
          <svg className="relative block w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              className="fill-white"></path>
          </svg>
        </div>
      </section >

      {/* The Tools Section */}
      <Reveal><InteractiveToolsSection /></Reveal>

      {/* Social Proof - TEDx & Real Stats */}
      <Reveal><RealSocialProof /></Reveal>

      {/* Testimonial Carousel */}
      <Reveal><WorkingTestimonialCarousel /></Reveal>

      {/* CTA Section */}
      <section id="cta" className="min-h-screen flex items-center py-12 sm:py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden" >
        <Reveal className="w-full">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 opacity-90">
              Join thousands discovering their path to contentment
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 mb-8 sm:mb-12 border border-white/20">
              <blockquote className="text-base sm:text-lg md:text-xl lg:text-2xl italic mb-3 sm:mb-4">
                "When I created my first Roadmap at age 19, I had no idea I would be using it
                for the next 40 years or that doing so would enable me to find contentment."
              </blockquote>
              <p className="text-sm sm:text-base md:text-lg font-semibold">&mdash; Tim Collins, Founder</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link
                href="/signup"
                className="bg-white text-purple-600 px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-lg sm:text-xl hover:shadow-2xl transition transform hover:scale-105 min-h-[56px] flex items-center justify-center"
              >
                Get Started
              </Link>
              <Link
                href="#preview"
                className="border-2 border-white text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-lg sm:text-xl hover:bg-white/10 transition min-h-[56px] flex items-center justify-center"
              >
                See a Preview
              </Link>
            </div>
          </div>
        </Reveal>
      </section >

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12" >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-3 sm:mb-4">
            <Wordmark size="sm" colorClassName="text-white" />
          </div>
          <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Your path to contentment.</p>

          {/* Copyright Notice */}
          <div className="mb-4 sm:mb-6 px-4">
            <p className="text-xs sm:text-sm text-gray-400 max-w-4xl mx-auto leading-relaxed">
              &copy; 2025 Timothy Collins. All materials are owned by Timothy Collins and are protected by United States and International copyright, trademark and other laws. All rights reserved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-400">
            <Link href="/privacy" className="link-underline hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="link-underline hover:text-white transition">Terms</Link>
            <Link href="/contact" className="link-underline hover:text-white transition">Contact</Link>
          </div>
        </div>
      </footer >
    </div >
  );
}