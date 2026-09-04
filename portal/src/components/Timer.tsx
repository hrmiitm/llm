import { useEffect, useRef } from 'react';
import { formatTime } from '../lib/scoring';

interface Props {
  remainingSeconds: number;
  totalSeconds: number;
}

export function Timer({ remainingSeconds, totalSeconds }: Props) {
  const liveRef = useRef<HTMLSpanElement>(null);
  const pct = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const cls = pct < 0.1 ? 'danger' : pct < 0.25 ? 'warning' : '';

  // ARIA live announcement every minute and last 5 min
  useEffect(() => {
    if (!liveRef.current) return;
    if (remainingSeconds % 60 === 0 || remainingSeconds <= 300) {
      liveRef.current.textContent = `${formatTime(remainingSeconds)} remaining`;
    }
  }, [remainingSeconds]);

  return (
    <>
      <div className={`exam-timer ${cls}`} aria-hidden="true">
        ⏱ {formatTime(remainingSeconds)}
      </div>
      <span ref={liveRef} className="visually-hidden" aria-live="polite" aria-atomic="true" />
    </>
  );
}
