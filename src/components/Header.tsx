/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart2, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'trainer' | 'study';
  onSelectTab: (tab: 'trainer' | 'study') => void;
  onOpenAudioModal: () => void;
  onOpenGitHubModal: () => void;
  onOpenStatsModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  streakCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenAudioModal,
  onOpenGitHubModal,
  onOpenStatsModal,
  isDarkMode,
  onToggleDarkMode,
  streakCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('trainer');
            }}
            className="text-lg sm:text-xl font-bold font-ecclesiastical tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 hover:opacity-85 transition-opacity"
          >
            Запевы стихирных гласов
          </a>
        </div>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onSelectTab('trainer')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'trainer'
                ? 'text-slate-900 dark:text-white font-semibold underline underline-offset-8 decoration-2 decoration-amber-500'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Тренажёр
          </button>
          <button
            onClick={() => onSelectTab('study')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'study'
                ? 'text-slate-900 dark:text-white font-semibold underline underline-offset-8 decoration-2 decoration-amber-500'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Учебный раздел
          </button>
          <button
            onClick={onOpenAudioModal}
            className="whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Файлы аудио
          </button>
          <button
            onClick={onOpenGitHubModal}
            className="whitespace-nowrap shrink-0 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            GitHub
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (with Dark Mode toggle) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg transition-colors"
            title={isDarkMode ? 'Светлая тема' : 'Тёмная тема'}
            aria-label="Переключить тему"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenStatsModal}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Статистика</span>
            {streakCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-mono">
                {streakCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Mobile Secondary Navigation Row (only visible on mobile screens) */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/70">
        <button
          onClick={() => onSelectTab('trainer')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeTab === 'trainer'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
              : ''
          }`}
        >
          Тренажёр
        </button>
        <button
          onClick={() => onSelectTab('study')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeTab === 'study'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
              : ''
          }`}
        >
          Учебник
        </button>
        <button
          onClick={onOpenAudioModal}
          className="px-3 py-1.5 whitespace-nowrap"
        >
          Аудио
        </button>
        <button
          onClick={onOpenGitHubModal}
          className="px-3 py-1.5 whitespace-nowrap"
        >
          GitHub
        </button>
      </div>
    </header>
  );
};
