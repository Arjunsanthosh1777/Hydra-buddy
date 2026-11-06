# HYDRABUDDY – Smart Water Intake Tracker

**HYDRABUDDY** is a full-stack, mobile-first water intake tracking application designed to help users record daily water consumption, manage customizable hydration goals, inspect chronological intake history and weekly analytics, maintain consecutive-day streaks, unlock milestone badges, and configure periodic hydration reminders.

---

## 1. Problem Statement

Maintaining consistent daily hydration is one of the simplest habits for daily energy and focus, yet many people forget to drink water regularly throughout busy work or study days. Existing trackers often clutter the interface with subscription paywalls, fabricated sample metrics, or rigid reminder schedules that fire at inconvenient hours.

---

## 2. Objectives

- Provide an immediate, low-friction interface for recording water intake (`100 ml`, `200 ml`, `250 ml`, `300 ml`, `500 ml`, or custom volumes in milliliters).
- Persist all water intake entries, user preferences, and unlocked achievement badges in a relational **SQLite** database (`hydrabuddy.db`) with parameterized SQL queries.
- Compute real-time hydration progress, remaining volume, weekly consumption trends, active daily averages, best hydration days, and consecutive-day streaks strictly from actual stored records.
- Deliver non-duplicate hydration reminders within user-defined active hours (`start_time` to `end_time`) and intervals, handling browser notification permissions and sandbox restrictions gracefully.

---

## 3. Environment Adaptation Note

The original specification references React Native / Expo (`expo-router`, `expo-sqlite`, `expo-notifications`). Because this runtime executes in a Linux Node.js + browser preview environment (serving port `3000` without an iOS/Android device simulator or Expo Go runtime), HYDRABUDDY is implemented as a **live, full-stack TypeScript web & mobile-first application**:

- **UI & Navigation**: React 19 + TypeScript + Tailwind CSS v4 with responsive mobile bottom-tab navigation (`Home`, `History`, `Stats`, `Badges`, `Settings`) and desktop 3-zone top navigation, plus Splash, 3-Step Onboarding, and Add Water / Goal Edit modals.
- **Persistent SQLite Storage**: Node.js built-in `node:sqlite` (`DatabaseSync`) backed by an Express REST API (`server.ts`) persisting to `hydrabuddy.db` on disk with WAL mode and parameterized queries.
- **Hydration Reminders**: Browser Notifications API (`Notification.requestPermission()` / `new Notification()`) paired with a deduplicated local-time scheduler, optional Web Audio water chime, and an interactive in-app reminder banner so reminders work reliably even when OS notifications are denied or restricted inside an iframe.

---

## 4. Key Features

1. **Splash & 3-Step Onboarding Flow**:
   - Introduces HYDRABUDDY, configures display name and personal daily hydration target (`500 ml` – `10,000 ml`), and sets up active reminder hours and intervals.
2. **Home Dashboard**:
   - Time-of-day greeting (`Good morning / afternoon / evening`) and current local date.
   - Interactive circular SVG hydration gauge with animated water-wave fill, percentage completed, consumed volume, and non-negative remaining volume.
   - Quick-add buttons (`+100 ml`, `+200 ml`, `+250 ml`, `+300 ml`, `+500 ml`) and Custom Amount modal with container labels and time selection.
   - Today's chronological intake list with timestamp display and two-step safe deletion.
3. **Daily Goal Management**:
   - Preset targets (`1500`–`3500 ml`) and custom goal validation (`500`–`10,000 ml`).
   - Immediate recalculation of remaining intake and goal completion status, with explicit notice that daily targets are personal preferences and not medical advice.
4. **Hydration History**:
   - Date-wise grouped consumption records (`Today`, `Yesterday`, formatted calendar dates) with daily totals, goal attainment status, range filters (`All Days`, `Last 7 Days`, `Last 30 Days`), specific date picker, and empty states.
5. **Statistics & Progress**:
   - Calculated directly from SQLite records: Today's Consumption, 7-Day Total Intake, Average Daily Intake (active-day and 7-day calendar averages), Best Hydration Day, Goal Completion Rate, and Current / Longest Streak.
   - Interactive 7-day progress bar chart with a dashed daily goal threshold line and day-by-day inspection.
6. **Streaks & Achievement Badges**:
   - Tracks consecutive days meeting the daily hydration target and evaluates 8 achievement milestones (`First Glass`, `Hydration Starter`, `Goal Crusher`, `3-Day Streak`, `7-Day Streak`, `Steady Sipper`, `10-Liter Milestone`, and `Hydration Champion`).
7. **Hydration Reminders & Settings**:
   - Enable/disable reminders, configure start time, end time, interval (`15 min` – `2 hours`), sound chime toggle, permission status check, test reminder trigger, JSON data export, and confirmed database reset.

---

## 5. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons
- **Backend**: Node.js v22, Express 4, `tsx`
- **Database**: SQLite (`node:sqlite` `DatabaseSync`, persisted to `hydrabuddy.db`)
- **Build & Tooling**: Vite 8, TypeScript compiler (`tsc --noEmit`)

---

## 6. Folder Structure

```text
├── server.ts                          # Express API server + Vite dev middleware + SQLite bootstrap
├── index.html                         # HTML entry point, metadata, and Google Fonts
├── package.json                       # Project dependencies and npm scripts
├── tsconfig.json                      # TypeScript compiler configuration
├── vite.config.ts                     # Vite bundler configuration
└── src/
    ├── main.tsx                       # React DOM root mount
    ├── App.tsx                        # Navigation shell, modals, banners, and screen router
    ├── index.css                      # Tailwind CSS v4 styles and wave animation keyframes
    ├── types/
    │   └── index.ts                   # Shared TypeScript interfaces and domain types
    ├── constants/
    │   ├── colors.ts                  # Fresh blue, aqua, mint green, and navy palette tokens
    │   └── config.ts                  # Presets, validation bounds, badges, and local date helpers
    ├── database/
    │   ├── schema.ts                  # SQLite DDL schema and default settings initialization
    │   ├── database.ts                # SQLite connection singleton and lifecycle management
    │   └── waterRepository.ts         # Parameterized SQLite CRUD queries and transactions
    ├── services/
    │   ├── hydrationService.ts        # Daily summary, history grouping, and badge evaluation
    │   ├── statisticsService.ts       # Weekly trends, averages, best day, and streak logic
    │   └── notificationService.ts     # Deduplicated reminder scheduler and browser/audio alerts
    ├── hooks/
    │   ├── useHydration.ts            # Full-stack hydration state, mutations, and reminders
    │   └── useSettings.ts             # Settings form state and goal validation hook
    ├── components/
    │   ├── WaterProgress.tsx          # Circular SVG water wave ring and daily breakdown
    │   ├── QuickAddButtons.tsx        # One-tap quick-add volume controls
    │   ├── IntakeCard.tsx             # Individual intake row with timestamp and safe delete
    │   ├── StatisticsCard.tsx         # Tabular metric summary card
    │   ├── AchievementBadge.tsx       # Achievement progress and unlock card
    │   ├── WeeklyProgressChart.tsx    # Interactive 7-day hydration chart with goal line
    │   ├── AddWaterModal.tsx          # Modal/sheet for custom water intake logging
    │   └── GoalEditModal.tsx          # Modal for updating daily hydration goal
    ├── screens/
    │   ├── SplashScreen.tsx           # Branded launch screen
    │   ├── OnboardingScreen.tsx       # 3-step initial setup wizard
    │   ├── HomeScreen.tsx             # Primary hydration dashboard
    │   ├── HistoryScreen.tsx          # Date-wise intake history and filters
    │   ├── StatisticsScreen.tsx       # Calculated KPIs, chart, and 7-day breakdown
    │   ├── AchievementsScreen.tsx     # Streak summary and 8 achievement badges
    │   └── SettingsScreen.tsx         # Goal, reminders, export, and data reset controls
    └── assets/
        └── images/                    # Generated studio photography and droplet emblem
```

---

## 7. Database Schema (`hydrabuddy.db`)

1. **`water_entries`**:
   - `id` (`INTEGER PRIMARY KEY AUTOINCREMENT`)
   - `amount_ml` (`INTEGER NOT NULL CHECK(amount_ml > 0 AND amount_ml <= 10000)`)
   - `consumed_at` (`TEXT NOT NULL` — ISO timestamp)
   - `local_date` (`TEXT NOT NULL` — local calendar `YYYY-MM-DD` to prevent timezone day-shift bugs)
   - `note` (`TEXT` — optional container or label)
   - `created_at` (`TEXT NOT NULL`)

2. **`user_settings`**:
   - `id` (`INTEGER PRIMARY KEY CHECK(id = 1)`)
   - `user_name` (`TEXT NOT NULL DEFAULT 'Friend'`)
   - `daily_goal_ml` (`INTEGER NOT NULL DEFAULT 2500`)
   - `reminders_enabled` (`INTEGER NOT NULL DEFAULT 1`)
   - `reminder_start_time` (`TEXT NOT NULL DEFAULT '08:00'`)
   - `reminder_end_time` (`TEXT NOT NULL DEFAULT '21:00'`)
   - `reminder_interval_minutes` (`INTEGER NOT NULL DEFAULT 60`)
   - `sound_enabled` (`INTEGER NOT NULL DEFAULT 1`)
   - `onboarding_completed` (`INTEGER NOT NULL DEFAULT 0`)
   - `updated_at` (`TEXT NOT NULL`)

3. **`achievements`**:
   - `id` (`INTEGER PRIMARY KEY AUTOINCREMENT`)
   - `achievement_type` (`TEXT NOT NULL UNIQUE`)
   - `unlocked_at` (`TEXT NOT NULL`)

---

## 8. Installation & Running Locally

### Prerequisites
- **Node.js v22.6+** (includes native `node:sqlite` and TypeScript execution)
- **npm v10+**

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
Starts the Express API server + Vite middleware on `http://localhost:3000`:
```bash
npm run dev
```

### Type-Check & Build for Production
```bash
npm run lint
npm run build
NODE_ENV=production npm start
```

---

## 9. Testing Instructions

1. **Onboarding & Goal Setup**: Launch the app, complete the 3-step onboarding flow, and verify that reloading the page lands directly on the Home Dashboard with your chosen name and daily goal persisted in `hydrabuddy.db`.
2. **Quick-Add & Custom Water Intake**:
   - Tap `+250 ml` on the Home Dashboard and verify immediate updates to Consumed, Remaining, Percentage, Today's Water Intake list, and unlocking of the **First Glass** badge.
   - Open **Log Water**, test invalid inputs (`0`, `-50`, empty input) to confirm validation messages, then submit a valid custom entry (e.g., `400 ml` with container `Bottle`).
3. **Entry Deletion**: Delete an entry from Today's Water Intake or History and confirm all totals, percentages, and statistics recalculate immediately.
4. **Daily Goal Adjustment**: Change the daily goal (e.g., from `2500 ml` to `1500 ml`) and verify Remaining water and Goal Achieved status update without negative remaining values.
5. **History & Statistics**: Inspect date-wise entries in **History** (test `All Days`, `Last 7 Days`, and the date picker) and verify calculated metrics and interactive bars in **Statistics**.
6. **Hydration Reminders**: In **Settings**, toggle reminders on/off, adjust start/end times and interval, inspect the live schedule preview, and click **Send Test Reminder** to verify immediate reminder delivery.
7. **Data Reset**: Use **Reset Hydration Data** in Settings to verify confirmation gating and clean restoration of empty states.

---

## 10. Visual Overview

- **Home Dashboard**: Circular animated water-wave progress ring paired with quick-add controls, daily intake log, streak status, and next reminder schedule.
- **History & Statistics**: Chronological daily intake cards, range filters, and a 7-day interactive bar chart with a daily goal reference line.
- **Achievements & Settings**: Progress bars across 8 unlockable hydration milestones, reminder window configuration, JSON export, and SQLite data management.

---

## 11. Limitations & Future Enhancements

### Current Limitations
- Runs as a web/mobile-web application in Node.js + browser rather than a compiled iOS/Android native binary; browser OS notifications require an open tab and browser permission, falling back to in-app reminder banners when blocked.
- Single-user local SQLite database (`hydrabuddy.db`) without multi-user cloud authentication.

### Future Enhancements
- Native iOS/Android packaging via Capacitor or Expo EAS Build with background OS push notifications.
- Beverage hydration factor presets (e.g., sparkling water, herbal tea) and unit toggle (`ml` / `fl oz`).
- Multi-device cloud synchronization and weekly PDF/CSV health summaries.
