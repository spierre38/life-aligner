'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import {
    evaluateLifeFrameCompletion,
    type LifeFrameCompletion,
} from '@/lib/lifeframe-completion';
import dynamic from 'next/dynamic';
import { getAllTodos, type TodoItem, URGENCY_COLOR } from '@/lib/todos';

// Welcome-flow components — lazy-loaded so first-time experience doesn't
// bloat the main dashboard bundle.
const OnboardingJourney = dynamic(() => import('@/app/components/OnboardingJourney'), {
    loading: () => (
        <div className="fixed inset-0 z-50" style={{ background: 'radial-gradient(ellipse at 20% 40%, #1e1b4b 0%, #080818 52%, #000 100%)' }} />
    ),
});
const OnboardingModal = dynamic(
    () => import('@/app/components/OnboardingModal').then(m => ({ default: m.OnboardingModal })),
    { loading: () => null }
);
import VideoPlayer from '@/app/components/VideoPlayer';
import { getVideo } from '@/lib/videos';
import { parseVideoProgress } from '@/lib/video-progress';

// ─── State machine ──────────────────────────────────────────────────────────

type DashState = 'new' | 'values_done' | 'interests_done' | 'complete';

function deriveState(c: LifeFrameCompletion): DashState {
    if (c.allComplete) return 'complete';
    if (c.values.isComplete && c.interests.isComplete) return 'interests_done';
    if (c.values.isComplete) return 'values_done';
    return 'new';
}

// ─── Copy config ────────────────────────────────────────────────────────────
// All state-specific copy lives here so tweaking wording = editing this object.
// The hero splits the subheader into a bold lead + rest, rendered as two spans
// in JSX (no inline string replacement, no regex).

type StateCopy = {
    hero: { leadBold: string; rest: string; ctaLabel: string; ctaHref: string };
    guide: { eyebrow: string; headingLine1: string; headingLine2: string; ctaLabel: string; ctaHref: string };
    badge: { values: string; interests: string; life_categories: string };
};

const COPY: Record<DashState, StateCopy> = {
    new: {
        hero: {
            leadBold: "Let's get started!",
            rest: " First, we'll need to establish your values.",
            ctaLabel: 'Get Started',
            ctaHref: '/workbook/values',
        },
        guide: {
            eyebrow: "Let's build your foundation",
            headingLine1: 'The first step in your journey',
            headingLine2: 'is to establish your Values',
            ctaLabel: 'Establish Your Values',
            ctaHref: '/workbook/values',
        },
        badge: { values: 'Start Here', interests: 'Incomplete', life_categories: 'Incomplete' },
    },
    values_done: {
        hero: {
            leadBold: 'Continue your LifeFrame journey!',
            rest: " Next, we'll need to define your interests.",
            ctaLabel: 'Define your Interests',
            ctaHref: '/workbook/interests',
        },
        guide: {
            eyebrow: "Let's build your foundation",
            headingLine1: 'The next step in your journey',
            headingLine2: 'is to define your Interests',
            ctaLabel: 'Define your Interests',
            ctaHref: '/workbook/interests',
        },
        badge: { values: 'Complete', interests: 'Continue Here', life_categories: 'Incomplete' },
    },
    interests_done: {
        hero: {
            leadBold: 'Complete your LifeFrame journey!',
            rest: " Finally, we'll need to establish your Life Categories.",
            ctaLabel: 'Establish Your Life Categories',
            ctaHref: '/workbook/life-categories',
        },
        guide: {
            eyebrow: "Let's build your foundation",
            headingLine1: 'The next step in your journey is',
            headingLine2: 'to establish your Life Categories',
            ctaLabel: 'Establish your Life Categories',
            ctaHref: '/workbook/life-categories',
        },
        badge: { values: 'Complete', interests: 'Complete', life_categories: 'Continue Here' },
    },
    complete: {
        hero: {
            leadBold: 'Your LifeFrame is complete!',
            rest: " Time to build your personalized Roadmap.",
            ctaLabel: 'Go to Roadmap',
            ctaHref: '/roadmap',
        },
        guide: {
            eyebrow: 'Your foundation is now set!',
            headingLine1: 'You are now ready',
            headingLine2: 'to build your Roadmap',
            ctaLabel: 'Go to Roadmap',
            ctaHref: '/roadmap',
        },
        badge: { values: 'Complete', interests: 'Complete', life_categories: 'Complete' },
    },
};

// ─── Journey card definitions ───────────────────────────────────────────────

const CARDS = [
    {
        key: 'values' as const,
        step: 1,
        title: 'Values',
        description: 'Define your guiding principles',
        href: '/workbook/values',
        // Mesh gradient B1: purple + orange — matching kit swatch
        meshVar: 'var(--mesh-b1)',
    },
    {
        key: 'interests' as const,
        step: 2,
        title: 'Interests',
        description: 'What brings you joy',
        href: '/workbook/interests',
        // Mesh gradient E1: green + teal
        meshVar: 'var(--mesh-e1)',
    },
    {
        key: 'life_categories' as const,
        step: 3,
        title: 'Life Categories',
        description: 'Your focus areas and purpose',
        href: '/workbook/life-categories',
        // Mesh gradient D1: blue + cyan
        meshVar: 'var(--mesh-d1)',
    },
];

// Pill styling per badge label — Tim 2026 dark palette.
// Two helpers: className for layout/typography, style object for backgrounds.
function badgeClass(label: string): string {
    switch (label) {
        case 'Start Here':
        case 'Continue Here':
            return 'text-black font-semibold shadow-md';
        case 'Complete':
            return 'font-semibold';
        case 'Incomplete':
        default:
            return 'font-medium';
    }
}

function badgeStyle(label: string): React.CSSProperties {
    switch (label) {
        case 'Start Here':
        case 'Continue Here':
            return { background: '#FFFFFF', color: '#000' };
        case 'Complete':
            return { background: 'rgba(0,200,100,0.45)', color: '#fff', border: '1px solid rgba(0,200,100,0.55)' };
        case 'Incomplete':
        default:
            return { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.10)' };
    }
}


function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [urgentTodos, setUrgentTodos] = useState<TodoItem[]>([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [watchedVideoIds, setWatchedVideoIds] = useState<Set<string>>(new Set());
    const [activeVideo, setActiveVideo] = useState<{ video: any; src: string } | null>(null);
    const [completion, setCompletion] = useState<LifeFrameCompletion | null>(null);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const userWithProfile = await getUserWithProfile();
                if (!mounted) return;

                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }

                if (userWithProfile.profile?.role === 'admin') {
                    router.push('/dashboard/admin');
                    return;
                }

                setUser(userWithProfile);

                if (userWithProfile.profile?.video_progress) {
                    const prog = parseVideoProgress(userWithProfile.profile.video_progress);
                    setWatchedVideoIds(new Set(prog.watched));
                }

                if (!userWithProfile.profile?.welcome_seen) {
                    setShowWelcome(true);
                }

                const { data: worksheets, error } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', userWithProfile.user.id);

                if (!mounted) return;

                if (error) {
                    console.error('Dashboard worksheets fetch failed:', error);
                    setLoadError(true);
                    return;
                }

                setCompletion(evaluateLifeFrameCompletion(worksheets ?? []));

                // Load urgent tasks for Today's Focus card (inside mounted guard)
                const { data: todoData } = await getAllTodos();
                if (!mounted) return;
                if (todoData) {
                    setUrgentTodos(todoData.filter(t => !t.completed && (t.urgency === 'overdue' || t.urgency === 'today')));
                }
            } catch (err) {
                console.error('Dashboard load error:', err);
                if (mounted) setLoadError(true);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();

        return () => { mounted = false; };
    }, [router]);

    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen pt-navbar" style={{ background: 'var(--color-bg)' }}>
                    <div className="max-w-6xl mx-auto px-4 py-12">
                        <div className="h-64 rounded-3xl animate-pulse" style={{ background: 'var(--color-surface)' }} />
                    </div>
                </div>
            </>
        );
    }

    if (showWelcome) {
        return (
            <OnboardingJourney
                onComplete={() => {
                    setShowWelcome(false);
                }}
                userName={user?.profile?.full_name}
            />
        );
    }

    if (loadError || !completion) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen pt-navbar" style={{ background: 'var(--color-bg)' }}>
                    <div className="max-w-3xl mx-auto px-4 py-24">
                        <div className="rounded-3xl p-8 md:p-12 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                            <h2 className="text-2xl font-semibold mb-3" style={{ color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                                We couldn't load your LifeFrame
                            </h2>
                            <p className="mb-6" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-body-m)' }}>
                                Something went wrong fetching your data. Refreshing usually fixes it.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80"
                                style={{ background: 'var(--color-text)', color: 'var(--color-bg)' }}
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const state = deriveState(completion);
    const baseCopy = COPY[state];
    const firstName = user?.profile?.full_name?.split(' ')[0] || 'friend';

    // ─── Dynamic CTA enrichment ─────────────────────────────────────────
    // When a section is incomplete, override the generic copy with a
    // specific message explaining *why* the user can't progress.
    const copy = (() => {
        const c = { ...baseCopy, hero: { ...baseCopy.hero }, guide: { ...baseCopy.guide } };

        // Only enrich when there's a specific blocker to explain
        const section = completion.nextIncomplete;
        if (!section) return c;

        const s = completion[section];

        if (section === 'values') {
            if (s.status === 'too_many') {
                c.hero.leadBold = `You have ${s.counts.total} values selected.`;
                c.hero.rest = ` Narrow down to ${s.thresholds.max} or fewer to continue to Interests.`;
                c.hero.ctaLabel = 'Edit Your Values';
                c.guide.headingLine1 = `You've selected ${s.counts.total} values`;
                c.guide.headingLine2 = `— narrow to ${s.thresholds.max} or fewer`;
                c.guide.ctaLabel = 'Edit Your Values';
            } else if (s.status === 'needs_more') {
                c.hero.leadBold = `You have ${s.counts.total} value${(s.counts.total ?? 0) === 1 ? '' : 's'} so far.`;
                c.hero.rest = ` Select at least ${s.thresholds.min} to continue to Interests.`;
                c.hero.ctaLabel = 'Continue Selecting Values';
                c.guide.headingLine1 = `You've selected ${s.counts.total} value${(s.counts.total ?? 0) === 1 ? '' : 's'}`;
                c.guide.headingLine2 = `— select at least ${s.thresholds.min} to continue`;
                c.guide.ctaLabel = 'Continue Selecting Values';
            } else if (s.status === 'missing_priorities') {
                c.hero.leadBold = 'Almost there!';
                c.hero.rest = ' Your values need priorities assigned before you can continue.';
                c.hero.ctaLabel = 'Prioritize Your Values';
                c.guide.headingLine1 = 'Your values need';
                c.guide.headingLine2 = 'priorities assigned';
                c.guide.ctaLabel = 'Prioritize Your Values';
            }
        } else if (section === 'interests') {
            const ex = s.counts.existing ?? 0;
            const exp = s.counts.exploring ?? 0;
            const exMin = s.thresholds.existingMin ?? 3;
            const expMin = s.thresholds.exploringMin ?? 1;

            if (s.status === 'needs_more') {
                const parts: string[] = [];
                if (ex < exMin) parts.push(`${exMin - ex} more existing interest${exMin - ex === 1 ? '' : 's'}`);
                if (exp < expMin) parts.push(`${expMin - exp} more to explore`);
                c.hero.leadBold = `Your interests need a bit more.`;
                c.hero.rest = ` Add ${parts.join(' and ')} to continue.`;
                c.guide.headingLine1 = `Add ${parts.join(' and ')}`;
                c.guide.headingLine2 = 'to continue building your LifeFrame';
            }
        } else if (section === 'life_categories') {
            if (s.status === 'too_many') {
                c.hero.leadBold = `You have ${s.counts.total} life categories.`;
                c.hero.rest = ` Narrow down to ${s.thresholds.max} or fewer to continue.`;
            } else if (s.status === 'needs_more') {
                c.hero.leadBold = `You have ${s.counts.total} life categor${(s.counts.total ?? 0) === 1 ? 'y' : 'ies'}.`;
                c.hero.rest = ` Add at least ${s.thresholds.min} to continue.`;
            } else if (s.status === 'missing_purpose') {
                c.hero.leadBold = 'Your life categories need a purpose.';
                c.hero.rest = ' Add at least one purpose element to continue.';
            }
        }

        return c;
    })();

    return (
        <>
            <AuthNavbar />

            {/* Dashboard entrance animation keyframes */}
            <style>{`
                @keyframes dashFadeUp {
                    from { opacity: 0; transform: translateY(28px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .dash-entrance {
                    opacity: 0;
                    animation: dashFadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>

            {user?.user?.id && showOnboarding && (
                <OnboardingModal
                    userId={user.user.id}
                    onComplete={() => setShowOnboarding(false)}
                />
            )}

            <div className="min-h-screen pt-navbar" style={{ background: 'var(--color-bg)' }}>
                <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">

                    {/* ── Hero — Tim 2026 mesh gradient A1 ─────────────── */}
                    <section
                        className="relative rounded-3xl overflow-hidden mb-14 dash-entrance"
                        aria-label="Greeting"
                        style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.5)', animationDelay: '0.05s' }}
                    >
                        {/* Mesh gradient A1: Black + Magenta + Cyan */}
                        <div
                            className="absolute inset-0"
                            style={{ background: 'var(--mesh-a1)' }}
                        />
                        {/* Subtle noise texture overlay for premium feel */}
                        <div
                            className="absolute inset-0 opacity-30"
                            style={{
                                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.15\'/%3E%3C/svg%3E")',
                                backgroundSize: '200px 200px',
                            }}
                        />
                        <div className="relative z-10 px-8 md:px-14 py-14 md:py-20">
                            <h1
                                className="font-normal text-white mb-4 leading-tight"
                                style={{ fontSize: 'var(--fs-h2)', letterSpacing: '-0.03em' }}
                            >
                                {getGreeting()}, {firstName}.
                            </h1>
                            <p className="text-white/80 mb-8 max-w-2xl" style={{ fontSize: 'var(--fs-body-l)', letterSpacing: '-0.02em' }}>
                                <span className="text-white font-medium">{copy.hero.leadBold}</span>{' '}
                                <span className="text-white/70">{copy.hero.rest}</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href={copy.hero.ctaHref}
                                    className="inline-flex items-center gap-2.5 bg-white text-black px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]"
                                    style={{ letterSpacing: '-0.01em' }}
                                >
                                    {copy.hero.ctaLabel}
                                    <span aria-hidden>→</span>
                                </Link>

                                {/* Secondary CTA: only for non-complete states to guide to Roadmap after LifeFrame */}

                                {/* Welcome video — first-time only */}
                                {!watchedVideoIds.has('v1-welcome') && (
                                    <button
                                        onClick={() => {
                                            const v1 = getVideo('v1-welcome');
                                            if (v1?.blobUrl) setActiveVideo({ video: v1, src: v1.blobUrl });
                                        }}
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/10 active:scale-[0.98] cursor-pointer"
                                        style={{
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.18)',
                                            color: 'white',
                                            backdropFilter: 'blur(8px)',
                                        }}
                                        aria-label="Watch Welcome Video from Tim"
                                    >
                                        <svg className="w-3.5 h-3.5 text-purple-300" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                        <span>Watch Welcome from Tim (5 min)</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* ── Today's Focus Card (only when tasks need attention) ── */}
                    {urgentTodos.length > 0 && (
                        <section className="mb-10 dash-entrance" aria-label="Today's Focus" style={{ animationDelay: '0.18s' }}>
                            <div
                                className="rounded-2xl p-5"
                                style={{
                                    background: 'var(--color-surface)',
                                    border: '1px solid rgba(249,115,22,0.3)',
                                    boxShadow: '0 4px 24px rgba(249,115,22,0.08)',
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                                            Today's Focus
                                        </h2>
                                        <span
                                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                            style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}
                                        >
                                            {urgentTodos.length} pending
                                        </span>
                                    </div>
                                    <Link
                                        href="/todo"
                                        className="text-xs font-medium transition-opacity hover:opacity-70"
                                        style={{ color: 'var(--color-text-dim)' }}
                                    >
                                        View all →
                                    </Link>
                                </div>
                                <div className="space-y-2">
                                    {urgentTodos.slice(0, 4).map(todo => (
                                        <div
                                            key={todo.id}
                                            className="flex items-center gap-3 py-2"
                                            style={{ borderBottom: '1px solid var(--color-border)' }}
                                        >
                                            <div
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ background: URGENCY_COLOR[todo.urgency ?? 'today'].dot }}
                                            />
                                            <span className="flex-1 text-sm" style={{ color: 'var(--color-text)' }}>
                                                {todo.text}
                                            </span>
                                            {todo.category && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-dim)' }}>
                                                    {todo.category}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {urgentTodos.length > 4 && (
                                    <Link
                                        href="/todo"
                                        className="block text-center text-xs mt-3 transition-opacity hover:opacity-70"
                                        style={{ color: 'var(--color-text-dim)' }}
                                    >
                                        + {urgentTodos.length - 4} more in To-Do
                                    </Link>
                                )}
                            </div>
                        </section>
                    )}

                    {/* ── Journey cards ────────────────────────────────── */}
                    <section className="mb-14 dash-entrance" aria-labelledby="journey-heading" style={{ animationDelay: '0.28s' }}>
                        <div className="text-center mb-10">
                            <p className="text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: 'var(--color-text-dim)' }}>
                                Three steps to build your foundation
                            </p>
                            <h2 id="journey-heading" className="font-normal" style={{ fontSize: 'var(--fs-h3)', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                                Your LifeFrame Journey
                            </h2>
                            {state === 'new' && (
                                <p className="max-w-xl mx-auto mt-4" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-body-s)', lineHeight: '1.7' }}>
                                    Your LifeFrame is the bridge that will get you to your Roadmap.
                                    The 3 steps below should take anywhere from 30 minutes to an hour.
                                    Once you have your LifeFrame, the rest becomes much clearer.
                                </p>
                            )}
                        </div>

                        <div className="grid md:grid-cols-3 gap-5 pt-4">
                            {CARDS.map((card, i) => {
                                const pill = copy.badge[card.key];
                                const muted = pill === 'Incomplete';
                                return (
                                    <Link
                                        key={card.key}
                                        href={card.href}
                                        className={`group relative rounded-3xl transition-all duration-300 dash-entrance ${muted ? 'opacity-50' : 'hover:-translate-y-1.5'}`}
                                        style={{
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            boxShadow: muted ? 'none' : '0 8px 32px rgba(0,0,0,0.3)',
                                            animationDelay: `${0.32 + i * 0.1}s`,
                                        }}
                                        aria-label={`${card.title}: ${card.description}`}
                                    >
                                        {/* Pill badge */}
                                        <span
                                            className={`absolute left-5 -top-3 z-10 text-xs px-3 py-1 rounded-full ${badgeClass(pill)}`}
                                            style={badgeStyle(pill)}
                                        >
                                            {pill}
                                        </span>

                                        <div className="p-6 pt-8">
                                            <div className="flex items-baseline gap-3 mb-1">
                                                <span
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full text-base font-medium"
                                                    style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-text-muted)' }}
                                                >
                                                    {card.step}
                                                </span>
                                                <h3
                                                    className="text-xl md:text-2xl font-medium"
                                                    style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}
                                                >
                                                    {card.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm ml-11 mb-4" style={{ color: 'var(--color-text-muted)' }}>
                                                {card.description}
                                            </p>
                                        </div>

                                        {/* Mesh gradient tile — matches kit swatch exactly */}
                                        <div
                                            className="mx-3 mb-3 h-44 rounded-2xl overflow-hidden"
                                            style={{ background: card.meshVar }}
                                            aria-hidden
                                        />
                                    </Link>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── At-a-Glance (complete state only) ──────────────── */}
                    {state === 'complete' && (
                        <AtAGlance completion={completion} userId={user?.user?.id} />
                    )}

                    {/* ── Guide / Next step CTA ───────────────────────────── */}
                    <section className="mb-16 text-center dash-entrance" aria-labelledby="guide-heading" style={{ animationDelay: '0.42s' }}>
                        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--color-text-dim)' }}>
                            {copy.guide.eyebrow}
                        </p>
                        <h2
                            id="guide-heading"
                            className="font-normal mb-8 leading-tight"
                            style={{ fontSize: 'var(--fs-h3)', color: 'var(--color-text)', letterSpacing: '-0.02em' }}
                        >
                            {copy.guide.headingLine1}<br />{copy.guide.headingLine2}
                        </h2>
                        <Link
                            href={copy.guide.ctaHref}
                            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ background: 'var(--color-text)', color: 'var(--color-bg)', letterSpacing: '-0.01em' }}
                        >
                            {copy.guide.ctaLabel}
                            <span aria-hidden>→</span>
                        </Link>
                    </section>

                    <hr className="dash-entrance" style={{ borderColor: 'var(--color-border)', marginBottom: '3.5rem', animationDelay: '0.50s' }} />

                    {/* ── Resources / Community / Get Help ────────────────── */}
                    <section aria-labelledby="resources-heading" className="pb-16 dash-entrance" style={{ animationDelay: '0.55s' }}>
                        <div className="text-center mb-10">
                            <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-dim)' }}>
                                Need some inspiration or help?
                            </p>
                            <h2 id="resources-heading" className="font-normal" style={{ fontSize: 'var(--fs-h3)', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                                Resources, community and More
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
                            <QuickLinkCard
                                title="Resources"
                                description="Videos, Guides and Downloads"
                                href="/resources"
                                meshVar="var(--mesh-e1)"
                                Icon={BookIcon}
                            />
                            <QuickLinkCard
                                title="Get Help"
                                description="Support and Guidance"
                                href="/help"
                                meshVar="var(--mesh-b1)"
                                Icon={QuestionIcon}
                            />
                        </div>
                    </section>

                </div>
            </div>

            {/* Video Player Modal */}
            {activeVideo && (
                <VideoPlayer
                    video={activeVideo.video}
                    src={activeVideo.src}
                    onClose={() => setActiveVideo(null)}
                    onWatched={(vid) => setWatchedVideoIds(prev => new Set(prev).add(vid))}
                />
            )}
        </>
    );
}

// ─── At-a-Glance card (complete state only) ─────────────────────────────────

function AtAGlance({ completion, userId }: { completion: LifeFrameCompletion; userId?: string }) {
    const router = useRouter();
    const [data, setData] = useState<{
        topValues: string[];
        interests: string[];
        categories: string[];
    } | null>(null);

    useEffect(() => {
        if (!userId) return;
        let mounted = true;

        const load = async () => {
            const { data: rows } = await supabase
                .from('workbook_entries')
                .select('category, content')
                .eq('user_id', userId)
                .in('category', ['values', 'interests', 'life_categories']);

            if (!mounted || !rows) return;

            const valuesRow = rows.find(r => r.category === 'values');
            const interestsRow = rows.find(r => r.category === 'interests');
            const categoriesRow = rows.find(r => r.category === 'life_categories');

            const interestsExisting: string[] = (interestsRow?.content?.existing ?? []).slice(0, 4);
            const interestsExploring: string[] = (interestsRow?.content?.exploring ?? []).slice(0, 2);

            setData({
                topValues: (valuesRow?.content?.selected_values ?? [])
                    .slice(0, 3)
                    .map((v: any) => v?.name)
                    .filter(Boolean),
                interests: [...interestsExisting, ...interestsExploring],
                categories: (categoriesRow?.content?.categories ?? [])
                    .slice(0, 6)
                    .map((c: any) => (typeof c === 'string' ? c : c?.name))
                    .filter(Boolean),
            });
        };

        load();
        return () => { mounted = false; };
    }, [userId]);

    if (!data) return null;

    return (
        <section
            className="mb-14 rounded-3xl p-6 md:p-8"
            aria-labelledby="glance-heading"
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
            }}
        >
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <h2 id="glance-heading" className="text-xl md:text-2xl font-medium" style={{ color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                    Your LifeFrame at a Glance
                </h2>
                <span
                    className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,204,100,0.15)', color: '#00cc64', border: '1px solid rgba(0,204,100,0.25)' }}
                >
                    Your LifeFrame is Complete
                </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
                <GlanceColumn label="Top Values"      items={data.topValues.map((v, i) => `${i + 1}. ${v}`)} tint="purple" />
                <GlanceColumn label="Interests"       items={data.interests} tint="cyan" />
                <GlanceColumn label="Life Categories" items={data.categories} tint="green" />
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
                <button
                    onClick={() => router.push('/workbook/lifeframe')}
                    className="px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:opacity-80"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                    View LifeFrame →
                </button>
                <button
                    onClick={() => window.open('/lifeframe/print', '_blank')}
                    className="px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:opacity-80 inline-flex items-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                >
                    <span aria-hidden>🖨</span> Print LifeFrame
                </button>
            </div>
        </section>
    );
}

function GlanceColumn({
    label,
    items,
    tint,
}: {
    label: string;
    items: string[];
    tint: 'purple' | 'cyan' | 'green';
}) {
    const tintStyles = {
        purple: { chip: { background: 'rgba(180,100,255,0.15)', color: '#c084fc', border: '1px solid rgba(180,100,255,0.2)' }, label: { color: '#c084fc' } },
        cyan:   { chip: { background: 'rgba(0,212,255,0.12)',   color: '#22d3ee', border: '1px solid rgba(0,212,255,0.2)'   }, label: { color: '#22d3ee' } },
        green:  { chip: { background: 'rgba(0,200,100,0.12)',   color: '#34d399', border: '1px solid rgba(0,200,100,0.2)'   }, label: { color: '#34d399' } },
    }[tint];

    return (
        <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={tintStyles.label}>
                {label}
            </p>
            <div className="flex flex-wrap gap-2">
                {items.length === 0 ? (
                    <span className="text-xs italic" style={{ color: 'var(--color-text-dim)' }}>—</span>
                ) : (
                    items.map((item, i) => (
                        <span
                            key={`${item}-${i}`}
                            className="text-xs font-medium px-3 py-1 rounded-full"
                            style={tintStyles.chip}
                        >
                            {item}
                        </span>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Bottom quick-link cards ────────────────────────────────────────────────
// Two-zone layout: colored gradient tile on the LEFT with a white line icon,
// white area on the RIGHT with title + description. Matches the PDF.

type IconProps = { className?: string };

function BookIcon({ className = 'w-7 h-7' }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
    );
}

function PeopleIcon({ className = 'w-7 h-7' }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="3" />
            <circle cx="17" cy="9" r="2.5" />
            <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            <path d="M14.5 20c0-2.5 1.5-5 5-5" />
        </svg>
    );
}

function QuestionIcon({ className = 'w-7 h-7' }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1.3-1.5 2.2v.5" />
            <circle cx="11.75" cy="17.25" r="0.6" fill="currentColor" stroke="none" />
        </svg>
    );
}

function QuickLinkCard({
    title,
    description,
    href,
    meshVar,
    Icon,
}: {
    title: string;
    description: string;
    href: string;
    meshVar: string;
    Icon: React.FC<IconProps>;
}) {
    return (
        <Link
            href={href}
            className="group flex items-stretch rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
            aria-label={`${title}: ${description}`}
        >
            {/* Left: mesh gradient tile with icon */}
            <div
                className="shrink-0 w-24 flex items-center justify-center text-white"
                style={{ background: meshVar }}
            >
                <Icon className="w-8 h-8" />
            </div>
            {/* Right: text zone */}
            <div className="flex-1 px-5 py-4">
                <h3 className="text-base font-medium mb-0.5" style={{ color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                    {title}
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
            </div>
        </Link>
    );
}