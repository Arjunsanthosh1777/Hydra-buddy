import {
  Award,
  BarChart3,
  Bell,
  Clock,
  Droplets,
  Home,
  Plus,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { AddWaterModal } from './components/AddWaterModal.tsx';
import { GoalEditModal } from './components/GoalEditModal.tsx';
import { useHydration } from './hooks/useHydration.ts';
import { AchievementsScreen } from './screens/AchievementsScreen.tsx';
import { HistoryScreen } from './screens/HistoryScreen.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { OnboardingScreen } from './screens/OnboardingScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { SplashScreen } from './screens/SplashScreen.tsx';
import { StatisticsScreen } from './screens/StatisticsScreen.tsx';
import type { TabRoute } from './types/index.ts';

const NAV_TABS: Array<{
  id: TabRoute;
  desktopLabel: string;
  mobileLabel: string;
  icon: typeof Home;
}> = [
  { id: 'home', desktopLabel: 'Home', mobileLabel: 'Home', icon: Home },
  {
    id: 'history',
    desktopLabel: 'History',
    mobileLabel: 'History',
    icon: Clock,
  },
  {
    id: 'statistics',
    desktopLabel: 'Statistics',
    mobileLabel: 'Stats',
    icon: BarChart3,
  },
  {
    id: 'achievements',
    desktopLabel: 'Achievements',
    mobileLabel: 'Badges',
    icon: Award,
  },
  {
    id: 'settings',
    desktopLabel: 'Settings',
    mobileLabel: 'Settings',
    icon: SettingsIcon,
  },
];

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabRoute>('home');
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [goalModalOpen, setGoalModalOpen] = useState<boolean>(false);

  const {
    snapshot,
    loading,
    mutating,
    error,
    clearError,
    toastMessage,
    unlockedBanner,
    dismissUnlockedBanner,
    reminderAlert,
    dismissReminderAlert,
    notificationPermission,
    refreshHydration,
    addWaterIntake,
    deleteWaterEntry,
    updateSettings,
    resetAllData,
    requestNotifications,
    sendTestReminder,
  } = useHydration();

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (loading && !snapshot) {
    return (
      <div className="min-h-screen bg-[#F4F9FD] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#0284C7] text-white flex items-center justify-center mb-3">
          <Droplets className="w-6 h-6" aria-hidden="true" />
        </div>
        <p className="font-display text-base font-bold text-[#0B1F3A]">
          Loading HYDRABUDDY...
        </p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-[#F4F9FD] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-sky-950/8 p-8 shadow-xs space-y-4">
          <h1 className="font-display text-xl font-bold text-[#0B1F3A]">
            Unable to Load Hydration Data
          </h1>
          <p className="text-sm text-[#3B5575]">
            {error || 'Could not reach the local SQLite database.'}
          </p>
          <button
            type="button"
            onClick={refreshHydration}
            className="min-h-[46px] px-6 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!snapshot.settings.onboarding_completed) {
    return (
      <OnboardingScreen
        settings={snapshot.settings}
        notificationPermission={notificationPermission}
        onRequestNotifications={requestNotifications}
        onCompleteOnboarding={async (patch) => {
          const ok = await updateSettings(patch);
          if (ok) {
            setActiveTab('home');
          }
          return ok;
        }}
        saving={mutating}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F9FD] text-[#0B1F3A] flex flex-col">
      {/* Desktop Top Bar (Strict 3-Zone Top Bar Contract) */}
      <header className="hidden md:block sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sky-950/8">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('home');
            }}
            className="font-display text-lg font-extrabold tracking-tight text-[#0B1F3A] whitespace-nowrap shrink-0"
          >
            HYDRABUDDY
          </a>

          {/* Zone 2: 5 Single-Line Text Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="flex items-center gap-7"
          >
            {NAV_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-[#0284C7] border-[#0284C7] font-semibold'
                      : 'text-[#3B5575] border-transparent hover:text-[#0B1F3A]'
                  }`}
                >
                  {tab.desktopLabel}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Log Water</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Compact Top Header (56px height) */}
      <header className="md:hidden sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-sky-950/8 px-4 flex items-center justify-between gap-4">
        <span className="font-display text-base font-extrabold tracking-tight text-[#0B1F3A] whitespace-nowrap shrink-0">
          HYDRABUDDY
        </span>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="min-h-[40px] px-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Log Water</span>
        </button>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-12 space-y-5">
        {/* Error Alert Banner */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm text-red-800"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              aria-label="Dismiss error"
              className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-red-100 flex items-center justify-center shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Active In-App Hydration Reminder Banner */}
        {reminderAlert && (
          <div
            role="status"
            className="rounded-2xl bg-sky-50 border border-sky-300 p-4 flex items-start justify-between gap-4 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0284C7] text-white flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-[#0B1F3A]">
                  {reminderAlert.title} · {reminderAlert.slotTime}
                </p>
                <p className="text-xs text-[#3B5575] mt-0.5">
                  {reminderAlert.message}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await addWaterIntake(250, { note: 'Reminder Glass' });
                      dismissReminderAlert();
                    }}
                    className="min-h-[36px] px-3 rounded-xl bg-[#0284C7] text-white text-xs font-semibold hover:bg-[#0369A1] cursor-pointer"
                  >
                    Log +250 ml Now
                  </button>
                  <button
                    type="button"
                    onClick={dismissReminderAlert}
                    className="min-h-[36px] px-3 rounded-xl bg-white border border-sky-950/10 text-xs font-medium text-[#3B5575] cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissReminderAlert}
              aria-label="Close reminder"
              className="min-h-[36px] min-w-[36px] rounded-lg text-[#647D9B] hover:text-[#0B1F3A] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Newly Unlocked Achievement Celebration Banner */}
        {unlockedBanner.length > 0 && (
          <div
            role="status"
            className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-emerald-950">
                  Achievement Unlocked:{' '}
                  {unlockedBanner.map((a) => a.title).join(', ')}
                </p>
                <p className="text-xs text-emerald-800">
                  {unlockedBanner[0].description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissUnlockedBanner}
              aria-label="Dismiss achievement banner"
              className="min-h-[36px] min-w-[36px] rounded-lg text-emerald-800 hover:bg-emerald-100 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Active Screen Content */}
        {activeTab === 'home' && (
          <HomeScreen
            snapshot={snapshot}
            mutating={mutating}
            onQuickAdd={(amount) => addWaterIntake(amount)}
            onDeleteEntry={deleteWaterEntry}
            onOpenAddModal={() => setAddModalOpen(true)}
            onOpenGoalModal={() => setGoalModalOpen(true)}
            onSendTestReminder={sendTestReminder}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            snapshot={snapshot}
            mutating={mutating}
            onDeleteEntry={deleteWaterEntry}
            onOpenAddModal={() => setAddModalOpen(true)}
          />
        )}

        {activeTab === 'statistics' && <StatisticsScreen snapshot={snapshot} />}

        {activeTab === 'achievements' && (
          <AchievementsScreen snapshot={snapshot} />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            snapshot={snapshot}
            mutating={mutating}
            notificationPermission={notificationPermission}
            onUpdateSettings={updateSettings}
            onResetData={resetAllData}
            onRequestNotifications={requestNotifications}
            onSendTestReminder={sendTestReminder}
            onReopenOnboarding={() =>
              updateSettings({ onboarding_completed: false })
            }
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Tab Bar (64px height, 5 tabs >= 44px touch target) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-sky-950/10 grid grid-cols-5 items-center px-1"
      >
        {NAV_TABS.map((tab) => {
          const IconComponent = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
                active
                  ? 'text-[#0284C7] font-semibold'
                  : 'text-[#647D9B] hover:text-[#0B1F3A]'
              }`}
            >
              <IconComponent className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] leading-none tracking-tight">
                {tab.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 rounded-2xl bg-[#0B1F3A] text-white px-4 py-2.5 text-xs font-semibold shadow-lg"
        >
          {toastMessage}
        </div>
      )}

      {/* Add Water Intake Modal */}
      <AddWaterModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmitWater={addWaterIntake}
        submitting={mutating}
      />

      {/* Daily Goal Edit Modal */}
      <GoalEditModal
        isOpen={goalModalOpen}
        currentGoalMl={snapshot.settings.daily_goal_ml}
        onClose={() => setGoalModalOpen(false)}
        onSaveGoal={(newGoalMl) =>
          updateSettings(
            { daily_goal_ml: newGoalMl },
            `Daily goal updated to ${newGoalMl.toLocaleString()} ml`
          )
        }
        saving={mutating}
      />
    </div>
  );
}
