import { Calendar, CheckCircle2, Droplets, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { IntakeCard } from '../components/IntakeCard.tsx';
import {
  addDaysToDateKey,
  formatDisplayDate,
  getLocalDateKey,
} from '../constants/config.ts';
import type { HydrationSnapshot } from '../types/index.ts';

interface HistoryScreenProps {
  snapshot: HydrationSnapshot;
  mutating: boolean;
  onDeleteEntry: (entryId: number) => Promise<boolean>;
  onOpenAddModal: () => void;
}

type HistoryRangeFilter = 'all' | '7d' | '30d';

export function HistoryScreen({
  snapshot,
  mutating,
  onDeleteEntry,
  onOpenAddModal,
}: HistoryScreenProps) {
  const [rangeFilter, setRangeFilter] = useState<HistoryRangeFilter>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  const todayKey = getLocalDateKey(new Date());

  const filteredGroups = useMemo(() => {
    let groups = snapshot.historyGroups;

    if (selectedDateFilter) {
      groups = groups.filter((g) => g.date === selectedDateFilter);
    } else if (rangeFilter === '7d') {
      const cutoff = addDaysToDateKey(todayKey, -6);
      groups = groups.filter((g) => g.date >= cutoff);
    } else if (rangeFilter === '30d') {
      const cutoff = addDaysToDateKey(todayKey, -29);
      groups = groups.filter((g) => g.date >= cutoff);
    }

    return groups;
  }, [snapshot.historyGroups, rangeFilter, selectedDateFilter, todayKey]);

  const totalFilteredMl = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.totalMl, 0),
    [filteredGroups]
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-[#647D9B] tabular-nums">
            <span>{snapshot.historyGroups.length} days recorded</span>
            <span aria-hidden="true"> · </span>
            <span>
              {snapshot.statistics.lifetimeTotalMl.toLocaleString()} ml total
              logged
            </span>
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B1F3A]">
            Hydration History
          </h1>
        </div>

        {/* Interactive Range Segmented Control & Date Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-sky-950/8">
            {(
              [
                { id: 'all', label: 'All Days' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
              ] as const
            ).map((tab) => {
              const active = !selectedDateFilter && rangeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedDateFilter('');
                    setRangeFilter(tab.id);
                  }}
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

          <div className="flex items-center gap-1.5">
            <label htmlFor="history-date-picker" className="sr-only">
              Filter by specific date
            </label>
            <input
              id="history-date-picker"
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="min-h-[46px] px-3 rounded-2xl bg-white border border-sky-950/10 text-xs font-medium text-[#0B1F3A] tabular-nums focus:outline-none focus:border-sky-600"
            />
            {selectedDateFilter && (
              <button
                type="button"
                onClick={() => setSelectedDateFilter('')}
                className="min-h-[46px] px-3 rounded-2xl bg-white border border-sky-950/10 text-xs font-semibold text-sky-700 hover:bg-sky-50 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State when no records match */}
      {filteredGroups.length === 0 ? (
        <div className="rounded-3xl bg-white border border-sky-950/8 p-10 sm:p-14 text-center flex flex-col items-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
            {selectedDateFilter ? (
              <Calendar className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Droplets className="w-6 h-6" aria-hidden="true" />
            )}
          </div>
          <h2 className="font-display text-lg font-bold text-[#0B1F3A]">
            {selectedDateFilter
              ? `No entries recorded on ${formatDisplayDate(
                  selectedDateFilter,
                  todayKey
                )}`
              : 'No hydration history recorded yet'}
          </h2>
          <p className="text-sm text-[#647D9B] mt-1.5 max-w-md">
            {selectedDateFilter
              ? 'Select another date or clear the date filter to view all recorded days.'
              : 'Every water intake entry you record is stored in SQLite and organized chronologically by day.'}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {selectedDateFilter ? (
              <button
                type="button"
                onClick={() => setSelectedDateFilter('')}
                className="min-h-[46px] px-5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold cursor-pointer"
              >
                Show All History
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="min-h-[46px] px-5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Log First Water Entry</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.length > 1 && (
            <p className="text-xs font-medium text-[#647D9B] tabular-nums">
              Showing {filteredGroups.length} days ·{' '}
              {totalFilteredMl.toLocaleString()} ml total
            </p>
          )}

          {filteredGroups.map((group) => (
            <section
              key={group.date}
              className="rounded-3xl bg-white border border-sky-950/8 shadow-xs overflow-hidden"
            >
              {/* Date Group Header */}
              <div className="px-5 sm:px-6 py-4 bg-[#F8FBFF] border-b border-sky-950/6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base sm:text-lg font-bold text-[#0B1F3A]">
                    {formatDisplayDate(group.date, todayKey)}
                  </h2>
                  <p className="text-xs text-[#647D9B] tabular-nums">
                    <span>{group.date}</span>
                    <span aria-hidden="true"> · </span>
                    <span>
                      {group.entries.length}{' '}
                      {group.entries.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-display text-base sm:text-lg font-extrabold text-[#0B1F3A] tabular-nums">
                      {group.totalMl.toLocaleString()} ml
                    </p>
                    <p
                      className={`text-xs font-semibold tabular-nums ${
                        group.goalAchieved
                          ? 'text-emerald-700'
                          : 'text-[#647D9B]'
                      }`}
                    >
                      {group.percentage}% of {group.goalMl.toLocaleString()} ml
                      goal
                    </p>
                  </div>

                  {group.goalAchieved && (
                    <CheckCircle2
                      className="w-5 h-5 text-emerald-600 shrink-0"
                      aria-label="Daily goal achieved"
                    />
                  )}
                </div>
              </div>

              {/* Individual Intake Entries */}
              <div>
                {group.entries.map((entry) => (
                  <IntakeCard
                    key={entry.id}
                    entry={entry}
                    onDelete={onDeleteEntry}
                    disabled={mutating}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
