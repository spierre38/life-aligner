'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthNavbar from '@/app/components/AuthNavbar';

const FAQ_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    emoji: '🚀',
    accent: 'rgba(168,85,247,0.7)',
    glow: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.25)',
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
    title: 'Goals',
    emoji: '🎯',
    accent: 'rgba(59,130,246,0.7)',
    glow: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.25)',
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
    emoji: '🖼️',
    accent: 'rgba(20,184,166,0.7)',
    glow: 'rgba(20,184,166,0.12)',
    border: 'rgba(20,184,166,0.25)',
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
        q: 'What are Sub-Categories?',
        a: 'Sub-Categories help you break a Life Category into more specific focus areas. For example, "Health" might break into "Physical Health," "Mental Health," and "Nutrition." They are optional but can make your goals much more targeted.',
      },
      {
        q: 'What is Purpose in the LifeFrame?',
        a: 'Your Purpose captures the long-term contribution you want to make — goals that are both meaningful to you and beneficial to others. You will define at least one Purpose element when completing your Life Categories.',
      },
      {
        q: 'Can I print my LifeFrame?',
        a: 'Yes. Once your LifeFrame is complete, you will see a "Print LifeFrame" button on your dashboard. It generates a clean summary of your values, interests, and life categories.',
      },
    ],
  },
  {
    id: 'values-interests',
    title: 'Values & Interests',
    emoji: '💎',
    accent: 'rgba(249,115,22,0.7)',
    glow: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.25)',
    questions: [
      {
        q: 'What if I do not know my values yet?',
        a: 'That is exactly what the Values workbook is for. We present you with a curated set of values and guide you through a process of circling, reflecting, and prioritizing until your top 10-15 feel genuinely yours. Most people find clarity within 20-30 minutes.',
      },
      {
        q: 'Can I change my values later?',
        a: 'Absolutely. As you grow and gain new experiences, your values may evolve and you can update them at any time. Your LifeFrame is a living document — Tim Collins has been refining his own for over 40 years.',
      },
      {
        q: 'What if I do not see an interest that fits me?',
        a: 'You can type in any custom interest using the text field at the bottom of the Interests page. Your LifeFrame should be genuinely yours.',
      },
      {
        q: 'What is the difference between an Interest and a Value?',
        a: 'Values are the principles and standards that guide your decisions — the non-negotiables (e.g. Integrity, Family, Growth). Interests are activities that energize and rejuvenate you (e.g. Running, Music, Cooking). Both feed into your LifeFrame but in different ways.',
      },
    ],
  },
  {
    id: 'progress',
    title: 'Progress & Daily Habits',
    emoji: '📈',
    accent: 'rgba(34,197,94,0.7)',
    glow: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.25)',
    questions: [
      {
        q: 'How do I track my progress?',
        a: 'Regularly review your goals on the Roadmap, check off activities in your To-Do pad, and use the Daily page for your morning check-in. The Daily page also tracks your streak — consecutive days you have checked in.',
      },
      {
        q: 'What if my goals change?',
        a: 'Tim Collins Framework is built for flexibility. You can revise your goals at any time as your interests, priorities, and circumstances change. Life is not linear, and your Roadmap should not pretend to be.',
      },
      {
        q: 'What is the Daily page?',
        a: 'The Daily page is your morning check-in hub. It shows your active activities for the day, lets you log completions, and tracks your streak. Consistent daily check-ins are one of the highest-impact habits in the framework.',
      },
      {
        q: 'What are Reflections?',
        a: 'Reflections is your personal journal inside the app. Use it to capture insights, process challenges, and document your growth over time. Journaling alongside your goals creates a powerful feedback loop.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Technical',
    emoji: '⚙️',
    accent: 'rgba(139,92,246,0.7)',
    glow: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.25)',
    questions: [
      {
        q: 'Is my data private?',
        a: 'Yes. Your LifeFrame, goals, and reflections are private to you. We never share your personal data. Your data is stored securely and you can delete your account at any time from the Settings page.',
      },
      {
        q: 'Can I use the app on my phone?',
        a: 'Yes. The app is fully mobile-optimized. For the best experience, add it to your home screen — on iPhone tap the Share button then "Add to Home Screen," on Android tap the browser menu and select "Add to Home Screen."',
      },
      {
        q: 'What if I forget my password?',
        a: 'Go to the login page and click "Forgot password." We will send a reset link to your email. If you do not receive it within a few minutes, check your spam folder.',
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
        background: isOpen ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isOpen ? accent.replace('0.7', '0.3') : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-4 transition-all"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-sm sm:text-base leading-relaxed" style={{ color: isOpen ? '#fff' : 'rgba(255,255,255,0.8)' }}>
          {question}
        </span>
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ background: isOpen ? accent.replace('0.7', '0.25') : 'rgba(255,255,255,0.06)', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          <svg className="w-3 h-3" style={{ color: isOpen ? '#fff' : 'rgba(255,255,255,0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          <div className="w-8 h-0.5 rounded-full mb-4" style={{ background: accent.replace('0.7', '0.5') }} />
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
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
      <div className="min-h-screen pt-16" style={{ background: '#07070f' }}>
        {/* Hero */}
        <div className="relative py-16 sm:py-24 overflow-hidden" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(168,85,247,0.12) 0%, transparent 70%), #07070f' }}>
          <div className="absolute top-10 left-1/4 w-64 h-32 rounded-full blur-3xl opacity-20" style={{ background: 'rgba(168,85,247,0.4)' }} />
          <div className="absolute top-10 right-1/4 w-48 h-32 rounded-full blur-3xl opacity-15" style={{ background: 'rgba(59,130,246,0.4)' }} />
          <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-white/30 mb-4">Support</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
              Frequently Asked{' '}
              <span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                Questions
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/45 mb-8">Everything you need to know about the Tim Collins Framework.</p>
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm text-white placeholder-white/30 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; e.target.style.background = 'rgba(168,85,247,0.07)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
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
                style={{ background: activeSection === null ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeSection === null ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`, color: activeSection === null ? '#fff' : 'rgba(255,255,255,0.5)' }}
              >All Topics</button>
              {FAQ_SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                  className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all"
                  style={{ background: activeSection === s.id ? s.glow : 'rgba(255,255,255,0.04)', border: `1px solid ${activeSection === s.id ? s.border : 'rgba(255,255,255,0.08)'}`, color: activeSection === s.id ? s.accent.replace('0.7', '1') : 'rgba(255,255,255,0.5)' }}
                >
                  {s.emoji} {s.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAQ content */}
        <div className="max-w-3xl mx-auto px-4 pb-20">
          {filteredSections.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/30 text-lg">No results for &ldquo;{search}&rdquo;</p>
              <button onClick={() => setSearch('')} className="mt-4 text-sm text-white/50 hover:text-white transition underline">Clear search</button>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredSections.map(section => (
                <div key={section.id} id={section.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: section.glow, border: `1px solid ${section.border}` }}>
                      {section.emoji}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>{section.title}</h2>
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

          {/* CTA */}
          <div className="mt-16 rounded-3xl p-8 text-center" style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
            <p className="text-white/45 mb-6 text-sm">We are here to help. Reach out and we will get back to you.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact" className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition hover:opacity-90" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.8), rgba(236,72,153,0.7))' }}>
                Contact Us
              </Link>
              <Link href="/dashboard" className="px-6 py-3 rounded-xl font-semibold text-sm text-white/70 hover:text-white transition" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
