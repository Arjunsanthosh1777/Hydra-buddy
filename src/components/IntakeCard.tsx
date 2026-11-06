import { Droplets, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatTimeFromIso } from '../constants/config.ts';
import type { WaterEntry } from '../types/index.ts';

interface IntakeCardProps {
  entry: WaterEntry;
  onDelete: (entryId: number) => Promise<boolean> | void;
  disabled?: boolean;
}

export function IntakeCard({
  entry,
  onDelete,
  disabled = false,
}: IntakeCardProps) {
  const [confirming, setConfirming] = useState(false);

  const handleDeleteClick = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    await onDelete(entry.id);
  };

  return (
    <div className="min-h-[64px] py-3 px-4 flex items-center justify-between gap-4 border-b border-sky-950/6 last:border-b-0 hover:bg-sky-50/40 transition-colors">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200/70 flex items-center justify-center text-sky-600 shrink-0">
          <Droplets className="w-4 h-4" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="font-display text-base font-bold text-[#0B1F3A] tabular-nums truncate">
            {entry.amount_ml.toLocaleString()} ml
          </p>
          <p className="text-xs text-[#647D9B] truncate">
            <span>{formatTimeFromIso(entry.consumed_at)}</span>
            {entry.note ? (
              <>
                <span aria-hidden="true"> · </span>
                <span>{entry.note}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {confirming ? (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={handleDeleteClick}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Delete
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setConfirming(false)}
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#3B5575] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={handleDeleteClick}
            aria-label={`Delete ${entry.amount_ml} ml entry logged at ${formatTimeFromIso(
              entry.consumed_at
            )}`}
            title="Remove entry"
            className="min-h-[44px] min-w-[44px] rounded-xl text-[#647D9B] hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
