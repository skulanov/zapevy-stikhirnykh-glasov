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
    <header className="sticky top-0 z-40 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/70 dark:border-stone-800/70">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        
        {/* Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg sm:text-xl font-bold font-ecclesiastical text-stone-900 dark:text-stone-100 truncate">
            Запевы стихирных гласов
          </span>
        </div>

        {/* 2 Tabs + Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-0.5 bg-stone-200/70 dark:bg-stone-800/90 rounded-xl">
            <button
              onClick={() => onSelectTab('trainer')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'trainer'
                  ? 'shadow-xs font-bold text-stone-950'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              style={activeTab === 'trainer' ? { backgroundColor: '#E9DC00' } : undefined}
            >
              Тренировка
            </button>
            <button
              onClick={() => onSelectTab('study')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'study'
                  ? 'shadow-xs font-bold text-stone-950'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
              style={activeTab === 'study' ? { backgroundColor: '#E9DC00' } : undefined}
            >
              Обучение
            </button>
          </div>

          <button
            onClick={onToggleDarkMode}
            className="p-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 rounded-xl transition-colors hover:bg-stone-200/50 dark:hover:bg-stone-800/60"
            title={isDarkMode ? 'Светлая тема' : 'Тёмная тема'}
            aria-label="Переключить тему"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
          </button>
        </div>

      </div>
    </header>
  );
};
