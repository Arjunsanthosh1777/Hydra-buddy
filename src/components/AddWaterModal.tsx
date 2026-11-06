import { Droplets, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  CONTAINER_PRESETS,
  getLocalDateKey,
  HYDRATION_LIMITS,
  QUICK_ADD_AMOUNTS_ML,
} from '../constants/config.ts';

interface AddWaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitWater: (
    amountMl: number,
    options?: { note?: string; consumedAtIso?: string; localDateKey?: string }
  ) => Promise<boolean>;
  submitting?: boolean;
}

function getCurrentLocalTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
}

export function AddWaterModal({
  isOpen,
  onClose,
  onSubmitWater,
  submitting = false,
}: AddWaterModalProps) {
  const [amountInput, setAmountInput] = useState<string>('250');
  const [selectedContainer, setSelectedContainer] = useState<string>('Glass');
  const [customNote, setCustomNote] = useState<string>('');
  const [timeHHMM, setTimeHHMM] = useState<string>(() =>
    getCurrentLocalTimeHHMM()
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handlePresetSelect = (amount: number) => {
    setAmountInput(String(amount));
    setValidationError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = amountInput.trim();
    if (!trimmed) {
      setValidationError('Please enter a water amount in milliliters.');
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      setValidationError('Please enter a valid whole number (e.g. 250).');
      return;
    }

    if (
      parsed < HYDRATION_LIMITS.MIN_ENTRY_ML ||
      parsed > HYDRATION_LIMITS.MAX_ENTRY_ML
    ) {
      setValidationError(
        `Amount must be between ${HYDRATION_LIMITS.MIN_ENTRY_ML} ml and ${HYDRATION_LIMITS.MAX_ENTRY_ML.toLocaleString()} ml.`
      );
      return;
    }

    // Build local timestamp for today at the chosen HH:mm
    const now = new Date();
    const [hStr, mStr] = timeHHMM.split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    const consumedDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Number.isNaN(h) ? now.getHours() : h,
      Number.isNaN(m) ? now.getMinutes() : m,
      now.getSeconds()
    );

    const finalNote = customNote.trim() || selectedContainer;

    const ok = await onSubmitWater(parsed, {
      note: finalNote,
      consumedAtIso: consumedDate.toISOString(),
      localDateKey: getLocalDateKey(consumedDate),
    });

    if (ok) {
      setValidationError(null);
      setCustomNote('');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0B1F3A]/45 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-water-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-sky-950/10 shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-200" />
        </div>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-sky-950/8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Droplets className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="add-water-modal-title"
                className="font-display text-lg font-bold text-[#0B1F3A]"
              >
                Log Water Intake
              </h2>
              <p className="text-xs text-[#647D9B]">
                Choose a preset or enter a custom volume
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] rounded-xl text-[#647D9B] hover:text-[#0B1F3A] hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Quick Preset Amounts */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-[#3B5575]">
              Quick Volume Presets
            </span>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_ADD_AMOUNTS_ML.map((preset) => {
                const isSelected = Number(amountInput) === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`min-h-[46px] rounded-xl text-xs sm:text-sm font-bold tabular-nums transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0284C7] text-white shadow-xs'
                        : 'bg-[#F4F9FD] text-[#0B1F3A] border border-sky-950/10 hover:border-sky-400'
                    }`}
                  >
                    {preset} ml
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="custom-water-ml"
              className="block text-xs font-semibold text-[#3B5575]"
            >
              Custom Amount (ml)
            </label>
            <div className="relative">
              <input
                id="custom-water-ml"
                type="number"
                inputMode="numeric"
                min={HYDRATION_LIMITS.MIN_ENTRY_ML}
                max={HYDRATION_LIMITS.MAX_ENTRY_ML}
                step={1}
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g. 350"
                className="w-full min-h-[48px] px-4 pr-14 rounded-xl bg-[#F4F9FD] border border-sky-950/12 text-[#0B1F3A] font-display text-lg font-bold tabular-nums focus:outline-none focus:border-sky-600 focus:bg-white transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#647D9B]">
                ml
              </span>
            </div>
            {validationError && (
              <p className="text-xs font-medium text-red-600" role="alert">
                {validationError}
              </p>
            )}
          </div>

          {/* Container Type Selector */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-[#3B5575]">
              Container
            </span>
            <div className="flex flex-wrap gap-2">
              {CONTAINER_PRESETS.map((container) => {
                const active = selectedContainer === container;
                return (
                  <button
                    key={container}
                    type="button"
                    onClick={() => setSelectedContainer(container)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0B1F3A] text-white'
                        : 'bg-[#F4F9FD] text-[#3B5575] border border-sky-950/10 hover:text-[#0B1F3A]'
                    }`}
                  >
                    {container}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time & Optional Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="consumed-time-input"
                className="block text-xs font-semibold text-[#3B5575]"
              >
                Time Consumed
              </label>
              <input
                id="consumed-time-input"
                type="time"
                value={timeHHMM}
                onChange={(e) => setTimeHHMM(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F4F9FD] border border-sky-950/12 text-sm font-medium text-[#0B1F3A] tabular-nums focus:outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="custom-note-input"
                className="block text-xs font-semibold text-[#3B5575]"
              >
                Custom Label (Optional)
              </label>
              <input
                id="custom-note-input"
                type="text"
                maxLength={60}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder={selectedContainer}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F4F9FD] border border-sky-950/12 text-sm text-[#0B1F3A] focus:outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Submit & Cancel Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 rounded-xl text-sm font-semibold text-[#3B5575] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] px-6 rounded-xl text-sm font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] active:scale-[0.98] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Water Intake'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
