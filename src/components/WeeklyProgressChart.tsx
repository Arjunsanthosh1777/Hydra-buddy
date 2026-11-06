import { CheckCircle2, Droplets } from 'lucide-react';
import { useState } from 'react';
import type { WeeklyDayPoint } from '../types/index.ts';

interface WeeklyProgressChartProps {
  weeklySeries: WeeklyDayPoint[];
  dailyGoalMl: number;
}

export function WeeklyProgressChart({
  weeklySeries,
  dailyGoalMl,
}: WeeklyProgressChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(
    Math.max(0, weeklySeries.length - 1)
  );

  const selectedDay =
    weeklySeries[selectedIndex] ?? weeklySeries[weeklySeries.length - 1];

  const maxDataMl = Math.max(
    dailyGoalMl,
    ...weeklySeries.map((d) => d.totalMl),
    500
  );
  // Add 12% headroom above max value so bars and goal line breathe nicely
  const scaleMaxMl = Math.ceil((maxDataMl * 1.12) / 100) * 100;
  const goalLineBottomPct = Math.min(
    96,
    Math.round((dailyGoalMl / scaleMaxMl) * 100)
  );

  const hasAnyWeeklyIntake = weeklySeries.some((d) => d.totalMl > 0);

  return (
    <div className="rounded-3xl bg-white border border-sky-950/8 p-5 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
            7-Day Hydration Trend
          </h2>
          <p className="text-xs text-[#647D9B] mt-0.5 tabular-nums">
            Daily target reference line at {dailyGoalMl.toLocaleString()} ml ·
            Select any day to inspect
          </p>
        </div>

        {selectedDay && (
          <div className="rounded-2xl bg-[#F4F9FD] border border-sky-950/6 px-4 py-2.5 flex items-center gap-3">
            <div>
              <p className="text-xs font-medium text-[#647D9B]">
                {selectedDay.dayFull}
              </p>
              <p className="font-display text-base font-bold text-[#0B1F3A] tabular-nums">
                {selectedDay.totalMl.toLocaleString()} ml{' '}
                <span className="text-xs font-medium text-[#3B5575]">
                  ({selectedDay.percentage}%)
                </span>
              </p>
            </div>
            {selectedDay.goalMet && (
              <CheckCircle2
                className="w-5 h-5 text-emerald-600 shrink-0"
                aria-label="Daily goal achieved"
              />
            )}
          </div>
        )}
      </div>

      {!hasAnyWeeklyIntake ? (
        <div className="py-12 px-4 rounded-2xl bg-[#F4F9FD] border border-sky-950/6 flex flex-col items-center justify-center text-center">
          <div className="w-11 h-11 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
            <Droplets className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="font-display text-sm font-bold text-[#0B1F3A]">
            No weekly intake recorded yet
          </p>
          <p className="text-xs text-[#647D9B] mt-1 max-w-sm">
            Log your first glass of water to populate your 7-day hydration chart
            and daily goal progress.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Interactive Bar Chart Canvas */}
          <div className="relative h-56 pt-4 pb-1 px-2 sm:px-4">
            {/* Dashed Daily Goal Threshold Line */}
            <div
              className="absolute left-2 right-2 border-t border-dashed border-sky-600/55 pointer-events-none z-10 flex justify-end"
              style={{ bottom: `${goalLineBottomPct}%` }}
            >
              <span className="text-[11px] font-medium text-sky-700 bg-white/90 px-1.5 -mt-4 tabular-nums">
                Goal {dailyGoalMl.toLocaleString()} ml
              </span>
            </div>

            {/* 7 Interactive Day Columns */}
            <div className="relative z-20 h-full grid grid-cols-7 gap-2 sm:gap-4 items-end">
              {weeklySeries.map((day, idx) => {
                const barHeightPct =
                  day.totalMl > 0
                    ? Math.max(6, Math.round((day.totalMl / scaleMaxMl) * 100))
                    : 0;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    aria-label={`${day.dayFull}: ${day.totalMl} ml (${day.percentage}% of goal)`}
                    className="h-full flex flex-col items-center justify-end group cursor-pointer focus:outline-none"
                  >
                    <span
                      className={`text-[11px] font-medium mb-1.5 tabular-nums transition-opacity ${
                        isSelected
                          ? 'text-[#0B1F3A] opacity-100 font-semibold'
                          : 'text-[#647D9B] opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {day.totalMl > 0
                        ? `${(day.totalMl / 1000).toFixed(1)}L`
                        : '0'}
                    </span>

                    <div className="w-full max-w-[40px] h-40 bg-sky-50/90 rounded-xl flex items-end overflow-hidden p-1 border border-sky-950/6">
                      <div
                        className={`w-full rounded-lg transition-all duration-300 ${
                          day.goalMet
                            ? isSelected
                              ? 'bg-emerald-600'
                              : 'bg-emerald-500/85 group-hover:bg-emerald-600'
                            : isSelected
                              ? 'bg-[#0284C7]'
                              : 'bg-sky-400/85 group-hover:bg-[#0284C7]'
                        }`}
                        style={{ height: `${barHeightPct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Labels Row */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 px-2 sm:px-4">
            {weeklySeries.map((day, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${day.date}-label`}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`min-h-[36px] rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B1F3A] text-white font-semibold'
                      : 'text-[#647D9B] hover:text-[#0B1F3A]'
                  }`}
                >
                  {day.dayShort}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
