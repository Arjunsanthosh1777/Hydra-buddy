import { Target, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { GOAL_PRESETS_ML, HYDRATION_LIMITS } from '../constants/config.ts';

interface GoalEditModalProps {
  isOpen: boolean;
  currentGoalMl: number;
  onClose: () => void;
  onSaveGoal: (newGoalMl: number) => Promise<boolean>;
  saving?: boolean;
}

export function GoalEditModal({
  isOpen,
  currentGoalMl,
  onClose,
  onSaveGoal,
  saving = false,
}: GoalEditModalProps) {
  const [goalInput, setGoalInput] = useState<string>(String(currentGoalMl));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGoalInput(String(currentGoalMl));
      setErrorMsg(null);
    }
  }, [isOpen, currentGoalMl]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = goalInput.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a daily goal.');
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      setErrorMsg('Enter a whole number in milliliters.');
      return;
    }
    if (
      parsed < HYDRATION_LIMITS.MIN_GOAL_ML ||
      parsed > HYDRATION_LIMITS.MAX_GOAL_ML
    ) {
      setErrorMsg(
        `Daily goal must be between ${HYDRATION_LIMITS.MIN_GOAL_ML} ml and ${HYDRATION_LIMITS.MAX_GOAL_ML.toLocaleString()} ml.`
      );
      return;
    }

    const ok = await onSaveGoal(parsed);
    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0B1F3A]/45 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-sky-950/10 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-sky-950/8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Target className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="goal-modal-title"
                className="font-display text-lg font-bold text-[#0B1F3A]"
              >
                Daily Hydration Goal
              </h2>
              <p className="text-xs text-[#647D9B]">
                Personal daily target in milliliters
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close goal modal"
            className="min-h-[44px] min-w-[44px] rounded-xl text-[#647D9B] hover:text-[#0B1F3A] hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-[#3B5575]">
              Common Daily Targets
            </span>
            <div className="grid grid-cols-5 gap-2">
              {GOAL_PRESETS_ML.map((preset) => {
                const active = Number(goalInput) === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setGoalInput(String(preset));
                      setErrorMsg(null);
                    }}
                    className={`min-h-[44px] rounded-xl text-xs font-bold tabular-nums transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0284C7] text-white'
                        : 'bg-[#F4F9FD] text-[#0B1F3A] border border-sky-950/10 hover:border-sky-400'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="daily-goal-modal-input"
              className="block text-xs font-semibold text-[#3B5575]"
            >
              Custom Daily Goal (ml)
            </label>
            <div className="relative">
              <input
                id="daily-goal-modal-input"
                type="number"
                inputMode="numeric"
                min={HYDRATION_LIMITS.MIN_GOAL_ML}
                max={HYDRATION_LIMITS.MAX_GOAL_ML}
                step={50}
                value={goalInput}
                onChange={(e) => {
                  setGoalInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full min-h-[48px] px-4 pr-14 rounded-xl bg-[#F4F9FD] border border-sky-950/12 text-[#0B1F3A] font-display text-lg font-bold tabular-nums focus:outline-none focus:border-sky-600 focus:bg-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#647D9B]">
                ml
              </span>
            </div>
            {errorMsg && (
              <p className="text-xs font-medium text-red-600" role="alert">
                {errorMsg}
              </p>
            )}
          </div>

          <p className="text-xs text-[#647D9B] leading-relaxed bg-[#F4F9FD] rounded-xl p-3.5 border border-sky-950/6">
            Updating your daily goal immediately recalculates today&apos;s
            remaining water intake and goal completion status. Hydration targets
            are personal habit preferences and not medical recommendations.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 rounded-xl text-sm font-semibold text-[#3B5575] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] px-6 rounded-xl text-sm font-semibold text-white bg-[#0284C7] hover:bg-[#0369A1] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Updating...' : 'Update Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
