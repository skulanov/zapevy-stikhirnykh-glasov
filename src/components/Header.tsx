/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'trainer' | 'study';
  onSelectTab: (tab: 'trainer' | 'study') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isDarkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        
        {/* Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base sm:text-lg font-bold font-ecclesiastical tracking-tight text-slate-900 dark:text-slate-100 truncate">
            Запевы стихирных гласов
          </span>
        </div>

        {/* Center / Right Controls: 2 Tabs + Theme Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => onSelectTab('trainer')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                activeTab === 'trainer'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Тренировка
            </button>
            <button
              onClick={() => onSelectTab('study')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                activeTab === 'study'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Обучение
            </button>
          </div>

          <button
            onClick={onToggleDarkMode}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg transition-colors"
            title={isDarkMode ? 'Светлая тема' : 'Тёмная тема'}
            aria-label="Переключить тему"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </header>
  );
};
