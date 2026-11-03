/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TrainerTab } from './components/TrainerTab';
import { StudyTab } from './components/StudyTab';
import { AudioBatchModal } from './components/AudioBatchModal';
import { StatsModal } from './components/StatsModal';
import { GitHubGuideModal } from './components/GitHubGuideModal';
import { GlasNumber, QuizStats, VoiceType } from './types/chant';
import { audioManager } from './services/audioManager';

const STATS_STORAGE_KEY = 'zapevy_trainer_stats_v1';
const THEME_STORAGE_KEY = 'zapevy_theme_v1';

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

export default function App() {
  const [activeTab, setActiveTab] = useState<'trainer' | 'study'>('trainer');
  const [studyGlas, setStudyGlas] = useState<GlasNumber>(1);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
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

  // Sync dark mode class with <html>
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

  const handleResetStats = () => {
    setStats(defaultStats);
    try {
      localStorage.removeItem(STATS_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleOpenStudyGlas = (glas: GlasNumber) => {
    setStudyGlas(glas);
    setActiveTab('study');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-900">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAudioModal={() => setIsAudioModalOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        streakCount={stats.currentStreak}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Tab Content */}
        {activeTab === 'trainer' ? (
          <TrainerTab
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onOpenStudyGlas={handleOpenStudyGlas}
            onOpenAudioModal={() => setIsAudioModalOpen(true)}
          />
        ) : (
          <StudyTab
            initialGlas={studyGlas}
            onStartTrainingWithVoice={(voice) => {
              setActiveTab('trainer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-ecclesiastical text-sm text-slate-700 dark:text-slate-300">
            «Пойте Богу нашему, пойте, пойте Цареви нашему, пойте» (Пс. 46:7)
          </p>
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsGitHubModalOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Инструкция GitHub
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsAudioModalOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Статус 40 аудиофайлов
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AudioBatchModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={stats}
        onResetStats={handleResetStats}
      />

      <GitHubGuideModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

    </div>
  );
}
