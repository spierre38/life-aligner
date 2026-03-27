// app/roadmap/components/CompletionCelebration.tsx
'use client';

import { useEffect, useState } from 'react';

// SVG Icons
const TrophySvg = () => (
  <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.28 31.28 0 00-1.103-.232l1.702 7.545a.75.75 0 01-.387.832A4.981 4.981 0 0115 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.77-7.849a31.743 31.743 0 00-3.339-.254v11.505A2.75 2.75 0 0113.5 18h-7A2.75 2.75 0 019.25 15.486V4.509c-1.129.033-2.234.114-3.339.254l1.77 7.849a.75.75 0 01-.387.832A4.981 4.981 0 015 14a4.981 4.981 0 01-2.294-.556.75.75 0 01-.387-.832L4.02 5.067c-.37.072-.744.131-1.103.232a.75.75 0 01-.336-1.462 33.19 33.19 0 016.668-.829V2.75A.75.75 0 0110 2zM6.5 18h7a1.25 1.25 0 001.25-1.25v-.75h-9.5v.75c0 .69.56 1.25 1.25 1.25z" clipRule="evenodd" />
  </svg>
);
const SparkleSvg = () => (
  <svg className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const PartyPopperSvg = () => (
    <svg className="w-8 h-8 text-pink-500 inline-block align-middle ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.8 11.3 2 22l10.7-3.79" /><path d="M4 3h.01" /><path d="M22 8h.01" /><path d="M15 2h.01" /><path d="M22 20h.01" /><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
    </svg>
);

interface CompletionCelebrationProps {
  goalTitle: string;
  onClose: () => void;
  onNavigateToArchive: () => void;
}

export function CompletionCelebration({ goalTitle, onClose, onNavigateToArchive }: CompletionCelebrationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Auto-close after 4 seconds
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300); // Wait for fade out
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
              backgroundColor: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][Math.floor(Math.random() * 5)],
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Celebration card */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-12 max-w-lg mx-4 text-center animate-scale-in">
        {/* Trophy icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto shadow-2xl animate-bounce-gentle">
            <TrophySvg />
          </div>

          {/* Sparkle decorations */}
          <div className="absolute -top-4 -left-4 animate-pulse">
            <SparkleSvg />
          </div>
          <div className="absolute -top-4 -right-4 animate-pulse" style={{ animationDelay: '0.5s' }}>
            <SparkleSvg />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }}>
            <SparkleSvg />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-black text-gray-900 mb-3 flex items-center justify-center">
          Goal Complete! <PartyPopperSvg />
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          You finished
        </p>
        <p className="text-xl font-bold text-purple-600 mb-6">
          &ldquo;{goalTitle}&rdquo;
        </p>

        {/* Stats preview */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 mb-6 border border-purple-200">
          <p className="text-sm text-gray-700">
            This chapter has been added to your{' '}
            <span className="font-bold text-purple-600">Story Archive</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
                setShow(false);
                setTimeout(onClose, 300);
            }}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              setShow(false);
              setTimeout(() => {
                  onClose();
                  onNavigateToArchive();
              }, 300);
            }}
            className="flex-[2] px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all hover:scale-[1.02]"
          >
            View My Story →
          </button>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
