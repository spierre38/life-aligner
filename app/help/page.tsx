'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AuthNavbar from '@/app/components/AuthNavbar';

// ─── Section SVG icons (no emojis) ───────────────────────────────────────────
const SECTION_ICONS: Record<string, ReactElement> = {
  'getting-started': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  goals: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  lifeframe: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  'values-interests': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  progress: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  account: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const FAQ_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    accent: 'rgba(168,85,247,0.7)',
    glow: 'rgba(168,85,247,0.11)',
    border: 'rgba(168,85,247,0.22)',
    questions: [
      {
        q: 'What is the Tim Collins Framework?',
        a: 'The Tim Collins Framework is a personal development platform designed to help you discover your values, set meaningful goals, and create a roadmap for living intentionally to reach contentment. It is built on 9 core principles that Tim Collins used to build a $2B company and live with purpose for over 40 years.',
      },
      {
        q: 'How do I get started?',
        a: 'Begin by completing the onboarding exercise that includes identifying your Values, Interests, and Life Categories (your LifeFrame). From there, you can start setting and tracking your goals on your Roadmap. The whole LifeFrame takes about 45-60 minutes on your first pass.',
      },
      {
        q: 'What is the LifeFrame?',
        a: 'Your LifeFrame is your personal foundation — it captures your Values (what matters most), your Interests (what energizes you), and your Life Categories (the key areas of your life, including your Purpose). Everything else in the app — your Roadmap, goals, and activities — flows from your LifeFrame.',
      },
      {
        q: 'Do I need to complete everything at once?',
        a: 'No. You can save your progress and come back at any time. We recommend completing the Values workbook first, then Interests, then Life Categories. Your LifeFrame will evolve as you grow.',
      },
    ],
  },
  {
    id: 'goals',
    title: 'Goals & Activities',
    accent: 'rgba(59,130,246,0.7)',
    glow: 'rgba(59,130,246,0.11)',
    border: 'rgba(59,130,246,0.22)',
    questions: [
      {
        q: 'How do I create a goal?',
        a: 'Go to your Roadmap and select "Add Goal." Enter your goal, connect it to your values and life categories, and explain why it matters to you. Connecting a goal to your LifeFrame is what separates a wish from a committed intention.',
      },
      {
        q: 'Can I edit my goal later?',
        a: 'Yes! Your goals can be updated at any time as your priorities and life change. Tim Collins Framework encourages flexibility — life evolves, and your goals should too.',
      },
      {
        q: 'Why should I connect my goals to my values?',
        a: 'Connecting your goals to your values ensures you are working toward what is most important to you, not just what feels urgent. Goals rooted in your values are far more likely to create lasting contentment.',
      },
      {
        q: 'Can a goal be a Behavior Change?',
        a: 'Absolutely. Goals do not have to be achievements — they can be habits or behaviors you want to build or eliminate. For example: "Build a daily reading habit" or "Stop procrastinating on important work." You will then set Activities to support it.',
      },
      {
        q: 'What are Activities?',
        a: 'Activities are the specific, recurring actions that move you toward your goals — the daily or weekly steps. For example, if your goal is "Run a marathon," an activity might be "Run 3 miles every Tuesday and Thursday." Activities are tracked in your To-Do pad.',
      },
    ],
  },
  {
    id: 'lifeframe',
    title: 'LifeFrame & Life Categories',
    accent: 'rgba(20,184,166,0.7)',
    glow: 'rgba(20,184,166,0.11)',
    border: 'rgba(20,184,166,0.22)',
    questions: [
      {
        q: 'What are Life Categories?',
        a: 'Life Categories are the areas of your life where you want to focus your energy and set goals — for example, Health, Relationships, Career, or Financial. They give structure to your Roadmap so you are making intentional progress across all the areas that matter to you.',
      },
      {
        q: 'How many Life Categories should I have?',
        a: 'We recommend 3-8 Life Categories. Too few and you may miss important areas; too many and your focus becomes scattered. Start with the ones that feel most alive for you right now — you can always add or adjust later.',
      },
      {
        q: 'What is a sub-category?',
        a: 'Sub-categories let you get specific within a Life Category. For example, under "Health" you might add sub-categories like "Physical Fitness," "Mental Health," and "Nutrition." They help you see your goals at a more granular level without cluttering your top-level categories.',
      },
      {
        q: 'What is Purpose, and where does it fit?',
        a: 'Your Purpose is your overarching "why" — the reason behind everything you do. In the Tim Collins Framework, it sits at the center of your Life Categories and acts as the anchor for all your goals. It is optional to define it formally, but users who do report the highest sense of direction.',
      },
    ],
  },
  {
    id: 'values-interests',
    title: 'Values & Interests',
    accent: 'rgba(244,63,94,0.7)',
    glow: 'rgba(244,63,94,0.11)',
    border: 'rgba(244,63,94,0.22)',
    questions: [
      {
        q: 'How do I choose my values?',
        a: 'In the Values workbook, you will be presented with a curated list of values. Select between 5 and 10 that resonate most deeply with who you are — not who you want to be, but who you genuinely are today. You can always refine them in your quarterly review.',
      },
      {
        q: 'What if my interests are not on the list?',
        a: 'You can add custom interests using the text input at the bottom of the Interests step. Just type your interest and tap "Add." Your interests should reflect what genuinely energizes you, whether or not they appear on the suggested list.',
      },
      {
        q: 'Why do interests matter for goals?',
        a: 'Your Interests are what bring you joy and energy. When your goals are connected to your interests, they feel less like obligations and more like authentic expressions of who you are. This connection is a key predictor of goal completion.',
      },
    ],
  },
  {
    id: 'progress',
    title: 'Progress & Daily Habits',
    accent: 'rgba(234,179,8,0.7)',
    glow: 'rgba(234,179,8,0.11)',
    border: 'rgba(234,179,8,0.22)',
    questions: [
      {
        q: 'How does the To-Do pad work?',
        a: 'The To-Do pad shows your activities marked for today. When you check off an activity, it records your progress. Daily activities reset each morning so you stay accountable. One-time activities stay checked once complete.',
      },
      {
        q: 'What is the Daily Insight?',
        a: 'The Daily Insight is a personalized reflection that appears on your Roadmap each day. It highlights your most important activity or prompts you to reflect on a value — designed to keep the Framework alive in your daily life, not just as a planning tool.',
      },
      {
        q: 'How do I mark a goal as complete?',
        a: 'Open the goal on your Roadmap, then tap "Complete Goal." You will be given a chance to add a reflection on what you accomplished and what you learned. Completed goals are saved in your history and can be revisited at any time.',
      },
      {
        q: 'What is the Quarterly Review?',
        a: 'A structured reflection every 3 months where you review your progress, celebrate wins, and adjust your goals and LifeFrame to reflect where you are now. Tim Collins recommends doing this consistently — it is the key to staying on course without losing flexibility.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Technical',
    accent: 'rgba(148,163,184,0.7)',
    glow: 'rgba(148,163,184,0.11)',
    border: 'rgba(148,163,184,0.22)',
    questions: [
      {
        q: 'Is my data private?',
        a: 'Yes. Your LifeFrame, goals, and activities are private to you. We do not share or sell your personal data. Your information is encrypted and stored securely.',
      },
      {
        q: 'Can I use the app on my phone?',
        a: 'Yes! The app is fully mobile-optimized. For the best experience on mobile, we recommend adding it to your home screen — tap the share icon in your browser and select "Add to Home Screen." This gives you a native app-like experience.',
      },
      {
        q: 'How do I change my password?',
        a: 'Go to your profile or settings and select "Change Password." You will receive an email with a reset link. If you do not see the email, check your spam folder.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings, and you will find the option to delete your account. This permanently removes all your data. If you are having issues, feel free to reach out via the Contact page first.',
      },
    ],
  },
];

function AccordionItem({ question, answer, accent, isOpen, onToggle }: {
  question: string; answer: string; accent: string; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: isOpen ? 'var(--color-surface)' : 'var(--color-surface)',
        border: `1px solid ${isOpen ? accent.replace('0.7', '0.4') : 'var(--color-border)'}`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-4 transition-all"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-sm sm:text-base leading-relaxed" style={{ color: 'var(--color-text)' }}>
          {question}
        </span>
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ background: isOpen ? accent.replace('0.7', '0.2') : 'var(--color-surface-2)', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          <svg className="w-3 h-3" style={{ color: isOpen ? accent.replace('0.7', '1') : 'var(--color-text-dim)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          <div className="w-8 h-0.5 rounded-full mb-4" style={{ background: accent.replace('0.7', '0.4') }} />
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

// ─── Tim Collins Slideshow ───────────────────────────────────────────────────

const TIM_SLIDES = [
  { src: '/tim-portrait.jpg', alt: 'Tim Collins — portrait' },
  { src: '/tim-presenting.jpg', alt: 'Tim Collins presenting' },
  { src: '/tim-podium.jpg', alt: 'Tim Collins at The Chamber podium' },
  { src: '/timmyC.webp', alt: 'Tim Collins headshot' },
  { src: '/illustrations/tim-collins.webp', alt: 'Tim Collins at his desk' },
];

function TimSlideshow() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % TIM_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full aspect-[3/4] max-w-[280px] sm:max-w-[320px] mx-auto rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(168,85,247,0.2)' }}>
      {TIM_SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === activeIdx ? 1 : 0 }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            sizes="320px"
            priority={i === 0}
          />
        </div>
      ))}
      {/* Gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {TIM_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              background: i === activeIdx ? 'rgba(168,85,247,0.9)' : 'rgba(255,255,255,0.4)',
              transform: i === activeIdx ? 'scale(1.3)' : 'scale(1)',
            }}
            aria-label={`View photo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function GetHelpPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const toggleItem = (key: string) => setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));

  const searchLower = search.toLowerCase();
  const filteredSections = search
    ? FAQ_SECTIONS.map(s => ({ ...s, questions: s.questions.filter(q => q.q.toLowerCase().includes(searchLower) || q.a.toLowerCase().includes(searchLower)) })).filter(s => s.questions.length > 0)
    : activeSection ? FAQ_SECTIONS.filter(s => s.id === activeSection) : FAQ_SECTIONS;

  return (
    <>
      <AuthNavbar />
      <div className="min-h-screen pt-16" style={{ background: 'var(--color-bg)' }}>
        {/* Hero — two-column: slideshow left, text right */}
        <div
          className="relative py-12 sm:py-20 overflow-hidden"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(168,85,247,0.08) 0%, transparent 70%), var(--color-bg)' }}
        >
          <div className="absolute top-10 left-1/4 w-64 h-32 rounded-full blur-3xl opacity-20" style={{ background: 'rgba(168,85,247,0.4)' }} />
          <div className="absolute top-10 right-1/4 w-48 h-32 rounded-full blur-3xl opacity-15" style={{ background: 'rgba(59,130,246,0.4)' }} />

          <div className="max-w-5xl mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-[auto_1fr] gap-10 md:gap-14 items-center">
              {/* Left: Tim slideshow */}
              <div className="hidden md:block">
                <TimSlideshow />
              </div>

              {/* Right: Text + search */}
              <div className="text-center md:text-left">
                <p className="text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--color-text-dim)' }}>Support</p>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                  Get{' '}
                  <span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                    Help
                  </span>
                </h1>
                <p className="text-lg sm:text-xl mb-8" style={{ color: 'var(--color-text-muted)' }}>Everything you need to know about the Tim Collins Framework.</p>
                {/* Search */}
                <div className="relative max-w-xl">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-dim)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm outline-none transition-all"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 transition" style={{ color: 'var(--color-text-dim)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile slideshow — below text on small screens */}
            <div className="md:hidden mt-8">
              <TimSlideshow />
            </div>
          </div>
        </div>

        {/* Filter pills */}
        {!search && (
          <div className="max-w-4xl mx-auto px-4 pb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setActiveSection(null)}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all"
                style={{
                  background: activeSection === null ? 'var(--color-surface-2)' : 'var(--color-surface)',
                  border: `1px solid ${activeSection === null ? 'var(--color-text-dim)' : 'var(--color-border)'}`,
                  color: activeSection === null ? 'var(--color-text)' : 'var(--color-text-dim)',
                }}
              >All Topics</button>
              {FAQ_SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                  className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5"
                  style={{
                    background: activeSection === s.id ? s.glow : 'var(--color-surface)',
                    border: `1px solid ${activeSection === s.id ? s.border : 'var(--color-border)'}`,
                    color: activeSection === s.id ? s.accent.replace('0.7', '1') : 'var(--color-text-dim)',
                  }}
                >
                  <span style={{ color: activeSection === s.id ? s.accent.replace('0.7', '0.9') : 'var(--color-text-dim)', display: 'flex' }}>
                    {SECTION_ICONS[s.id]}
                  </span>
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAQ content */}
        <div className="max-w-3xl mx-auto px-4 pb-20">
          {filteredSections.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg" style={{ color: 'var(--color-text-dim)' }}>No results for &ldquo;{search}&rdquo;</p>
              <button onClick={() => setSearch('')} className="mt-4 text-sm transition underline" style={{ color: 'var(--color-text-muted)' }}>Clear search</button>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredSections.map(section => (
                <div key={section.id} id={section.id}>
                    <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: section.glow, border: `1px solid ${section.border}`, color: section.accent.replace('0.7', '0.9') }}
                    >
                      {SECTION_ICONS[section.id]}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}>{section.title}</h2>
                    <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${section.border}, transparent)` }} />
                  </div>
                  <div className="space-y-2">
                    {section.questions.map((item, i) => {
                      const key = `${section.id}-${i}`;
                      return (
                        <AccordionItem
                          key={key}
                          question={item.q}
                          answer={item.a}
                          accent={section.accent}
                          isOpen={!!openItems[key]}
                          onToggle={() => toggleItem(key)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contact CTA */}
          <div className="mt-16 rounded-3xl p-8 sm:p-10" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Still have questions?</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  We are here to help. Send us a message and Tim&apos;s team will get back to you within one business day.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:min-w-[220px]">
                <a
                  href="mailto:support@timcollinsframework.com"
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl font-semibold text-sm text-white transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.9), rgba(236,72,153,0.8))' }}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Support
                </a>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-5 py-3.5 rounded-2xl font-semibold text-sm transition hover:opacity-80"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>

          {/* Footer links */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Link href="/resources" className="text-sm transition hover:opacity-80" style={{ color: 'var(--color-text-dim)' }}>Video Library</Link>
            <span style={{ color: 'var(--color-border)' }}>•</span>
            <Link href="/settings" className="text-sm transition hover:opacity-80" style={{ color: 'var(--color-text-dim)' }}>Account Settings</Link>
            <span style={{ color: 'var(--color-border)' }}>•</span>
            <Link href="/roadmap" className="text-sm transition hover:opacity-80" style={{ color: 'var(--color-text-dim)' }}>My Roadmap</Link>
          </div>
        </div>
      </div>
    </>
  );
}

