import { formatTimeFromIso } from '../constants/config.ts';
import type {
  InAppReminderAlert,
  NotificationPermissionState,
  UserSettings,
} from '../types/index.ts';

function parseHHMMToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return 8 * 60;
  }
  return h * 60 + m;
}

function minutesToHHMM(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generates deterministic daily reminder slots (HH:MM) between start and end times.
 */
export function computeReminderSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number
): string[] {
  const startMin = parseHHMMToMinutes(startTime);
  const endMin = parseHHMMToMinutes(endTime);
  const safeInterval = Math.max(5, Math.min(480, Math.round(intervalMinutes || 60)));

  if (endMin < startMin) {
    return [startTime];
  }

  const slots: string[] = [];
  for (let current = startMin; current <= endMin; current += safeInterval) {
    slots.push(minutesToHHMM(current));
    if (slots.length >= 64) {
      break;
    }
  }
  return slots;
}

/**
 * Returns the next upcoming reminder slot (HH:MM) relative to the current local clock.
 */
export function getNextReminderSlot(
  settings: UserSettings,
  now: Date = new Date()
): { slotHHMM: string; formattedTime: string; isTomorrow: boolean } | null {
  if (!settings.reminders_enabled) {
    return null;
  }

  const slots = computeReminderSlots(
    settings.reminder_start_time,
    settings.reminder_end_time,
    settings.reminder_interval_minutes
  );
  if (slots.length === 0) {
    return null;
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  for (const slot of slots) {
    if (parseHHMMToMinutes(slot) > nowMinutes) {
      return {
        slotHHMM: slot,
        formattedTime: formatTimeFromIso(slot),
        isTomorrow: false,
      };
    }
  }

  return {
    slotHHMM: slots[0],
    formattedTime: formatTimeFromIso(slots[0]),
    isTomorrow: true,
  };
}

export function getBrowserNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return window.Notification.permission as NotificationPermissionState;
  } catch {
    return 'unsupported';
  }
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await window.Notification.requestPermission();
    return result as NotificationPermissionState;
  } catch {
    return getBrowserNotificationPermission();
  }
}

/**
 * Plays a gentle two-note water droplet chime via Web Audio API when enabled.
 */
export function playHydrationChime(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [587.33, 880]; // D5 -> A5 gentle chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.36);
    });
  } catch {
    // Ignore audio context restrictions prior to user gesture
  }
}

class HydrationNotificationScheduler {
  private intervalId: number | null = null;
  private lastTriggeredSlotKey: string | null = null;

  clearScheduledReminders(): void {
    if (this.intervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  triggerNotification(
    settings: UserSettings,
    remainingMl: number,
    onInAppAlert: (alert: InAppReminderAlert) => void,
    slotLabel?: string
  ): void {
    const title = 'HydraBuddy Hydration Reminder';
    const body =
      remainingMl > 0
        ? `Time for a glass of water — ${remainingMl.toLocaleString()} ml remaining toward today's ${settings.daily_goal_ml.toLocaleString()} ml goal.`
        : `Daily goal reached! Keep sipping steadily to stay refreshed.`;

    if (settings.sound_enabled) {
      playHydrationChime();
    }

    if (getBrowserNotificationPermission() === 'granted') {
      try {
        new window.Notification(title, {
          body,
          tag: 'hydrabuddy-water-reminder',
        });
      } catch {
        // Fallback gracefully to in-app alert banner
      }
    }

    onInAppAlert({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      message: body,
      triggeredAt: new Date().toISOString(),
      slotTime: slotLabel ?? formatTimeFromIso(new Date().toISOString()),
    });
  }

  /**
   * Registers a single deduplicated scheduler that checks local time every 20 seconds
   * and fires once per matching reminder slot.
   */
  syncSchedule(
    settings: UserSettings,
    getRemainingMl: () => number,
    onInAppAlert: (alert: InAppReminderAlert) => void
  ): void {
    this.clearScheduledReminders();

    if (!settings.reminders_enabled || typeof window === 'undefined') {
      return;
    }

    const slots = computeReminderSlots(
      settings.reminder_start_time,
      settings.reminder_end_time,
      settings.reminder_interval_minutes
    );
    const slotSet = new Set(slots);

    const checkCurrentMinute = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const uniqueSlotKey = `${dateKey}@${hhmm}`;

      if (slotSet.has(hhmm) && this.lastTriggeredSlotKey !== uniqueSlotKey) {
        this.lastTriggeredSlotKey = uniqueSlotKey;
        this.triggerNotification(
          settings,
          getRemainingMl(),
          onInAppAlert,
          formatTimeFromIso(hhmm)
        );
      }
    };

    this.intervalId = window.setInterval(checkCurrentMinute, 20000);
  }
}

export const notificationScheduler = new HydrationNotificationScheduler();
