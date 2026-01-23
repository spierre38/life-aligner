'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

function OrbitingSteps() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const steps = [
    { num: 1, title: 'Vision', desc: 'Set your vision', color: 'from-blue-500 to-blue-600', angle: 0 },
    { num: 2, title: 'Goals', desc: 'Establish goals', color: 'from-purple-500 to-purple-600', angle: 72 },
    { num: 3, title: 'Activities', desc: 'Define activities', color: 'from-pink-500 to-pink-600', angle: 144 },
    { num: 4, title: 'Action', desc: 'Take action', color: 'from-orange-500 to-orange-600', angle: 216 },
    { num: 5, title: 'Learn', desc: 'Learn & revise', color: 'from-teal-500 to-teal-600', angle: 288 },
  ];

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

        {/* Orbiting step cards */}
        {steps.map((step) => {
          const currentAngle = (step.angle + rotation) * (Math.PI / 180);
          const radius = 240;
          const x = Math.cos(currentAngle) * radius;
          const y = Math.sin(currentAngle) * radius;

          return (
            <div
              key={step.num}
              className="absolute top-1/2 left-1/2 transition-transform duration-100"
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
            >
              <div
                className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer group border border-gray-100"
                style={{ width: '140px' }}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${step.color} text-white rounded-full flex items-center justify-center text-xl font-bold mb-2 mx-auto group-hover:scale-110 transition-transform`}>
                  {step.num}
                </div>
                <h3 className="text-sm font-bold text-gray-900 text-center">{step.title}</h3>
                <p className="text-xs text-gray-600 text-center mt-1">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 font-medium">Continuous Improvement Cycle</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState('hero');

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
      {/* Sticky Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LifeAligner
            </div>
            <div className="flex gap-6 items-center">
              <Link href="#preview" className="text-gray-600 hover:text-gray-900 transition">
                Preview
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition">
                Pricing
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="hero"
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-16 relative overflow-hidden"
      >
        {/* Soft background illustrations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column - Text content */}
            <div className="text-center lg:text-left animate-fade-in">
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Your Path to Contentment
              </h1>
              <p className="text-2xl md:text-3xl text-gray-700 mb-8">
                Define what contentment means for <em>you</em> and create a roadmap to live it.
              </p>
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto lg:mx-0">
                Through the LifeAligner framework, you'll clarify your values, uncover your interests,
                and build a personalized roadmap aligned with your purpose.
              </p>
              <div className="flex gap-4 justify-center lg:justify-start flex-wrap">
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-xl transition transform hover:scale-105"
                >
                  Start Your Journey
                </Link>
                <button
                  onClick={() => document.getElementById('contentment')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold text-lg hover:border-purple-600 hover:text-purple-600 transition"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Right column - Visual mockup card */}
            <div className="relative animate-fade-in animation-delay-500">
              {/* Floating mockup card */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg"></div>
                  <h3 className="text-2xl font-bold text-gray-900">My LifeFrame</h3>
                </div>

                {/* Values section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900">Values</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-gray-700">Integrity & Honesty</div>
                    <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-gray-700">Continuous Growth</div>
                    <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-gray-700">Family & Relationships</div>
                  </div>
                </div>

                {/* Interests section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900">Interests</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-purple-50 rounded-lg px-4 py-2 text-sm text-gray-700">Music & Creativity</div>
                    <div className="bg-purple-50 rounded-lg px-4 py-2 text-sm text-gray-700">Outdoor Activities</div>
                  </div>
                </div>

                {/* Purpose section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900">Purpose</h4>
                  </div>
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg px-4 py-3 text-sm text-gray-700 italic">
                    "Help others discover their path to meaningful living"
                  </div>
                </div>
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

      {/* What is Contentment Section */}
      <section id="contentment" className="min-h-screen flex items-center py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-5xl font-bold text-gray-900">
                What is Contentment?
              </h2>
              <blockquote className="text-2xl text-gray-700 italic border-l-4 border-blue-500 pl-6">
                "Feeling good about yourself and your life because you are engaging in activities
                that cause you to experience Happiness and Fulfillment."
              </blockquote>
              <p className="text-lg text-gray-600 leading-relaxed">
                <strong className="text-gray-900">Happiness</strong> comes from activities that
                rejuvenate you. But contentment requires more—it needs <strong className="text-gray-900">sustained
                  fulfillment</strong> from pursuing goals aligned with your values and purpose.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl animate-fade-in">
                <h3 className="text-2xl font-bold text-blue-900 mb-4">Your Values</h3>
                <p className="text-gray-700">
                  The principles and standards of behavior that guide your life decisions
                  and bring you deep satisfaction.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl animate-fade-in">
                <h3 className="text-2xl font-bold text-purple-900 mb-4">Your Purpose</h3>
                <p className="text-gray-700">
                  Long-term goals that are both meaningful to you and beneficial to others,
                  driven by your deeply held beliefs.
                </p>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-8 rounded-2xl animate-fade-in">
                <h3 className="text-2xl font-bold text-pink-900 mb-4">Your Interests</h3>
                <p className="text-gray-700">
                  Activities that bring you joy, rejuvenation, and allow you to deploy
                  your creativity to benefit others.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Process Section */}
      <section id="process" className="min-h-screen flex items-center py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Contentment is a Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Not a destination. Not about crossing finish lines. It's about enjoying the journey
              of continuous growth and making an impact in areas important to you.
            </p>
          </div>

          {/* Animated Circular Flow Diagram */}
          <OrbitingSteps />

          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto text-center">
            <p className="text-xl text-gray-700 italic">
              "You define what contentment means for you. You define your Interests, Values,
              and Purpose. The challenge—and the opportunity—is coming up with the right
              definitions for <em>you</em>."
            </p>
          </div>
        </div>
      </section>

      {/* The Tools Section */}
      <section id="tools" className="min-h-screen flex items-center py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              The LifeAligner Tools
            </h2>
            <p className="text-xl text-gray-600">
              Two powerful frameworks to guide your journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* LifeFrame */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-3xl p-10 hover:shadow-2xl transition animate-fade-in">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-3xl font-bold text-teal-900 mb-4">LifeFrame</h3>
              <p className="text-lg text-gray-700 mb-6">
                Your foundation. Capture your Values, Interests, and Life Categories
                (including Purpose).
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="text-teal-500 font-bold">✓</span>
                  <span>Identify your core values</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="text-teal-500 font-bold">✓</span>
                  <span>Discover meaningful interests</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="text-teal-500 font-bold">✓</span>
                  <span>Define your life categories</span>
                </div>
              </div>
            </div>

            {/* Roadmap */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-10 hover:shadow-2xl transition animate-fade-in">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-3xl font-bold text-blue-900 mb-4">Roadmap</h3>
              <p className="text-lg text-gray-700 mb-6">
                Transform your LifeFrame into actionable goals and activities
                aligned with your purpose.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Set meaningful goals</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Plan behavior changes</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Create actionable activities</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Steps */}
          <div className="mt-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-10">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Your 5-Step Journey
            </h3>
            <div className="grid md:grid-cols-5 gap-6">
              {[
                { step: 1, title: 'Values', color: 'blue' },
                { step: 2, title: 'Interests', color: 'blue' },
                { step: 3, title: 'Life Categories', color: 'blue' },
                { step: 4, title: 'Goals & Changes', color: 'blue' },
                { step: 5, title: 'Activities', color: 'blue' },
              ].map((item) => {
                // Same pattern as above - map colors to complete class names
                const colorClasses: Record<string, string> = {
                  teal: 'bg-teal-500',
                  blue: 'bg-blue-500',
                };

                return (
                  <div key={item.step} className="text-center animate-fade-in">
                    <div className={`w-12 h-12 ${colorClasses[item.color]} text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3`}>
                      {item.step}
                    </div>
                    <div className="text-sm font-semibold text-gray-700">{item.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured In Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">
            Featured In
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60 hover:opacity-100 transition-opacity">
            <div className="text-4xl font-bold text-red-600">
              TED<sup className="text-xs">x</sup>
            </div>
            <div className="text-2xl font-semibold text-gray-700">Forbes</div>
            <div className="text-2xl font-semibold text-gray-700">Psychology Today</div>
            <div className="text-2xl font-semibold text-gray-700">Inc.</div>
          </div>
        </div>
      </section>

      {/* Testimonial Carousel */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Helping Thousands Find Their Path
            </h2>
            <p className="text-xl text-gray-600">
              Students, professionals, and life-seekers discovering contentment
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative overflow-hidden">
            <div className="flex transition-transform duration-500 ease-in-out" style={{ animation: 'slide 15s infinite' }}>
              {/* Testimonial 1 */}
              <div className="min-w-full px-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      S
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Sarah Chen</h4>
                      <p className="text-gray-600">Graduate Student, Stanford</p>
                    </div>
                  </div>
                  <p className="text-xl text-gray-700 italic leading-relaxed mb-4">
                    "LifeAligner helped me navigate the chaos of grad school. For the first time,
                    I have clarity on what truly matters to me. The 5-step process transformed my
                    approach to both academics and life."
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

              {/* Testimonial 2 */}
              <div className="min-w-full px-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-12 shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      M
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Marcus Johnson</h4>
                      <p className="text-gray-600">Undergraduate, MIT</p>
                    </div>
                  </div>
                  <p className="text-xl text-gray-700 italic leading-relaxed mb-4">
                    "I was overwhelmed trying to figure out my major and career path. LifeAligner's
                    framework helped me identify my core values and align them with my goals.
                    Now I wake up excited about my future."
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

              {/* Testimonial 3 */}
              <div className="min-w-full px-4">
                <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-3xl p-12 shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      A
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Aisha Patel</h4>
                      <p className="text-gray-600">PhD Candidate, UC Berkeley</p>
                    </div>
                  </div>
                  <p className="text-xl text-gray-700 italic leading-relaxed mb-4">
                    "As a doctoral student, I struggled with burnout and questioning my purpose.
                    LifeAligner gave me a structured way to rediscover what contentment means to me.
                    It's been life-changing."
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
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-2 mt-8">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                10,000+
              </div>
              <p className="text-gray-600 text-lg">Students Helped</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                500+
              </div>
              <p className="text-gray-600 text-lg">Universities</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
                4.9/5
              </div>
              <p className="text-gray-600 text-lg">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="min-h-screen flex items-center py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-2xl mb-12 opacity-90">
            Join thousands discovering their path to contentment
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 mb-12 animate-fade-in">
            <blockquote className="text-xl md:text-2xl italic mb-4">
              "When I created my first Roadmap at age 19, I had no idea I would be using it
              for the next 40 years or that doing so would enable me to find contentment."
            </blockquote>
            <p className="text-lg font-semibold">— Tim Collins, Founder</p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/signup"
              className="bg-white text-purple-600 px-10 py-5 rounded-full font-bold text-xl hover:shadow-2xl transition transform hover:scale-105"
            >
              Get Started Free
            </Link>
            <Link
              href="#preview"
              className="border-2 border-white text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/10 transition"
            >
              See a Preview
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            LifeAligner
          </div>
          <p className="text-gray-400 mb-6">Your path to contentment.</p>
          <div className="flex justify-center gap-8 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}