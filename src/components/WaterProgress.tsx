import { CheckCircle2, Droplets } from 'lucide-react';
import type { DailySummary } from '../types/index.ts';

interface WaterProgressProps {
  summary: DailySummary;
  onEditGoalClick?: () => void;
}

export function WaterProgress({
  summary,
  onEditGoalClick,
}: WaterProgressProps) {
  const size = 228;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.max(0, Math.min(100, summary.percentage));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  // Map percentage (0..100) to vertical wave position inside inner circle (radius - 10)
  const innerRadius = radius - 12;
  const innerDiameter = innerRadius * 2;
  const waterTopY =
    center + innerRadius - (clampedPct / 100) * innerDiameter;

  const ringColor = summary.goalAchieved ? '#059669' : '#0284C7';
  const trackColor = '#E0F2FE';

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
      {/* Circular SVG Progress + Animated Water Wave Vessel */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={`Daily hydration progress: ${summary.percentage}% (${summary.totalMl} ml of ${summary.goalMl} ml)`}
          className="overflow-visible"
        >
          <defs>
            <clipPath id="hydra-inner-circle">
              <circle cx={center} cy={center} r={innerRadius} />
            </clipPath>
            <linearGradient id="hydra-water-fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={summary.goalAchieved ? '#10B981' : '#06B6D4'}
                stopOpacity="0.28"
              />
              <stop
                offset="100%"
                stopColor={summary.goalAchieved ? '#059669' : '#0284C7'}
                stopOpacity="0.48"
              />
            </linearGradient>
          </defs>

          {/* Soft inner vessel backdrop */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="#F8FBFF"
            stroke="rgba(11, 31, 58, 0.06)"
            strokeWidth="1"
          />

          {/* Clipped rising water wave inside the vessel */}
          <g clipPath="url(#hydra-inner-circle)">
            {clampedPct > 0 && (
              <g
                style={{
                  transform: `translateY(${waterTopY}px)`,
                  transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <path
                  d={`M 0 0 Q ${innerRadius * 0.5} -9, ${innerRadius} 0 T ${innerRadius * 2} 0 T ${innerRadius * 3} 0 T ${innerRadius * 4} 0 L ${innerRadius * 4} ${innerDiameter + 30} L 0 ${innerDiameter + 30} Z`}
                  fill="url(#hydra-water-fill)"
                  className="animate-water-wave"
                />
              </g>
            )}
          </g>

          {/* Outer progress track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />

          {/* Outer progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
            style={{
              transition:
                'stroke-dashoffset 500ms cubic-bezier(0.16, 1, 0.3, 1), stroke 250ms ease',
            }}
          />
        </svg>

        {/* Centered Metric Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <div className="flex items-center gap-1 text-sky-700 mb-0.5">
            {summary.goalAchieved ? (
              <CheckCircle2
                className="w-5 h-5 text-emerald-600"
                aria-hidden="true"
              />
            ) : (
              <Droplets className="w-5 h-5 text-sky-600" aria-hidden="true" />
            )}
          </div>
          <span className="font-display text-4xl font-extrabold tracking-tight text-[#0B1F3A] tabular-nums">
            {summary.percentage}%
          </span>
          <span className="text-xs font-medium text-[#3B5575] mt-1 tabular-nums">
            {summary.totalMl.toLocaleString()} / {summary.goalMl.toLocaleString()}{' '}
            ml
          </span>
        </div>
      </div>

      {/* Right Summary Breakdown */}
      <div className="flex-1 w-full space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#F4F9FD] p-3.5 border border-sky-950/6">
            <p className="text-xs font-medium text-[#647D9B]">Daily Goal</p>
            <p className="font-display text-lg sm:text-xl font-bold text-[#0B1F3A] mt-1 tabular-nums">
              {summary.goalMl.toLocaleString()} ml
            </p>
          </div>

          <div className="rounded-2xl bg-[#F4F9FD] p-3.5 border border-sky-950/6">
            <p className="text-xs font-medium text-[#647D9B]">Consumed</p>
            <p className="font-display text-lg sm:text-xl font-bold text-sky-700 mt-1 tabular-nums">
              {summary.totalMl.toLocaleString()} ml
            </p>
          </div>

          <div className="rounded-2xl bg-[#F4F9FD] p-3.5 border border-sky-950/6">
            <p className="text-xs font-medium text-[#647D9B]">Remaining</p>
            <p
              className={`font-display text-lg sm:text-xl font-bold mt-1 tabular-nums ${
                summary.goalAchieved ? 'text-emerald-700' : 'text-[#0B1F3A]'
              }`}
            >
              {summary.remainingMl.toLocaleString()} ml
            </p>
          </div>
        </div>

        {/* Status & Inline Goal Adjust Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-sm text-[#3B5575]">
            {summary.goalAchieved ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                Goal achieved
                {summary.surplusMl > 0
                  ? ` (+${summary.surplusMl.toLocaleString()} ml extra)`
                  : ''}
              </span>
            ) : (
              <span className="tabular-nums">
                {summary.entryCount === 0
                  ? 'No entries logged yet today'
                  : `${summary.entryCount} ${
                      summary.entryCount === 1 ? 'entry' : 'entries'
                    } logged today`}
              </span>
            )}
          </div>

          {onEditGoalClick && (
            <button
              type="button"
              onClick={onEditGoalClick}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              Adjust Daily Goal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
