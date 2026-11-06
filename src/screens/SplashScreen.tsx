import { ArrowRight, Droplets } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const EMBLEM_IMAGE_SRC = '/src/assets/images/water_drop_emblem_1793968626259.jpg';

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const delayMs = prefersReduced ? 450 : 1150;
    const timer = window.setTimeout(() => {
      onFinish();
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFFFF] via-[#F4F9FD] to-[#E0F2FE] flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="max-w-sm w-full flex flex-col items-center space-y-6">
        <div className="w-32 h-32 rounded-3xl bg-white border border-sky-950/8 shadow-md shadow-sky-950/5 overflow-hidden flex items-center justify-center p-2">
          {!imageError ? (
            <img
              src={EMBLEM_IMAGE_SRC}
              alt="HydraBuddy crystal water droplet emblem"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white">
              <Droplets className="w-12 h-12" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0B1F3A]">
            HYDRABUDDY
          </h1>
          <p className="text-sm sm:text-base text-[#3B5575] text-balance">
            Smart daily water intake tracking, streaks, and gentle hydration
            reminders.
          </p>
        </div>

        <button
          type="button"
          onClick={onFinish}
          className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold inline-flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
