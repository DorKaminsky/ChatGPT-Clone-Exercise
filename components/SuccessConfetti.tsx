'use client';

import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';

interface SuccessConfettiProps {
  show: boolean;
  duration?: number;
}

export default function SuccessConfetti({ show, duration = 3000 }: SuccessConfettiProps) {
  const { width, height } = useWindowSize();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (show) {
      setIsActive(true);
      const timer = setTimeout(() => setIsActive(false), duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!isActive) return null;

  return (
    <Confetti
      width={width}
      height={height}
      recycle={false}
      numberOfPieces={200}
      gravity={0.3}
      colors={['#7c3aed', '#3b82f6', '#a78bfa', '#60a5fa', '#fbbf24']}
    />
  );
}
