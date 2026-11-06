import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { getLocalDateKey } from './src/constants/config.ts';
import { getDatabase } from './src/database/database.ts';
import { waterRepository } from './src/database/waterRepository.ts';
import {
  buildHydrationSnapshot,
  evaluateAchievements,
} from './src/services/hydrationService.ts';
import { computeHydrationStatistics } from './src/services/statisticsService.ts';
import type { AchievementType, HydrationSnapshot } from './src/types/index.ts';

function resolveClientDateKey(rawDate: unknown): string {
  if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate;
  }
  return getLocalDateKey(new Date());
}

function getSyncedSnapshot(todayDateKey: string): HydrationSnapshot {
  const settings = waterRepository.getSettings();
  const entries = waterRepository.getAllEntries();
  const unlocked = waterRepository.getUnlockedAchievements();
  const stats = computeHydrationStatistics(
    entries,
    settings.daily_goal_ml,
    todayDateKey
  );
  const { eligibleTypes } = evaluateAchievements(
    entries,
    settings,
    unlocked,
    stats
  );
  const newlyUnlocked: AchievementType[] =
    waterRepository.syncAchievements(eligibleTypes);
  const updatedUnlocked = waterRepository.getUnlockedAchievements();

  return buildHydrationSnapshot(
    entries,
    settings,
    updatedUnlocked,
    todayDateKey,
    newlyUnlocked
  );
}

export async function createApp() {
  // Initialize SQLite database and tables at startup
  getDatabase();

  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    try {
      const settings = waterRepository.getSettings();
      res.json({
        ok: true,
        storage: 'sqlite',
        dailyGoalMl: settings.daily_goal_ml,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : 'Database health check failed',
      });
    }
  });

  app.get('/api/hydration', (req: Request, res: Response) => {
    try {
      const todayKey = resolveClientDateKey(req.query.date);
      const snapshot = getSyncedSnapshot(todayKey);
      res.json(snapshot);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load hydration data.',
      });
    }
  });

  app.post('/api/entries', (req: Request, res: Response) => {
    try {
      const { amount_ml, consumed_at, local_date, note } = req.body ?? {};
      const parsedAmount = Number(amount_ml);

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({
          error: 'Please enter a valid positive water amount in milliliters.',
        });
        return;
      }

      const todayKey = resolveClientDateKey(local_date);
      const consumedIso =
        typeof consumed_at === 'string' && consumed_at.trim().length > 0
          ? consumed_at
          : new Date().toISOString();

      const entry = waterRepository.insertWaterEntry({
        amount_ml: parsedAmount,
        consumed_at: consumedIso,
        local_date: todayKey,
        note: typeof note === 'string' ? note : null,
      });

      const snapshot = getSyncedSnapshot(todayKey);
      res.status(201).json({ entry, snapshot });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to record water intake entry.',
      });
    }
  });

  app.delete('/api/entries/:id', (req: Request, res: Response) => {
    try {
      const entryId = Number(req.params.id);
      const todayKey = resolveClientDateKey(req.query.date);

      if (!Number.isInteger(entryId) || entryId <= 0) {
        res.status(400).json({ error: 'Invalid water entry identifier.' });
        return;
      }

      const deleted = waterRepository.deleteWaterEntry(entryId);
      if (!deleted) {
        res.status(404).json({ error: 'Water entry not found.' });
        return;
      }

      const snapshot = getSyncedSnapshot(todayKey);
      res.json({ deletedId: entryId, snapshot });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete water entry.',
      });
    }
  });

  app.patch('/api/settings', (req: Request, res: Response) => {
    try {
      const {
        user_name,
        daily_goal_ml,
        reminders_enabled,
        reminder_start_time,
        reminder_end_time,
        reminder_interval_minutes,
        sound_enabled,
        onboarding_completed,
        local_date,
      } = req.body ?? {};

      const updatedSettings = waterRepository.updateSettings({
        user_name,
        daily_goal_ml,
        reminders_enabled,
        reminder_start_time,
        reminder_end_time,
        reminder_interval_minutes,
        sound_enabled,
        onboarding_completed,
      });

      const todayKey = resolveClientDateKey(local_date);
      const snapshot = getSyncedSnapshot(todayKey);

      res.json({ settings: updatedSettings, snapshot });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update hydration settings.',
      });
    }
  });

  app.post('/api/reset', (req: Request, res: Response) => {
    try {
      const { resetSettings, local_date } = req.body ?? {};
      waterRepository.resetAllData(Boolean(resetSettings));
      const todayKey = resolveClientDateKey(local_date);
      const snapshot = getSyncedSnapshot(todayKey);
      res.json({ snapshot });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to reset hydration data.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  return app;
}

const isDirectExecution =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  process.argv[1] &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));

if (isDirectExecution) {
  const port = Number(process.env.PORT) || 3000;
  createApp()
    .then((app) => {
      app.listen(port, '0.0.0.0', () => {
        console.log(`HYDRABUDDY server running on http://0.0.0.0:${port}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start HYDRABUDDY server:', err);
      process.exit(1);
    });
}
