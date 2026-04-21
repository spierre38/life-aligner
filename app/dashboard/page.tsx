'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
            rest: " Now let's build your personalized Roadmap.",
            ctaLabel: 'Build Roadmap',
            ctaHref: '/roadmap',
        },
        guide: {
            eyebrow: 'Your foundation is now set!',
            headingLine1: 'You are now ready',
            headingLine2: 'to build your Roadmap',
            ctaLabel: 'Build Roadmap',
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
        // Pastel gradient tiles matching the PDF mockup.
        tileClass: 'bg-gradient-to-br from-teal-200 via-cyan-200 to-emerald-300',
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
        description: 'Your focus areas and purpose',
        href: '/workbook/life-categories',
        tileClass: 'bg-gradient-to-br from-purple-300 via-fuchsia-300 to-orange-300',
    },
];

// Pill styling per badge label.
function badgeClass(label: string): string {
    switch (label) {
        case 'Start Here':
        case 'Continue Here':
            // Solid black pill with white text — the PDF's "active" treatment.
            return 'bg-gray-900 text-white shadow-md';
        case 'Complete':
            return 'bg-green-500 text-white shadow-sm';
        case 'Incomplete':
        default:
            return 'bg-gray-200 text-gray-500';
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
    const [showVideoIntro, setShowVideoIntro] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
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
                <div className="min-h-screen bg-gray-50 pt-16">
                    <div className="max-w-6xl mx-auto px-4 py-12">
                        <SkeletonCard />
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

    if (loadError || !completion) {
        return (
            <>
                <AuthNavbar />
                <div className="min-h-screen bg-gray-50 pt-16">
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

    const state = deriveState(completion);
    const copy = COPY[state];
    const firstName = user?.profile?.full_name?.split(' ')[0] || 'friend';

    return (
        <>
            <AuthNavbar />

            {user?.user?.id && showOnboarding && (
                <OnboardingModal
                    userId={user.user.id}
                    onComplete={() => setShowOnboarding(false)}
                />
            )}

            <div className="min-h-screen bg-gray-50 pt-16">
                <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">

                    {/* ── Hero ─────────────────────────────────────────────
                        Dramatic gradient matching the PDF: deep purple on the
                        left through magenta/indigo into cyan on the right.
                        Using arbitrary color stops for fidelity.
                    */}
                    <section
                        className="relative rounded-3xl overflow-hidden mb-14 shadow-xl"
                        aria-label="Greeting"
                    >
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    'linear-gradient(115deg, #2e1065 0%, #7c3aed 22%, #6b21a8 40%, #1e1b4b 62%, #0c4a6e 80%, #22d3ee 100%)',
                            }}
                        />
                        <div className="relative z-10 px-8 md:px-14 py-12 md:py-16">
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                                {getGreeting()}, {firstName}.
                            </h1>
                            <p className="text-base md:text-lg text-white/95 mb-7 max-w-2xl">
                                <span className="font-semibold">{copy.hero.leadBold}</span>
                                <span className="text-white/80">{copy.hero.rest}</span>
                            </p>
                            <Link
                                href={copy.hero.ctaHref}
                                className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                            >
                                {copy.hero.ctaLabel}
                                <span aria-hidden>→</span>
                            </Link>
                        </div>
                    </section>

                    {/* ── Journey section ────────────────────────────────── */}
                    <section className="mb-14" aria-labelledby="journey-heading">
                        <div className="text-center mb-10">
                            <p className="text-xs font-medium text-gray-600 mb-2">
                                Three steps to build your foundation
                            </p>
                            <h2 id="journey-heading" className="text-3xl md:text-4xl font-bold text-gray-900">
                                Your LifeFrame Journey
                            </h2>
                            {state === 'new' && (
                                <p className="max-w-xl mx-auto mt-5 text-gray-600 text-sm md:text-base leading-relaxed">
                                    Your LifeFrame is the bridge that will get you to your Roadmap.
                                    The 3 steps below should take anywhere from 30 minutes to an hour to complete.
                                    Once you have your LifeFrame, the rest becomes much clearer, you'll see!
                                </p>
                            )}
                        </div>

                        {/* Three journey cards — entire card is a clickable Link.
                            Pill overlaps the top edge of the card (half above, half below).
                            Step number sits inside a thin gray ring. */}
                        <div className="grid md:grid-cols-3 gap-5 pt-4">
                            {CARDS.map(card => {
                                const pill = copy.badge[card.key];
                                const muted = pill === 'Incomplete';
                                return (
                                    <Link
                                        key={card.key}
                                        href={card.href}
                                        className={`group relative rounded-3xl bg-white border border-gray-200 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg ${muted ? 'opacity-60' : 'shadow-sm'
                                            }`}
                                        aria-label={`${card.title}: ${card.description}`}
                                    >
                                        {/* Pill — overlaps the top edge of the card */}
                                        <span
                                            className={`absolute left-6 -top-3 text-xs font-semibold px-3 py-1 rounded-full ${badgeClass(pill)}`}
                                        >
                                            {pill}
                                        </span>

                                        <div className="p-6 pt-8">
                                            <div className="flex items-baseline gap-3 mb-1">
                                                <span
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-base font-semibold ${muted
                                                            ? 'border-gray-300 text-gray-400'
                                                            : 'border-gray-300 text-gray-500'
                                                        }`}
                                                >
                                                    {card.step}
                                                </span>
                                                <h3 className={`text-xl md:text-2xl font-bold ${muted ? 'text-gray-500' : 'text-gray-900'}`}>
                                                    {card.title}
                                                </h3>
                                            </div>
                                            <p className={`text-sm ml-11 ${muted ? 'text-gray-500' : 'text-gray-600'}`}>
                                                {card.description}
                                            </p>
                                        </div>

                                        {/* Gradient tile with matching rounded bottom corners */}
                                        <div className={`mx-3 mb-3 h-40 rounded-2xl ${card.tileClass}`} aria-hidden />
                                    </Link>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── At-a-Glance (complete state only) ──────────────── */}
                    {state === 'complete' && (
                        <AtAGlance completion={completion} userId={user?.user?.id} />
                    )}

                    {/* ── Inline guide / Next step CTA ───────────────────── */}
                    <section className="mb-16 text-center" aria-labelledby="guide-heading">
                        <p className="text-xs font-medium text-gray-600 mb-3">
                            {copy.guide.eyebrow}
                        </p>
                        {/* Heading on two explicit lines to match PDF composition */}
                        <h2 id="guide-heading" className="text-2xl md:text-4xl font-semibold text-gray-900 mb-8 leading-tight">
                            {copy.guide.headingLine1}
                            <br />
                            {copy.guide.headingLine2}
                        </h2>
                        <Link
                            href={copy.guide.ctaHref}
                            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
                        >
                            {copy.guide.ctaLabel}
                            <span aria-hidden>→</span>
                        </Link>
                    </section>

                    <hr className="border-gray-200 mb-14" />

                    {/* ── Resources / Community / Get Help ───────────────── */}
                    <section aria-labelledby="resources-heading">
                        <div className="text-center mb-10">
                            <p className="text-xs font-medium text-gray-600 mb-2">
                                Need some inspiration or help?
                            </p>
                            <h2 id="resources-heading" className="text-3xl md:text-4xl font-bold text-gray-900">
                                Resources, community and More
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
                            <QuickLinkCard
                                title="Resources"
                                description="Videos, Guides and Downloads"
                                href="/resources"
                                tileGradient="from-orange-400 via-amber-400 to-lime-400"
                                Icon={BookIcon}
                            />
                            <QuickLinkCard
                                title="Community"
                                description="Connect with Others"
                                href="/community"
                                tileGradient="from-cyan-500 via-blue-700 to-indigo-900"
                                Icon={PeopleIcon}
                            />
                            <QuickLinkCard
                                title="Get Help"
                                description="Support and Guidance"
                                href="/resources"
                                tileGradient="from-orange-400 via-red-500 to-pink-500"
                                Icon={QuestionIcon}
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
        <section className="mb-14 bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8" aria-labelledby="glance-heading">
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
                <GlanceColumn label="Interests" items={data.interests} tint="pink" />
                <GlanceColumn label="Life Categories" items={data.categories} tint="green" />
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
                <button
                    onClick={() => router.push('/workbook/lifeframe')}
                    className="bg-gray-100 text-gray-900 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition"
                >
                    View LifeFrame →
                </button>
                <button
                    onClick={() => window.open('/lifeframe/print', '_blank')}
                    className="bg-gray-100 text-gray-900 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition inline-flex items-center gap-2"
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
    tileGradient,
    Icon,
}: {
    title: string;
    description: string;
    href: string;
    tileGradient: string;
    Icon: React.FC<IconProps>;
}) {
    return (
        <Link
            href={href}
            className="group flex items-stretch rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden"
            aria-label={`${title}: ${description}`}
        >
            {/* Left: gradient tile with white line-icon */}
            <div className={`shrink-0 w-24 flex items-center justify-center bg-gradient-to-br ${tileGradient} text-white`}>
                <Icon className="w-8 h-8" />
            </div>
            {/* Right: text zone */}
            <div className="flex-1 px-5 py-4">
                <h3 className="text-base font-bold text-gray-900 mb-0.5">{title}</h3>
                <p className="text-xs text-gray-600">{description}</p>
            </div>
        </Link>
    );
}