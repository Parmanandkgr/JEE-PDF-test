"use client"

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TestTimerProps {
  durationMinutes: number;
  onTimeUpdate: (val: number) => void;
  onTimeUp: () => void;
}

export function TestTimer({ durationMinutes, onTimeUpdate, onTimeUp }: TestTimerProps) {
  const totalSeconds = durationMinutes * 60;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    onTimeUpdate(totalSeconds - timeLeft);
    if (timeLeft === 0) {
      onTimeUp();
    }
  }, [timeLeft, totalSeconds]); // Removed onTimeUpdate and onTimeUp to avoid hydration loops

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 300; // 5 mins

  return (
    <span className={cn(
      "text-[16px] font-bold tracking-tight",
      isLowTime ? "text-[#ee3224]" : "text-[#333]"
    )}>
      {formatTime(timeLeft)}
    </span>
  );
}