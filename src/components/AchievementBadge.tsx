import { Award, CheckCircle2, Droplets, Flame, Lock, Sparkles, Target, Trophy } from 'lucide-react';
import { formatDisplayDate, getLocalDateKey } from '../constants/config.ts';
import type { AchievementStatus, AchievementType } from '../types/index.ts';

interface AchievementBadgeProps {
  achievement: AchievementStatus;
}

function renderAchievementIcon(type: AchievementType, unlocked: boolean) {
  const iconClass = unlocked ? 'w-6 h-6 text-white' : 'w-6 h-6 text-[#647D9B]';
  switch (type) {
    case 'first_glass':
      return <Droplets className={iconClass} aria-hidden="true" />;
    case 'hydration_starter':
      return <Sparkles className={iconClass} aria-hidden="true" />;
    case 'goal_crusher':
      return <Target className={iconClass} aria-hidden="true" />;
    case 'three_day_streak':
    case 'seven_day_streak':
      return <Flame className={iconClass} aria-hidden="true" />;
    case 'steady_sipper':
      return <Award className={iconClass} aria-hidden="true" />;
    case 'ten_liter_club':
    case 'overachiever':
      return <Trophy className={iconClass} aria-hidden="true" />;
  }
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const unlockedDateLabel = achievement.unlocked_at
    ? formatDisplayDate(
        getLocalDateKey(new Date(achievement.unlocked_at)),
        getLocalDateKey(new Date())
      )
    : null;

  return (
    <div
      className={`rounded-2xl p-5 border transition-colors flex flex-col justify-between gap-4 ${
        achievement.unlocked
          ? 'bg-white border-sky-500/25 shadow-xs'
          : 'bg-white/75 border-sky-950/8'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            achievement.unlocked
              ? achievement.category === 'streak'
                ? 'bg-emerald-600'
                : 'bg-[#0284C7]'
              : 'bg-sky-50 border border-sky-950/8'
          }`}
        >
          {renderAchievementIcon(achievement.type, achievement.unlocked)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold text-[#0B1F3A] truncate">
              {achievement.title}
            </h3>
            {achievement.unlocked ? (
              <CheckCircle2
                className="w-4 h-4 text-emerald-600 shrink-0"
                aria-label="Unlocked"
              />
            ) : (
              <Lock
                className="w-4 h-4 text-[#647D9B] shrink-0"
                aria-label="Locked"
              />
            )}
          </div>
          <p className="text-sm text-[#3B5575] mt-1 leading-relaxed">
            {achievement.description}
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#647D9B]">{achievement.targetLabel}</span>
          <span
            className={`font-semibold tabular-nums ${
              achievement.unlocked ? 'text-emerald-700' : 'text-[#3B5575]'
            }`}
          >
            {achievement.unlocked
              ? `Unlocked · ${unlockedDateLabel}`
              : `${achievement.progressPercent}%`}
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-sky-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              achievement.unlocked ? 'bg-emerald-600' : 'bg-[#0284C7]'
            }`}
            style={{ width: `${achievement.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
