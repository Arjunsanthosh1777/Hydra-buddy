import type { ReactNode } from 'react';

interface StatisticsCardProps {
  label: string;
  value: string;
  detail: string;
  icon?: ReactNode;
  accentTone?: 'blue' | 'mint' | 'navy';
}

export function StatisticsCard({
  label,
  value,
  detail,
  icon,
  accentTone = 'blue',
}: StatisticsCardProps) {
  const valueToneClass =
    accentTone === 'mint'
      ? 'text-emerald-700'
      : accentTone === 'navy'
        ? 'text-[#0B1F3A]'
        : 'text-sky-700';

  return (
    <div className="rounded-2xl bg-white border border-sky-950/8 p-5 shadow-xs flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#647D9B]">{label}</span>
        {icon ? (
          <span className="text-sky-600 shrink-0" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>

      <div>
        <p
          className={`font-display text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${valueToneClass}`}
        >
          {value}
        </p>
        <p className="text-xs text-[#647D9B] mt-1 tabular-nums">{detail}</p>
      </div>
    </div>
  );
}
