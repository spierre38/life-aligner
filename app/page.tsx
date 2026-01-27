'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { InteractiveToolsSection } from './components/InteractiveToolsSection';
import { Interactive5StepJourney } from './components/Interactive5StepJourney';
import { RealSocialProof } from './components/RealSocialProof';
import { WorkingTestimonialCarousel } from './components/WorkingTestimonialCarousel';

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

            {/* Right column - Visual mockup */}
            <div className="relative animate-fade-in animation-delay-500">
              <div className="bg-white rounded-3xl shadow-2xl p-4 transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/lifeAligner-mockup.png"
                  alt="LifeAligner Framework Mockup"
                  className="w-full h-auto rounded-2xl"
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

      {/* What is Contentment Section */}
      <section id="contentment" className="min-h-screen flex items-center py-20 bg-gradient-to-r from-[#0a1f44] via-[#1e4d7b] to-[#3b8b9f]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-5xl font-bold text-white">
                What is Contentment?
              </h2>
              <blockquote className="text-2xl text-blue-100 italic border-l-4 border-blue-400 pl-6">
                "Feeling good about yourself and your life because you are engaging in activities
                that cause you to experience Happiness and Fulfillment."
              </blockquote>
              <p className="text-lg text-blue-200 leading-relaxed">
                <strong className="text-white">Happiness</strong> comes from activities that
                rejuvenate you. But contentment requires more—it needs <strong className="text-white">sustained
                  fulfillment</strong> from pursuing goals aligned with your values and purpose.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-700 to-blue-800 p-8 rounded-2xl animate-fade-in border border-blue-600">
                <h3 className="text-2xl font-bold text-blue-100 mb-4">Your Values</h3>
                <p className="text-blue-200">
                  The principles and standards of behavior that guide your life decisions
                  and bring you deep satisfaction.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-700 to-purple-800 p-8 rounded-2xl animate-fade-in border border-purple-600">
                <h3 className="text-2xl font-bold text-purple-100 mb-4">Your Purpose</h3>
                <p className="text-purple-200">
                  Long-term goals that are both meaningful to you and beneficial to others,
                  driven by your deeply held beliefs.
                </p>
              </div>

              <div className="bg-gradient-to-br from-pink-700 to-pink-800 p-8 rounded-2xl animate-fade-in border border-pink-600">
                <h3 className="text-2xl font-bold text-pink-100 mb-4">Your Interests</h3>
                <p className="text-pink-200">
                  Activities that bring you joy, rejuvenation, and allow you to deploy
                  your creativity to benefit others.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* The Process Section */}
      <section id="process" className="min-h-screen flex items-center py-20 bg-gradient-to-r from-[#a78bca] via-[#8b5fbf] to-[#5d2a8f]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">
              Contentment is a Process
            </h2>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Not a destination. Not about crossing finish lines. It's about enjoying the journey
              of continuous growth and making an impact in areas important to you.
            </p>
          </div>

          {/* Animated Circular Flow Diagram */}
          <OrbitingSteps />

          <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-lg max-w-2xl mx-auto text-center border border-white/20">
            <p className="text-xl text-white italic">
              "You define what contentment means for you. You define your Interests, Values,
              and Purpose. The challenge—and the opportunity—is coming up with the right
              definitions for <em>you</em>."
            </p>
          </div>

          {/* Interactive 5-Step Journey */}
          <Interactive5StepJourney />
        </div>
      </section>

      {/* The Tools Section */}
      <InteractiveToolsSection />

      {/* Social Proof - TEDx & Real Stats */}
      <RealSocialProof />

      {/* Testimonial Carousel */}
      <WorkingTestimonialCarousel />

      {/* CTA Section */}
      < section id="cta" className="min-h-screen flex items-center py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" >
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
      </section >

      {/* Footer */}
      < footer className="bg-gray-900 text-white py-12" >
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
      </footer >
    </div >
  );
}