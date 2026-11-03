/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TrainerTab } from './components/TrainerTab';
import { StudyTab } from './components/StudyTab';
import { GlasNumber, MasteredByVoice, QuizStats } from './types/chant';
import { audioManager } from './services/audioManager';

const STATS_STORAGE_KEY = 'zapevy_trainer_stats_v2';
const THEME_STORAGE_KEY = 'zapevy_theme_v2';
const MASTERED_STORAGE_KEY = 'zapevy_mastered_v2';

const defaultStats: QuizStats = {
  totalQuestions: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  glasStats: {
    1: { attempts: 0, correct: 0 },
    2: { attempts: 0, correct: 0 },
    3: { attempts: 0, correct: 0 },
    4: { attempts: 0, correct: 0 },
    5: { attempts: 0, correct: 0 },
    6: { attempts: 0, correct: 0 },
    7: { attempts: 0, correct: 0 },
    8: { attempts: 0, correct: 0 },
  },
  voiceStats: {
    S: { attempts: 0, correct: 0 },
    A: { attempts: 0, correct: 0 },
    T: { attempts: 0, correct: 0 },
    B: { attempts: 0, correct: 0 },
  },
  history: [],
};

const defaultMastered: MasteredByVoice = {
  S: [],
  A: [],
  T: [],
  B: [],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'trainer' | 'study'>('trainer');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved !== null) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [stats, setStats] = useState<QuizStats>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STATS_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // use default
      }
    }
    return defaultStats;
  });

  const [masteredByVoice, setMasteredByVoice] = useState<MasteredByVoice>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(MASTERED_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {
        // use default
      }
    }
    return defaultMastered;
  });

  // Sync dark theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [isDarkMode]);

  // Persist stats
  const handleUpdateStats = (newStats: QuizStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
    } catch {
      // ignore
    }
  };

  // Persist mastered glas
  const handleUpdateMastered = (newMastered: MasteredByVoice) => {
    setMasteredByVoice(newMastered);
    try {
      localStorage.setItem(MASTERED_STORAGE_KEY, JSON.stringify(newMastered));
    } catch {
      // ignore
    }
  };

  const handleSelectTab = (tab: 'trainer' | 'study') => {
    audioManager.stop();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-900 transition-colors">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Container - Mobile First */}
      <main className="flex-1 w-full max-w-xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {activeTab === 'trainer' ? (
          <TrainerTab
            stats={stats}
            onUpdateStats={handleUpdateStats}
            masteredByVoice={masteredByVoice}
            onUpdateMastered={handleUpdateMastered}
          />
        ) : (
          <StudyTab />
        )}
      </main>

      {/* Footer with "by Dima Skulanov 2026" */}
      <footer className="py-4 text-center text-xs text-stone-400 dark:text-stone-500 border-t border-stone-200/60 dark:border-stone-800/60">
        <p className="font-mono text-[11px] tracking-wide text-stone-400 dark:text-stone-500">
          by Dima Skulanov 2026
        </p>
      </footer>

    </div>
  );
}
