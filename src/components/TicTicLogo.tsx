import { useEffect, useState } from 'react';
import './TicTicLogo.css';

type TicTicLogoProps = {
  intro?: boolean;
  onIntroComplete?: () => void;
  className?: string;
};

export default function TicTicLogo({ intro = false, onIntroComplete, className = '' }: TicTicLogoProps) {
  const [finished, setFinished] = useState(!intro);

  useEffect(() => {
    if (!intro) {
      setFinished(true);
      return undefined;
    }

    setFinished(false);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const timer = window.setTimeout(() => {
      setFinished(true);
      onIntroComplete?.();
    }, reducedMotion ? 100 : 5000);

    return () => window.clearTimeout(timer);
  }, [intro, onIntroComplete]);

  return (
    <div
      className={['tictic-logo', intro ? 'tictic-logo--intro' : 'tictic-logo--header', finished ? 'tictic-logo--finished' : '', className].filter(Boolean).join(' ')}
      role="img"
      aria-label="TicTic bus ticket reservation"
    >
      <svg className="tictic-logo__ticket" viewBox="0 0 100 76" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="tictic-ticket-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#BBD9AD" />
            <stop offset="100%" stopColor="#FFD0B2" />
          </linearGradient>
        </defs>
        <path
          className="tictic-logo__ticket-outline"
          d="M15 12 H82 Q88 12 88 19 V27 C78 29 78 43 88 45 V57 Q88 64 81 64 H15 Q9 64 9 57 V46 C19 44 19 30 9 28 V19 Q9 12 15 12 Z"
          fill="url(#tictic-ticket-gradient)"
          stroke="#28312D"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M69 16 V60" stroke="#28312D" strokeWidth="1.7" strokeDasharray="3 4" opacity=".55" />
        <rect x="27" y="27" width="31" height="17" rx="4" fill="#28312D" />
        <rect x="31" y="30" width="10" height="10" rx="2" fill="#F7F4E9" />
        <rect x="44" y="30" width="10" height="10" rx="2" fill="#F7F4E9" />
        <path d="M24 44 V48 Q24 51 28 51 H58 Q62 51 62 47 V44 Z" fill="#28312D" />
        <rect x="28" y="44" width="30" height="4" rx="1" fill="#F7F4E9" />
        <circle cx="32" cy="52" r="4.5" fill="#28312D" />
        <circle cx="32" cy="52" r="1.8" fill="#F7F4E9" />
        <circle cx="54" cy="52" r="4.5" fill="#28312D" />
        <circle cx="54" cy="52" r="1.8" fill="#F7F4E9" />
        <circle cx="59" cy="46" r="1.5" fill="#FFD09D" />
      </svg>

      <span className="tictic-logo__word">
        TicTic
        <span className="tictic-logo__dot tictic-logo__dot--green" />
        <span className="tictic-logo__dot tictic-logo__dot--peach" />
      </span>
    </div>
  );
}
