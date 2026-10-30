import React from 'react';
import { NavigationMode, Language } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Shield,
  Navigation,
  Compass,
  AlertTriangle,
  Activity,
  AlertOctagon,
  Sun,
  Moon,
  Globe,
  User,
  Radio,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  activeMode: NavigationMode;
  onSelectMode: (mode: NavigationMode) => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onSelectMode,
  onOpenProfile,
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const navModes: { id: NavigationMode; label: string; icon: any; isEmergency?: boolean }[] = [
    { id: 'smart-navigation', label: t.modes['smart-navigation'], icon: Navigation },
    { id: 'safe-journey', label: t.modes['safe-journey'], icon: Compass },
    { id: 'risk-awareness', label: t.modes['risk-awareness'], icon: AlertTriangle },
    { id: 'live-monitoring', label: t.modes['live-monitoring'], icon: Activity },
    { id: 'emergency', label: t.modes['emergency'], icon: AlertOctagon, isEmergency: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Shield className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100">
                  {t.brandName}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 hidden sm:inline-block">
                  AI SAFETY
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                {t.brandTagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Modes Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            {navModes.map((item) => {
              const Icon = item.icon;
              const isActive = activeMode === item.id;
              const isEmerg = item.isEmergency;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectMode(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? isEmerg
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : isEmerg
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controls: Language, Theme, Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Multilingual Selector */}
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none pr-1.5 py-0.5 cursor-pointer"
                aria-label="Select Language"
              >
                <option value="en" className="dark:bg-slate-900">EN (English)</option>
                <option value="hi" className="dark:bg-slate-900">हिन्दी (Hindi)</option>
                <option value="pa" className="dark:bg-slate-900">ਪੰਜਾਬੀ (Punjabi)</option>
              </select>
            </div>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title={theme === 'dark' ? t.themeLight : t.themeDark}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Profile & Settings Trigger */}
            <button
              onClick={onOpenProfile}
              className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
              title={t.profile}
              aria-label="User Profile"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Horizontal Mode Ribbon */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1.5 scrollbar-none border-t border-slate-100 dark:border-slate-800">
          {navModes.map((item) => {
            const Icon = item.icon;
            const isActive = activeMode === item.id;
            const isEmerg = item.isEmergency;

            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? isEmerg
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-blue-600 text-white shadow-sm'
                    : isEmerg
                    ? 'text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50'
                    : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
