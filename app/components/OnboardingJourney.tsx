'use client';

import { useState, useEffect, JSX } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Wordmark from '@/app/components/Wordmark';

// ── Animation CSS ─────────────────────────────────────────────
const ANIM_STYLES = `
  @keyframes blurReveal{
    from{filter:blur(14px);opacity:0}to{filter:blur(0);opacity:1}
  }
  @keyframes slideUp{
    from{transform:translateY(22px);opacity:0}to{transform:translateY(0);opacity:1}
  }
  @keyframes floatPlane{
    0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-14px) rotate(-4deg)}
  }
  @keyframes flyAcross{
    0%  {transform:translate(-200px,-50%) rotate(-3deg);opacity:0}
    8%  {opacity:1}
    92% {opacity:1}
    100%{transform:translate(calc(100vw + 200px),-50%) rotate(-3deg);opacity:0}
  }
  @keyframes twinkle{
    0%,100%{opacity:.12}50%{opacity:.55}
  }
  @keyframes pageFlipIn{
    from{transform:perspective(1200px) rotateY(-12deg) translateX(-16px);opacity:0}
    to  {transform:perspective(1200px) rotateY(0deg)   translateX(0);    opacity:1}
  }
  @keyframes fadeIn{
    from{opacity:0;transform:translateY(8px)}
    to  {opacity:1;transform:translateY(0)}
  }
  .blur-reveal{animation:blurReveal .85s cubic-bezier(.16,1,.3,1) both}
  .slide-up   {animation:slideUp .65s cubic-bezier(.16,1,.3,1) both}
  .float-plane{animation:floatPlane 5s ease-in-out infinite}
  .fly-across {animation:flyAcross 1.5s cubic-bezier(.22,1,.36,1) both}
  .page-flip  {animation:pageFlipIn 480ms cubic-bezier(.16,1,.3,1) both}
  .fade-in    {animation:fadeIn 350ms cubic-bezier(.16,1,.3,1) both}
  .opt-item{
    display:block;width:100%;text-align:left;
    padding:12px 16px;border-radius:12px;
    border:1.5px solid #e5e7eb;
    background:white;color:#374151;
    font-size:15px;font-weight:500;
    transition:all 180ms ease;cursor:pointer;
  }
  .opt-item:hover{
    border-color:#111827;background:#f9fafb;color:#111827;
    transform:translateX(4px);
  }
  @media(prefers-reduced-motion:reduce){
    .blur-reveal,.slide-up,.float-plane,.fly-across,.page-flip,.fade-in{animation:fadeIn 300ms ease both}
  }
`;

// ── Airplane SVG (purple-tinted, inspired by reference) ───────
const PlaneSVG = ({ width = 120, className = '' }: { width?: number; className?: string }) => (
    <svg width={width} viewBox="0 0 444 189" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M407.982 82.842V107.594H25.345C23.652 66.076 38.109 32.627 48.872 13.756C54.7 3.552 66.476-1.702 77.959.791C86.002 2.539 92.804 7.887 96.418 15.288L110.062 43.23C123.092 69.931 156.087 70.131 164.397 69.29C241.137 61.595 297.047 63.408 329.296 66.05V78.252H366.772L407.904 82.827Z" fill="#c4b5fd" />
        <path d="M407.982 107.595V140.151C406.741 140.604 405.461 141.005 404.141 141.324C307.887 164.825 97.204 141.632 25.344 107.595H407.982Z" fill="#a78bfa" fillOpacity=".75" />
        <path d="M337.403 1.989L245.079 6.605C236.462 7.035 229.694 14.149 229.694 22.78V82.843H328.729L353.155 24.41C357.75 13.417 349.302 1.392 337.403 1.989Z" fill="#7c3aed" fillOpacity=".6" />
        <path d="M426.787 103.928V107.595H407.983V82.843C418.693 84.055 426.787 93.138 426.787 103.928Z" fill="#6d28d9" />
        <path d="M426.787 107.595C426.787 125.454 419.386 135.857 407.983 140.151V107.595H426.787Z" fill="#5b21b6" />
        <circle cx="178" cy="91" r="7" fill="#e0d4ff" fillOpacity=".45" />
        <circle cx="199" cy="91" r="7" fill="#e0d4ff" fillOpacity=".45" />
        <circle cx="220" cy="91" r="7" fill="#e0d4ff" fillOpacity=".45" />
        <circle cx="102.5" cy="150" r="13" fill="#4c1d95" />
        <circle cx="330" cy="165" r="13" fill="#4c1d95" />
        <circle cx="352" cy="165" r="13" fill="#4c1d95" />
    </svg>
);

// ── Shared dark stage ─────────────────────────────────────────
function DarkStage({ children, fadeOut, accent }: {
    children: React.ReactNode; fadeOut: boolean; accent?: string;
}) {
    return (
        <div
            className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
            style={{
                background: accent
                    ? `radial-gradient(ellipse at 25% 65%, ${accent}22 0%, #080818 55%, #000 100%)`
                    : 'radial-gradient(ellipse at 20% 40%, #1e1b4b 0%, #080818 52%, #000 100%)'
            }}
        >
            <style dangerouslySetInnerHTML={{ __html: ANIM_STYLES }} />
            {/* Star field */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {[...Array(80)].map((_, i) => (
                    <circle key={i}
                        cx={`${(i * 137.508) % 100}%`} cy={`${(i * 97.325) % 100}%`}
                        r={i % 7 === 0 ? 2 : i % 3 === 0 ? 1.2 : 0.7} fill="white"
                        style={{ opacity: .08 + (i % 5) * .12, animation: `twinkle ${3 + i % 4}s ${i * .25}s ease-in-out infinite` }}
                    />
                ))}
            </svg>
            <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(139,92,246,.07), transparent)' }} />
            {children}
        </div>
    );
}

// ── Light stage for post-welcome slides ───────────────────────
function LightStage({ children, planeFlying }: { children: React.ReactNode; planeFlying: boolean }) {
    return (
        <div className="fixed inset-0 z-50 bg-[#FAFAF7] overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: ANIM_STYLES }} />
            <div className="absolute top-5 left-6 z-10">
                <Wordmark size="sm" />
            </div>
            {planeFlying && (
                <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
                    <div className="absolute" style={{ top: '43%' }}>
                        <div className="fly-across"><PlaneSVG width={110} /></div>
                    </div>
                </div>
            )}
            {children}
        </div>
    );
}

interface OnboardingJourneyProps {
    onComplete: () => void;
    userName?: string;
    startStep?: Step;
}

type Step = 'welcome' | 'thank-tim' | 'map' | 'trait' | 'ready';

// SVG icon components for each trait
const TraitIcon = ({ trait, size = 48, color = 'currentColor' }: { trait: string; size?: number; color?: string }) => {
    const icons: Record<string, JSX.Element> = {
        Authenticity: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
        ),
        Compassion: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
        ),
        Courage: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
        ),
        Creativity: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r="2.5" />
                <circle cx="19" cy="11.5" r="2.5" />
                <circle cx="17" cy="18.5" r="2.5" />
                <circle cx="8.5" cy="18.5" r="2.5" />
                <circle cx="5" cy="11.5" r="2.5" />
                <path d="M12 12c-1.333-1.333-3.5-1.333-5 0-1.5 1.333-1.833 3.5-.5 5 1.333 1.5 3.5 1.833 5 .5 1.5-1.333 1.833-3.5.5-5z" />
            </svg>
        ),
        Discipline: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        ),
        Gratitude: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
            </svg>
        ),
        Humility: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c0-4-3-6-3-10a5 5 0 0110 0c0 4-3 6-3 10" />
                <path d="M9 22h6" />
                <path d="M12 2v2" />
                <path d="M4.93 4.93l1.41 1.41" />
                <path d="M17.66 6.34l1.41-1.41" />
            </svg>
        ),
        Integrity: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        Resilience: (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 010 8h-1" />
                <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
        )
    };
    return icons[trait] || null;
};

// The 9 traits — first 5 have demographic questions, last 4 are message-only
const JOURNEY_STOPS = [
    {
        num: 1,
        trait: 'Authenticity',
        desc: 'Be real with yourself and others',
        color: '#F59E0B',
        question: 'To help our community grow, what age range are you in?',
        field: 'age_range',
        options: [
            { value: '18_24', label: '18-24' },
            { value: '25_34', label: '25-34' },
            { value: '35_44', label: '35-44' },
            { value: '45_54', label: '45-54' },
            { value: '55_64', label: '55-64' },
            { value: '65_plus', label: '65+' }
        ]
    },
    {
        num: 2,
        trait: 'Compassion',
        desc: 'Lead with empathy and kindness',
        color: '#EC4899',
        question: 'What best describes you?',
        field: 'gender',
        options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'non_binary', label: 'Non-binary' },
            { value: 'other', label: 'Other' }
        ]
    },
    {
        num: 3,
        trait: 'Courage',
        desc: 'Face challenges head-on',
        color: '#EF4444',
        question: 'What\u2019s your current path?',
        field: 'occupation',
        options: [
            { value: 'student', label: 'Student' },
            { value: 'employed_full_time', label: 'Working Full-time' },
            { value: 'employed_part_time', label: 'Working Part-time' },
            { value: 'self_employed', label: 'Self-employed' },
            { value: 'retired', label: 'Retired' },
            { value: 'other', label: 'Other' }
        ]
    },
    {
        num: 4,
        trait: 'Creativity',
        desc: 'Express yourself and think differently',
        color: '#8B5CF6',
        question: 'How would you describe your background?',
        field: 'race_ethnicity',
        options: [
            { value: 'asian', label: 'Asian' },
            { value: 'black_african_american', label: 'Black/African American' },
            { value: 'hispanic_latino', label: 'Hispanic/Latino' },
            { value: 'white', label: 'White' },
            { value: 'multiracial', label: 'Multiracial' },
            { value: 'other', label: 'Other' }
        ]
    },
    {
        num: 5,
        trait: 'Discipline',
        desc: 'Stay focused on what matters',
        color: '#10B981',
        question: 'What\u2019s your relationship status?',
        field: 'marital_status',
        options: [
            { value: 'single', label: 'Single' },
            { value: 'married', label: 'Married' },
            { value: 'domestic_partnership', label: 'In a relationship' },
            { value: 'divorced', label: 'Divorced' },
            { value: 'widowed', label: 'Widowed' }
        ]
    },
    {
        num: 6,
        trait: 'Gratitude',
        desc: 'Appreciate what you have',
        color: '#F97316',
        message: 'Thank you for sharing! Every response helps us build a better community.'
    },
    {
        num: 7,
        trait: 'Humility',
        desc: 'Stay grounded, keep growing',
        color: '#14B8A6',
        message: 'Remember: contentment comes from within, not from external validation.'
    },
    {
        num: 8,
        trait: 'Integrity',
        desc: 'Do the right thing, always',
        color: '#3B82F6',
        message: 'Your privacy matters. We never share individual responses.'
    },
    {
        num: 9,
        trait: 'Resilience',
        desc: 'Bounce back stronger',
        color: '#6366F1',
        message: 'You\u2019re ready to start your journey to contentment!'
    }
];

// Road map stop positions for the SVG
const ROAD_STOPS = [
    { x: 50, y: 450, num: 'START' },
    { x: 170, y: 370, num: 1 },
    { x: 260, y: 300, num: 2 },
    { x: 350, y: 250, num: 3 },
    { x: 440, y: 230, num: 4 },
    { x: 520, y: 200, num: 5 },
    { x: 600, y: 175, num: 6 },
    { x: 670, y: 140, num: 7 },
    { x: 720, y: 90, num: 8 },
    { x: 750, y: 50, num: 9 }
];

export default function OnboardingJourney({ onComplete, userName, startStep = 'welcome' }: OnboardingJourneyProps) {
    const [currentStep, setCurrentStep] = useState<Step>(startStep);
    const [traitIndex, setTraitIndex] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);
    const [demographics, setDemographics] = useState<any>({});
    const [planeFlying, setPlaneFlying] = useState(false);

    useEffect(() => {
        if (currentStep === 'welcome') {
            const t = setTimeout(() => fadeAndAdvance('thank-tim'), 2800);
            return () => clearTimeout(t);
        }
    }, [currentStep]);

    const fadeAndAdvance = (nextStep: Step) => {
        setFadeOut(true);
        setPlaneFlying(true);
        setTimeout(() => { setCurrentStep(nextStep); setFadeOut(false); }, 500);
        setTimeout(() => setPlaneFlying(false), 1700);
    };

    // Reusable skip button
    const SkipBtn = () => (
        <button onClick={handleSkip} className="absolute top-5 right-5 z-10 px-5 py-2 rounded-xl text-xs font-bold text-gray-600 border border-gray-300 bg-white/90 hover:bg-white hover:text-gray-900 transition-all backdrop-blur-sm">
            Skip →
        </button>
    );

    // Airplane overlay during transitions
    const PlaneOverlay = () => !planeFlying ? null : (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
            <div className="absolute" style={{ top: '43%' }}>
                <div className="fly-across"><PlaneSVG width={110} /></div>
            </div>
        </div>
    );

    const handleSkip = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({
                ...demographics,
                welcome_seen: true
            }).eq('id', user.id);
        }
        onComplete();
    };

    const handleDemographicAnswer = (field: string, value: string) => {
        setDemographics({ ...demographics, [field]: value });
        advanceToNextTrait();
    };

    const advanceToNextTrait = () => {
        const nextIndex = traitIndex + 1;
        if (nextIndex < JOURNEY_STOPS.length) {
            setTraitIndex(nextIndex);
            setFadeOut(true);
            setTimeout(() => setFadeOut(false), 300);
        } else {
            saveDemographicsAndComplete();
        }
    };

    const saveDemographicsAndComplete = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({
                ...demographics,
                welcome_seen: true
            }).eq('id', user.id);
        }
        fadeAndAdvance('ready');
        setTimeout(onComplete, 2500);
    };

    // ==========================================
    // SLIDE: WELCOME
    // ==========================================
    if (currentStep === 'welcome') return (
        <DarkStage fadeOut={fadeOut}>
            <PlaneOverlay />
            {/* Floating plane decoration */}
            <div className="absolute left-[6%] top-1/2 -translate-y-1/2 opacity-25 pointer-events-none float-plane">
                <PlaneSVG width={170} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 gap-4">
                <div className="blur-reveal" style={{ animationDelay: '0.1s' }}>
                    <p className="text-xs font-bold tracking-[0.4em] uppercase text-purple-400 mb-3">Welcome to</p>
                    <h1 className="font-bold text-white leading-none"
                        style={{ fontSize: 'clamp(2.5rem,7vw,5rem)', textShadow: '0 0 80px rgba(139,92,246,.8)' }}>
                        Tim Collins<br/>Framework
                    </h1>
                </div>
                <p className="text-slate-400 text-lg slide-up" style={{ animationDelay: '0.4s' }}>
                    {userName ? `Welcome back, ${userName}` : 'Your journey to contentment begins'}
                </p>
                <div className="slide-up" style={{ animationDelay: '0.65s' }}>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-60 mx-auto" />
                </div>
            </div>
            <SkipBtn />
        </DarkStage>
    );

    // ==========================================
    // SLIDE: THANK TIM
    // ==========================================
    if (currentStep === 'thank-tim') return (
        <LightStage planeFlying={planeFlying}>
            <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl page-flip">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                            <div className="relative md:w-56 h-48 md:h-auto flex-shrink-0 bg-gray-100">
                                <Image src="/timmyC.webp" alt="Tim Collins" fill className="object-cover" priority />
                            </div>
                            <div className="p-8 md:p-10 flex flex-col justify-center gap-5">
                                <span className="self-start px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase text-gray-500 border border-gray-200">Your Guide</span>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Tim Collins</h2>
                                    <p className="text-sm text-gray-500">Founder EBSCO Publishing · TEDx Speaker</p>
                                </div>
                                <blockquote className="text-base text-gray-600 leading-relaxed border-l-2 border-gray-200 pl-4 italic">
                                    Built a <span className="text-gray-900 font-semibold not-italic">$2B company</span> using 9 core principles.
                                    Now he&apos;s sharing the complete roadmap — with you.
                                </blockquote>
                                <button onClick={() => fadeAndAdvance('map')}
                                    className="self-start px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition flex items-center gap-2">
                                    See the Journey Map
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7l5 5-5 5" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <SkipBtn />
        </LightStage>
    );

    // ==========================================
    // SLIDE: JOURNEY MAP
    // ==========================================
    if (currentStep === 'map') {
        return (
            <LightStage planeFlying={planeFlying}>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pt-20 overflow-y-auto">
                    <div className="w-full max-w-2xl page-flip">
                        <div className="text-center mb-8">
                            <p className="text-xs font-bold tracking-[0.3em] uppercase text-gray-400 mb-2">Your Path Forward</p>
                            <h2 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Journey to Contentment</h2>
                            <p className="text-gray-500 text-sm">9 principles. One transformed life.</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {JOURNEY_STOPS.map((stop, i) => (
                                <div key={stop.num}
                                    className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col items-center text-center gap-2 fade-in"
                                    style={{ animationDelay: `${i * 40}ms` }}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ backgroundColor: stop.color }}>{stop.num}</div>
                                    <p className="text-sm font-semibold text-gray-900">{stop.trait}</p>
                                    <p className="text-xs text-gray-400 leading-tight">{stop.desc}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => { setTraitIndex(0); fadeAndAdvance('trait'); }}
                            className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold text-base hover:bg-gray-800 transition flex items-center justify-center gap-2">
                            Begin Your Journey
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                    </div>
                </div>
                <SkipBtn />
            </LightStage>
        );
    }


    // ==========================================
    // SLIDES: TRAIT STOPS
    // ==========================================
    if (currentStep === 'trait') {
        const stop = JOURNEY_STOPS[traitIndex];
        const hasQuestion = !!(stop.question && stop.options);
        return (
            <LightStage planeFlying={planeFlying}>
                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200">
                    <div className="h-full bg-gray-900 transition-all duration-700" style={{ width: `${(stop.num / 9) * 100}%` }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-6 pt-16">
                    <div key={traitIndex} className="w-full max-w-md page-flip">
                        <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4 text-center">Stop {stop.num} of 9</p>
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="h-1" style={{ backgroundColor: stop.color }} />
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                        style={{ backgroundColor: `${stop.color}18`, color: stop.color }}>
                                        <TraitIcon trait={stop.trait} size={22} color={stop.color} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{stop.trait}</h2>
                                        <p className="text-sm text-gray-400">{stop.desc}</p>
                                    </div>
                                </div>
                                {hasQuestion ? (
                                    <>
                                        <p className="text-sm font-medium text-gray-700 mb-4">{stop.question}</p>
                                        <div className="space-y-2 mb-4">
                                            {stop.options!.map(opt => (
                                                <button key={opt.value}
                                                    onClick={() => handleDemographicAnswer(stop.field!, opt.value)}
                                                    className="opt-item">{opt.label}</button>
                                            ))}
                                        </div>
                                        <button onClick={advanceToNextTrait}
                                            className="text-gray-400 text-xs hover:text-gray-600 transition-colors">Prefer not to say →</button>
                                    </>
                                ) : (
                                    <div className="text-center py-2">
                                        <blockquote className="text-gray-600 italic leading-relaxed mb-6"
                                            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: '1.15rem' }}>
                                            &ldquo;{stop.message}&rdquo;
                                        </blockquote>
                                        <button onClick={advanceToNextTrait}
                                            className="px-8 py-3 rounded-xl font-semibold text-white text-sm hover:opacity-90 transition"
                                            style={{ backgroundColor: stop.color }}>Continue →</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <SkipBtn />
            </LightStage>
        );
    }

    if (currentStep === 'ready') return (
        <LightStage planeFlying={planeFlying}>
            <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="text-center page-flip">
                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-8">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-5xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>You&apos;re all set.</h2>
                    <p className="text-gray-500 text-lg">Let&apos;s begin your journey to contentment.</p>
                </div>
            </div>
        </LightStage>
    );

    return null;
}
