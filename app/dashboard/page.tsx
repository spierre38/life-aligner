'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserWithProfile } from '@/lib/auth';
import AuthNavbar from '@/app/components/AuthNavbar';
import { SkeletonCard } from '@/app/components/Skeleton';
import {
    evaluateLifeFrameCompletion,
    type LifeFrameCompletion,
} from '@/lib/lifeframe-completion';
import dynamic from 'next/dynamic';

// Welcome-flow components — lazy-loaded so first-time experience doesn't
// bloat the main dashboard bundle.
const OnboardingJourney = dynamic(() => import('@/app/components/OnboardingJourney'));
const OnboardingModal = dynamic(() => import('@/app/components/OnboardingModal').then(m => ({ default: m.OnboardingModal })));
const VideoIntroStep = dynamic(() => import('@/app/components/VideoIntroStep'));

// ─── State machine ──────────────────────────────────────────────────────────
// Drives every piece of state-specific copy and every CTA destination.

type DashState = 'new' | 'values_done' | 'interests_done' | 'complete';

function deriveState(c: LifeFrameCompletion): DashState {
    if (c.allComplete) return 'complete';
    if (c.values.isComplete && c.interests.isComplete) return 'interests_done';
    if (c.values.isComplete) return 'values_done';
    return 'new';
}

// ─── Copy config ────────────────────────────────────────────────────────────
// All state-specific copy lives here. Tweaking wording = editing this object.

type StateCopy = {
    hero: { subheader: string; ctaLabel: string; ctaHref: string };
    guide: { eyebrow: string; heading: string; ctaLabel: string; ctaHref: string };
    // Journey card badges — which card shows "Start Here" / "Continue Here".
    badge: { values: string; interests: string; life_categories: string };
};

const COPY: Record<DashState, StateCopy> = {
    new: {
        hero: {
            subheader: "Let's get started! First, we'll need to establish your values.",
            ctaLabel: 'Get Started',
            ctaHref: '/workbook/values',
        },
        guide: {
            eyebrow: "Let's build your foundation",
            heading: 'The first step in your journey is to establish your Values',
            ctaLabel: 'Establish Your Values',
            ctaHref: '/workbook/values',
        },
        badge: { values: 'Start Here', interests: 'Incomplete', life_categories: 'Incomplete' },
    },
    values_done: {
        hero: {
            subheader: "Continue your LifeFrame journey! Next, we'll need to define your interests.",
            ctaLabel: 'Define your Interests',
            ctaHref: '/workbook/interests',
        },
        guide: {
            eyebrow: "Let's build your foundation",
            heading: 'The next step in your journey is to define your Interests',
            ctaLabel: 'Define your Interests',
            ctaHref: '/workbook/interests',
        },
        badge: { values: 'Complete', interests: 'Continue Here', life_categories: 'Incomplete' },
    },
    interests_done: {
        hero: {
            subheader: "Complete your LifeFrame journey! Finally, we'll need to establish your Life Categories.",
            ctaLabel: 'Establish Your Life Categories',
            ctaHref: '/workbook/life-categories',
        },
        guide: {
            eyebrow: "Let's build your foundation",
            heading: 'The next step in your journey is to establish your Life Categories',
            ctaLabel: 'Establish your Life Categories',
            ctaHref: '/workbook/life-categories',
        },
        badge: { values: 'Complete', interests: 'Complete', life_categories: 'Continue Here' },
    },
    complete: {
        hero: {
            subheader: "Your LifeFrame is complete! Now let's build your personalized Roadmap.",
            ctaLabel: 'Build Roadmap',
            ctaHref: '/roadmap',
        },
        guide: {
            eyebrow: 'Your foundation is now set!',
            heading: 'You are now ready to build your Roadmap',
            ctaLabel: 'Build Roadmap',
            ctaHref: '/roadmap',
        },
        badge: { values: 'Complete', interests: 'Complete', life_categories: 'Complete' },
    },
};

// ─── Journey card definitions ───────────────────────────────────────────────
// Each card's visual identity (gradient) and destination is static.
// The pill label and active/muted styling come from the state above.

const CARDS = [
    {
        key: 'values' as const,
        step: 1,
        title: 'Values',
        description: 'Define your guiding principles',
        href: '/workbook/values',
        // Pastel gradient tile — matches the PDF's teal/green card.
        tileClass: 'bg-gradient-to-br from-teal-200 via-cyan-200 to-emerald-200',
    },
    {
        key: 'interests' as const,
        step: 2,
        title: 'Interests',
        description: 'What brings you joy',
        href: '/workbook/interests',
        tileClass: 'bg-gradient-to-br from-pink-200 via-rose-200 to-orange-200',
    },
    {
        key: 'life_categories' as const,
        step: 3,
        title: 'Life Categories',
        description: 'Your focus areas & purpose',
        href: '/workbook/life-categories',
        tileClass: 'bg-gradient-to-br from-purple-200 via-fuchsia-200 to-orange-200',
    },
];

// Helper: pill styling per badge label.
function badgeClass(label: string): string {
    switch (label) {
        case 'Start Here':
        case 'Continue Here':
            // Solid black pill — this is the "active" state the PDF uses.
            return 'bg-gray-900 text-white';
        case 'Complete':
            return 'bg-green-100 text-green-700 border border-green-200';
        case 'Incomplete':
        default:
            return 'bg-gray-100 text-gray-400 border border-gray-200';
    }
}

// ─── Time-of-day greeting ───────────────────────────────────────────────────

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
    const [showVideoIntro, setShowVideoIntro] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [completion, setCompletion] = useState<LifeFrameCompletion | null>(null);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                // Middleware should have caught unauth already, but keep the
                // client-side guard as belt-and-suspenders.
                const userWithProfile = await getUserWithProfile();
                if (!mounted) return;

                if (!userWithProfile) {
                    router.push('/login');
                    return;
                }

                // Admins have their own dashboard.
                if (userWithProfile.profile?.role === 'admin') {
                    router.push('/dashboard/admin');
                    return;
                }

                setUser(userWithProfile);

                // First-time users see the onboarding flow before the dashboard.
                if (!userWithProfile.profile?.welcome_seen) {
                    setShowWelcome(true);
                }

                const { data: worksheets, error } = await supabase
                    .from('workbook_entries')
                    .select('category, content')
                    .eq('user_id', userWithProfile.user.id);

                if (!mounted) return;

                if (error) {
                    // Log for ourselves; show a gentle error card to the user.
                    console.error('Dashboard worksheets fetch failed:', error);
                    setLoadError(true);
                    return;
                }

                setCompletion(evaluateLifeFrameCompletion(worksheets ?? []));
            } catch (err) {
                console.error('Dashboard load error:', err);
                if (mounted) setLoadError(true);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [router]);

    // ── Loading skeleton ────────────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-16">
                    <div className="max-w-7xl mx-auto px-4 py-12">
                        <SkeletonCard />
                    </div>
                </div>
            </>
        );
    }

    // ── Welcome flow gate (first-time users) ────────────────────────────────
    if (showWelcome) {
        return (
            <OnboardingJourney
                onComplete={() => {
                    setShowWelcome(false);
                    setShowVideoIntro(true);
                }}
                userName={user?.profile?.full_name}
            />
        );
    }

    if (showVideoIntro) {
        return (
            <VideoIntroStep
                onComplete={() => {
                    setShowVideoIntro(false);
                    setShowOnboarding(true);
                }}
            />
        );
    }

    // ── Load error fallback ────────────────────────────────────────────────
    if (loadError || !completion) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-16">
                    <div className="max-w-3xl mx-auto px-4 py-24">
                        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                We couldn't load your LifeFrame
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Something went wrong fetching your data. Refreshing usually fixes it.
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ── Main render ─────────────────────────────────────────────────────────
    const state = deriveState(completion);
    const copy = COPY[state];
    const firstName = user?.profile?.full_name?.split(' ')[0] || 'friend';

    return (
        <>
            <AuthNavbar />

            {/* Onboarding modal gets rendered on top once the video intro completes. */}
            {user?.user?.id && showOnboarding && (
                <OnboardingModal
                    userId={user.user.id}
                    onComplete={() => setShowOnboarding(false)}
                />
            )}

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 pt-16">
                <div className="max-w-6xl mx-auto px-4 py-10">

                    {/* ── Hero ─────────────────────────────────────────── */}
                    <section
                        className="relative rounded-3xl overflow-hidden mb-12 shadow-xl"
                        aria-label="Greeting"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-indigo-600 to-cyan-500" />
                        <div className="relative z-10 px-8 md:px-12 py-10 md:py-14">
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
                                {getGreeting()}, {firstName}.
                            </h1>
                            <p className="text-base md:text-lg text-white/90 mb-6 max-w-2xl">
                                <strong>
                                    {state === 'new' && "Let's get started! "}
                                    {state === 'values_done' && 'Continue your LifeFrame journey! '}
                                    {state === 'interests_done' && 'Complete your LifeFrame journey! '}
                                    {state === 'complete' && '✓ Your LifeFrame is complete! '}
                                </strong>
                                {/* Strip the leading status phrase from subheader for visual rhythm */}
                                {copy.hero.subheader
                                    .replace(/^Let's get started! /, '')
                                    .replace(/^Continue your LifeFrame journey! /, '')
                                    .replace(/^Complete your LifeFrame journey! /, '')
                                    .replace(/^Your LifeFrame is complete! /, '')}
                            </p>
                            <button
                                onClick={() => router.push(copy.hero.ctaHref)}
                                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-full font-semibold hover:shadow-2xl transition-transform hover:scale-105"
                            >
                                {copy.hero.ctaLabel}
                                <span aria-hidden>→</span>
                            </button>
                        </div>
                    </section>

                    {/* ── Journey section ──────────────────────────────── */}
                    <section className="mb-12" aria-labelledby="journey-heading">
                        <div className="text-center mb-8">
                            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-2">
                                Three steps to build your foundation
                            </p>
                            <h2 id="journey-heading" className="text-3xl md:text-4xl font-bold text-gray-900">
                                Your LifeFrame Journey
                            </h2>
                            {state === 'new' && (
                                <p className="max-w-2xl mx-auto mt-4 text-gray-600 text-sm md:text-base">
                                    Your LifeFrame is the bridge that will get you to your Roadmap.
                                    The 3 steps below should take anywhere from 30 minutes to an hour to complete.
                                    Once you have your LifeFrame, the rest becomes much clearer, you'll see!
                                </p>
                            )}
                        </div>

                        {/* Three journey cards */}
                        <div className="grid md:grid-cols-3 gap-5">
                            {CARDS.map(card => {
                                const pill = copy.badge[card.key];
                                // "Incomplete" gets a muted, lower-opacity card body.
                                const muted = pill === 'Incomplete';
                                return (
                                    <div
                                        key={card.key}
                                        className={`rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden ${
                                            muted ? 'opacity-70' : ''
                                        }`}
                                    >
                                        <div className="p-6">
                                            <span
                                                className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${badgeClass(pill)}`}
                                            >
                                                {pill}
                                            </span>
                                            <div className="flex items-baseline gap-3 mb-1">
                                                <span className={`text-2xl font-bold ${muted ? 'text-gray-400' : 'text-gray-300'}`}>
                                                    {card.step}
                                                </span>
                                                <h3 className={`text-xl md:text-2xl font-bold ${muted ? 'text-gray-500' : 'text-gray-900'}`}>
                                                    {card.title}
                                                </h3>
                                            </div>
                                            <p className={`text-sm ${muted ? 'text-gray-500' : 'text-gray-600'}`}>
                                                {card.description}
                                            </p>
                                        </div>
                                        <div className={`h-40 ${card.tileClass}`} aria-hidden />
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── At-a-Glance (complete state only) ────────────── */}
                    {state === 'complete' && (
                        <AtAGlance completion={completion} userId={user?.user?.id} />
                    )}

                    {/* ── Inline guide / Next step CTA ─────────────────── */}
                    <section className="mb-12 text-center" aria-labelledby="guide-heading">
                        <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-3">
                            {copy.guide.eyebrow}
                        </p>
                        <h2 id="guide-heading" className="text-2xl md:text-3xl font-bold text-gray-900 max-w-2xl mx-auto mb-6">
                            {copy.guide.heading}
                        </h2>
                        <button
                            onClick={() => router.push(copy.guide.ctaHref)}
                            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition"
                        >
                            {copy.guide.ctaLabel}
                            <span aria-hidden>→</span>
                        </button>
                    </section>

                    <hr className="border-gray-200 mb-12" />

                    {/* ── Resources / Community / Get Help ─────────────── */}
                    <section aria-labelledby="resources-heading">
                        <div className="text-center mb-8">
                            <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase mb-2">
                                Need some inspiration or help?
                            </p>
                            <h2 id="resources-heading" className="text-3xl md:text-4xl font-bold text-gray-900">
                                Resources, Community and More
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
                            <QuickLinkCard
                                title="Resources"
                                description="Videos, Guides and Downloads"
                                href="/resources"
                                gradient="from-amber-400 via-orange-400 to-yellow-300"
                                icon="📚"
                            />
                            <QuickLinkCard
                                title="Community"
                                description="Connect with Others"
                                href="/community"
                                gradient="from-sky-500 via-blue-600 to-indigo-700"
                                icon="👥"
                            />
                            <QuickLinkCard
                                title="Get Help"
                                description="Support and Guidance"
                                href="/resources"
                                gradient="from-orange-400 via-red-400 to-pink-500"
                                icon="❓"
                            />
                        </div>
                    </section>

                </div>
            </div>
        </>
    );
}

// ─── At-a-Glance card (complete state only) ─────────────────────────────────

function AtAGlance({ completion, userId }: { completion: LifeFrameCompletion; userId?: string }) {
    const router = useRouter();
    const [data, setData] = useState<{
        topValues: string[];
        interests: { existing: string[]; exploring: string[] };
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

            setData({
                topValues: (valuesRow?.content?.selected_values ?? [])
                    .slice(0, 3)
                    .map((v: any) => v?.name)
                    .filter(Boolean),
                interests: {
                    existing: (interestsRow?.content?.existing ?? []).slice(0, 4),
                    exploring: (interestsRow?.content?.exploring ?? []).slice(0, 4),
                },
                categories: (categoriesRow?.content?.categories ?? [])
                    .slice(0, 6)
                    .map((c: any) => (typeof c === 'string' ? c : c?.name))
                    .filter(Boolean),
            });
        };

        load();
        return () => {
            mounted = false;
        };
    }, [userId]);

    if (!data) return null;

    return (
        <section className="mb-12 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8" aria-labelledby="glance-heading">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <h2 id="glance-heading" className="text-xl md:text-2xl font-bold text-gray-900">
                    Your LifeFrame at a Glance
                </h2>
                <span className="inline-block bg-green-100 text-green-700 border border-green-200 text-xs font-semibold px-3 py-1 rounded-full">
                    Your LifeFrame is Complete
                </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
                <GlanceColumn
                    label="Top Values"
                    items={data.topValues.map((v, i) => `${i + 1}. ${v}`)}
                    tint="purple"
                />
                <GlanceColumn
                    label="Interests"
                    items={[
                        ...data.interests.existing,
                        ...data.interests.exploring,
                    ]}
                    tint="pink"
                />
                <GlanceColumn
                    label="Life Categories"
                    items={data.categories}
                    tint="green"
                />
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
                <button
                    onClick={() => router.push('/workbook/lifeframe')}
                    className="bg-gray-100 text-gray-900 px-5 py-2.5 rounded-full font-semibold hover:bg-gray-200 transition"
                >
                    View LifeFrame →
                </button>
                <button
                    onClick={() => window.open('/lifeframe/print', '_blank')}
                    className="bg-gray-100 text-gray-900 px-5 py-2.5 rounded-full font-semibold hover:bg-gray-200 transition inline-flex items-center gap-2"
                >
                    <span aria-hidden>🖨</span>
                    Print LifeFrame
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
    tint: 'purple' | 'pink' | 'green';
}) {
    const tintClasses = {
        purple: { chip: 'bg-purple-100 text-purple-800', label: 'text-purple-600' },
        pink: { chip: 'bg-pink-100 text-pink-800', label: 'text-pink-600' },
        green: { chip: 'bg-green-100 text-green-800', label: 'text-green-600' },
    }[tint];

    return (
        <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${tintClasses.label}`}>
                {label}
            </p>
            <div className="flex flex-wrap gap-2">
                {items.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">—</span>
                ) : (
                    items.map((item, i) => (
                        <span
                            key={`${item}-${i}`}
                            className={`text-xs font-medium px-3 py-1 rounded-full ${tintClasses.chip}`}
                        >
                            {item}
                        </span>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Quick link card (bottom of dashboard) ──────────────────────────────────

function QuickLinkCard({
    title,
    description,
    href,
    gradient,
    icon,
}: {
    title: string;
    description: string;
    href: string;
    gradient: string;
    icon: string;
}) {
    const router = useRouter();
    return (
        <button
            onClick={() => router.push(href)}
            className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all text-left"
            aria-label={`${title}: ${description}`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-3xl m-[2px] p-6 h-full">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-sm`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-600">{description}</p>
                    </div>
                </div>
            </div>
        </button>
    );
}