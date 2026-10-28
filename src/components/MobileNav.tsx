import React, { useState } from 'react';
import { Award, Compass, MapPin, MessageSquare, Moon, MoreHorizontal, Settings, Sun, UserRound, Users, Globe } from 'lucide-react';
import { SupportedLanguage } from '../engine/i18n';

export type AppTab = 'feed' | 'map' | 'chat' | 'badges' | 'circadian';

interface MobileNavProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
  friendRequests: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenFriends: () => void;
  onOpenSettings: () => void;
  onOpenAccount: () => void;
  lang?: SupportedLanguage;
  onToggleLanguage?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onChange,
  friendRequests,
  theme,
  onToggleTheme,
  onOpenFriends,
  onOpenSettings,
  onOpenAccount,
  lang = 'no',
  onToggleLanguage,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreOpen || activeTab === 'circadian';

  const tabs: { id: Exclude<AppTab, 'circadian'>; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'feed', label: lang === 'no' ? 'Utforsk' : 'Explore', icon: Compass },
    { id: 'map', label: lang === 'no' ? 'Kart' : 'Map', icon: MapPin },
    { id: 'badges', label: lang === 'no' ? 'Turer' : 'Trips', icon: Award },
    { id: 'chat', label: lang === 'no' ? 'Chat' : 'Concierge', icon: MessageSquare },
  ];

  const selectTab = (tab: AppTab) => {
    setMoreOpen(false);
    onChange(tab);
  };

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="Lukk meny"
          className="md:hidden fixed inset-0 z-40 bg-black/45"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div
          className="md:hidden fixed inset-x-3 z-50 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-2"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMoreOpen(false);
              onOpenFriends();
            }}
            className="w-full min-h-12 px-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Users className="w-5 h-5 text-blue-600" />
            Venner
            {friendRequests > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white">
                {friendRequests}
              </span>
            )}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMoreOpen(false);
              onOpenAccount();
            }}
            className="w-full min-h-12 px-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <UserRound className="w-5 h-5 text-orange-500" />
            Konto
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => selectTab('circadian')}
            className={`w-full min-h-12 px-3 rounded-xl flex items-center gap-3 text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              activeTab === 'circadian' ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <Moon className="w-5 h-5" />
            Døgnrytme
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMoreOpen(false);
              onOpenSettings();
            }}
            className="w-full min-h-12 px-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Settings className="w-5 h-5" />
            Innstillinger
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onToggleTheme}
            className="w-full min-h-12 px-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            {theme === 'dark' ? 'Lys bakgrunn' : 'Mørk bakgrunn'}
          </button>
          {onToggleLanguage && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMoreOpen(false);
                onToggleLanguage();
              }}
              className="w-full min-h-12 px-3 rounded-xl flex items-center gap-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-800/80"
            >
              <Globe className="w-5 h-5 text-orange-500" />
              <span>{lang === 'no' ? 'Switch to English (UK/US)' : 'Bytt til Norsk'}</span>
            </button>
          )}
        </div>
      )}

      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 dark:border-zinc-800 bg-white/97 dark:bg-[#141311]/97 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
        aria-label="Hovedmeny"
      >
        <div className="grid grid-cols-5 min-h-16">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative min-h-16 flex flex-col items-center justify-center gap-1.5 text-[11px] font-semibold touch-manipulation transition-colors ${
                  active ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {/* Oransje underline-dot for aktiv tab */}
                {active && (
                  <span className="absolute bottom-2 w-5 h-0.5 rounded-full bg-orange-500" />
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(open => !open)}
            aria-expanded={moreOpen}
            className={`relative min-h-16 flex flex-col items-center justify-center gap-1.5 text-[11px] font-semibold touch-manipulation transition-colors ${
              moreActive ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            Mer
            {moreActive && (
              <span className="absolute bottom-2 w-5 h-0.5 rounded-full bg-orange-500" />
            )}
            {friendRequests > 0 && (
              <span className="absolute top-1.5 right-[22%] w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
