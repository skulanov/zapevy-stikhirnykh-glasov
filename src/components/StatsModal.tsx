/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Award, RotateCcw, Check, Flame, BarChart3, Clock } from 'lucide-react';
import { QuizStats, GlasNumber } from '../types/chant';
import { GLAS_LIST, VOICE_LABELS } from '../data/glasData';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: QuizStats;
  onResetStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onResetStats,
}) => {
  if (!isOpen) return null;

  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-bold font-ecclesiastical text-slate-900 dark:text-slate-100">
              Статистика тренировок
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                Вопросов
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                {stats.totalQuestions}
              </span>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center border border-emerald-100 dark:border-emerald-800/40">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Точность
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 tabular-nums">
                {accuracy}%
              </span>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-center border border-amber-100 dark:border-amber-800/40">
              <span className="text-[11px] text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Серия сейчас
              </span>
              <span className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300 tabular-nums">
                {stats.currentStreak}
              </span>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-center border border-purple-100 dark:border-purple-800/40">
              <span className="text-[11px] text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                Рекорд серии
              </span>
              <span className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-300 tabular-nums">
                {stats.bestStreak}
              </span>
            </div>
          </div>

          {/* Glas breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
              Точность по 8 гласам
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {GLAS_LIST.map((g) => {
                const s = stats.glasStats[g] || { attempts: 0, correct: 0 };
                const pct = s.attempts > 0 ? Math.round((s.correct / s.attempts) * 100) : 0;
                return (
                  <div
                    key={g}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Глас {g}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                        {s.correct}/{s.attempts}
                      </span>
                      <span
                        className={`font-semibold font-mono tabular-nums px-1.5 py-0.5 rounded text-[11px] ${
                          s.attempts === 0
                            ? 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                            : pct >= 80
                            ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {s.attempts === 0 ? '—' : `${pct}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
              Точность по голосам
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {(['S', 'A', 'T', 'B'] as const).map((v) => {
                const s = stats.voiceStats[v] || { attempts: 0, correct: 0 };
                const pct = s.attempts > 0 ? Math.round((s.correct / s.attempts) * 100) : 0;
                return (
                  <div
                    key={v}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-center"
                  >
                    <span className="font-semibold block text-slate-800 dark:text-slate-200">
                      {VOICE_LABELS[v].full} ({v})
                    </span>
                    <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 block my-0.5 tabular-nums">
                      {s.attempts === 0 ? '—' : `${pct}%`}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {s.correct} из {s.attempts}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Answers Log */}
          {stats.history.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                Последние ответы ({stats.history.length})
              </h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {stats.history.map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Глас {item.glas} ({VOICE_LABELS[item.voice].short})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        {item.isCorrect ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Верно</span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400">
                            Выбран Глас {item.userAnswer}
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Сбросить всю статистику ответов?')) {
                onResetStats();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить статистику</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
