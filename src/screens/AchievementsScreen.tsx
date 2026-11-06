import { Award, Flame, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AchievementBadge } from '../components/AchievementBadge.tsx';
import type { HydrationSnapshot } from '../types/index.ts';

interface AchievementsScreenProps {
  snapshot: HydrationSnapshot;
}

type BadgeFilter = 'all' | 'unlocked' | 'locked';

export function AchievementsScreen({ snapshot }: AchievementsScreenProps) {
  const [filter, setFilter] = useState<BadgeFilter>('all');

  const unlockedCount = snapshot.achievements.filter((a) => a.unlocked).length;
  const totalCount = snapshot.achievements.length;

  const filteredAchievements = useMemo(() => {
    if (filter === 'unlocked') {
      return snapshot.achievements.filter((a) => a.unlocked);
    }
    if (filter === 'locked') {
      return snapshot.achievements.filter((a) => !a.unlocked);
    }
    return snapshot.achievements;
  }, [snapshot.achievements, filter]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-[#647D9B] tabular-nums">
            <span>
              {unlockedCount} of {totalCount} achievements unlocked
            </span>
            <span aria-hidden="true"> · </span>
            <span>
              {snapshot.statistics.currentStreak}-day current streak
            </span>
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1F3A]">
            Streaks &amp; Achievements
          </h1>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-sky-950/8 self-start sm:self-auto">
          {(
            [
              { id: 'all', label: `All (${totalCount})` },
              { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
              {
                id: 'locked',
                label: `In Progress (${totalCount - unlockedCount})`,
              },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[38px] px-3.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#0284C7] text-white'
                    : 'text-[#3B5575] hover:text-[#0B1F3A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Streak & Milestone Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-sky-950/8 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#647D9B]">Current Streak</p>
            <p className="font-display text-2xl font-extrabold text-[#0B1F3A] tabular-nums">
              {snapshot.statistics.currentStreak}{' '}
              {snapshot.statistics.currentStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-sky-950/8 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#647D9B]">Longest Streak</p>
            <p className="font-display text-2xl font-extrabold text-[#0B1F3A] tabular-nums">
              {snapshot.statistics.longestStreak}{' '}
              {snapshot.statistics.longestStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-sky-950/8 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#647D9B]">
              Total Water Logged
            </p>
            <p className="font-display text-2xl font-extrabold text-[#0B1F3A] tabular-nums">
              {(snapshot.statistics.lifetimeTotalMl / 1000).toFixed(2)} L
            </p>
          </div>
        </div>
      </div>

      {/* Achievement Badges Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="rounded-3xl bg-white border border-sky-950/8 p-10 text-center">
          <p className="font-display text-base font-bold text-[#0B1F3A]">
            {filter === 'unlocked'
              ? 'No badges unlocked yet'
              : 'Every badge has been unlocked'}
          </p>
          <p className="text-xs text-[#647D9B] mt-1">
            {filter === 'unlocked'
              ? 'Log your first glass of water to unlock the First Glass achievement.'
              : 'Incredible consistency across your daily hydration targets.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.type}
              achievement={achievement}
            />
          ))}
        </div>
      )}
    </div>
  );
}
