import { Droplet, Plus } from 'lucide-react';
import { QUICK_ADD_AMOUNTS_ML } from '../constants/config.ts';

interface QuickAddButtonsProps {
  onQuickAdd: (amountMl: number) => void;
  onOpenCustomModal: () => void;
  disabled?: boolean;
}

export function QuickAddButtons({
  onQuickAdd,
  onOpenCustomModal,
  disabled = false,
}: QuickAddButtonsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-bold text-[#0B1F3A]">
          Quick Add Water
        </h2>
        <span className="text-xs text-[#647D9B]">Tap to record immediately</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {QUICK_ADD_AMOUNTS_ML.map((amount) => (
          <button
            key={amount}
            type="button"
            disabled={disabled}
            onClick={() => onQuickAdd(amount)}
            className="group min-h-[56px] px-3 py-2.5 rounded-2xl bg-white border border-sky-950/10 hover:border-sky-500 hover:bg-sky-50/70 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <div className="flex items-center gap-1 text-sky-600 group-hover:text-sky-700">
              <Droplet className="w-3.5 h-3.5 fill-sky-500/20" aria-hidden="true" />
              <span className="font-display text-sm font-bold text-[#0B1F3A] tabular-nums whitespace-nowrap">
                +{amount} ml
              </span>
            </div>
          </button>
        ))}

        <button
          type="button"
          disabled={disabled}
          onClick={onOpenCustomModal}
          className="min-h-[56px] px-3 py-2.5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="font-display text-sm font-semibold whitespace-nowrap">
            Custom
          </span>
        </button>
      </div>
    </div>
  );
}
