import { useCallback, useEffect, useState, type ReactNode } from 'react';
import TicTicLogo from '@/components/TicTicLogo';

type IntroPhase = 'playing' | 'exiting' | 'done';

export default function IntroOverlay({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<IntroPhase>('playing');

  const dismiss = useCallback(() => setPhase((current) => (current === 'playing' ? 'exiting' : current)), []);

  useEffect(() => {
    if (phase !== 'exiting') return undefined;
    const timer = window.setTimeout(() => setPhase('done'), 600);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <>
      {phase !== 'done' && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#f8f4e9] transition-opacity duration-500 ${phase === 'exiting' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        >
          <TicTicLogo intro onIntroComplete={dismiss} />
        </div>
      )}
      {children}
    </>
  );
}
