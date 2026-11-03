/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Volume2,
  Users,
  Check,
  X,
  ArrowRight,
  Flame,
  CheckCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { audioManager, PlayerState } from '../services/audioManager';
import { GLAS_LIST, VOICE_LABELS } from '../data/glasData';
import { GlasNumber, MasteredByVoice, QuizQuestion, QuizStats, VoiceFilter, VoiceType } from '../types/chant';

interface TrainerTabProps {
  stats: QuizStats;
  onUpdateStats: (newStats: QuizStats) => void;
  masteredByVoice: MasteredByVoice;
  onUpdateMastered: (newMastered: MasteredByVoice) => void;
}

export const TrainerTab: React.FC<TrainerTabProps> = ({
  stats,
  onUpdateStats,
  masteredByVoice,
  onUpdateMastered,
}) => {
  const [selectedVoiceFilter, setSelectedVoiceFilter] = useState<VoiceFilter>('ANY');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(audioManager.getState());
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<GlasNumber | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  
  // Track glas remaining in current non-repeating 8-glas cycle
  const [roundPool, setRoundPool] = useState<GlasNumber[]>([]);
  const [showMasteredList, setShowMasteredList] = useState(false);

  useEffect(() => {
    return audioManager.subscribe((st) => {
      setPlayerState(st);
    });
  }, []);

  // Compute available unmastered glas for the currently selected voice filter
  const getAvailableGlasForVoice = useCallback((voice: 'S' | 'A' | 'T' | 'B'): GlasNumber[] => {
    const mastered = masteredByVoice[voice] || [];
    return GLAS_LIST.filter((g) => !mastered.includes(g));
  }, [masteredByVoice]);

  // All available options for the active filter
  const availablePoolForFilter = useMemo(() => {
    if (selectedVoiceFilter === 'ANY') {
      // Any glas that is not mastered in ALL voices
      const allActiveVoices: Array<'S' | 'A' | 'T' | 'B'> = ['S', 'A', 'T', 'B'];
      const candidates: GlasNumber[] = [];
      for (const g of GLAS_LIST) {
        const hasUnmasteredVoice = allActiveVoices.some(
          (v) => !(masteredByVoice[v] || []).includes(g)
        );
        if (hasUnmasteredVoice) {
          candidates.push(g);
        }
      }
      return candidates;
    } else {
      return getAvailableGlasForVoice(selectedVoiceFilter);
    }
  }, [selectedVoiceFilter, masteredByVoice, getAvailableGlasForVoice]);

  // Next question generator with non-repeating cycle
  const pickNextQuestion = useCallback((currentPool: GlasNumber[], filter: VoiceFilter) => {
    const validVoices: Array<'S' | 'A' | 'T' | 'B'> =
      filter === 'ANY' ? ['S', 'A', 'T', 'B'] : [filter];

    // Determine candidate pool
    let activePool = currentPool;
    const baseAvailable = filter === 'ANY'
      ? GLAS_LIST.filter(g => validVoices.some(v => !(masteredByVoice[v] || []).includes(g)))
      : GLAS_LIST.filter(g => !(masteredByVoice[filter] || []).includes(g));

    if (baseAvailable.length === 0) {
      setCurrentQuestion(null);
      return;
    }

    if (activePool.length === 0) {
      // Refill pool for new cycle
      activePool = [...baseAvailable];
    }

    // Pick a random glas from the remaining pool
    const randomIndex = Math.floor(Math.random() * activePool.length);
    const chosenGlas = activePool[randomIndex];
    const newPool = activePool.filter((_, idx) => idx !== randomIndex);

    // Pick a voice that hasn't mastered this glas
    const unmasteredVoices = validVoices.filter(
      (v) => !(masteredByVoice[v] || []).includes(chosenGlas)
    );
    const chosenVoice =
      unmasteredVoices.length > 0
        ? unmasteredVoices[Math.floor(Math.random() * unmasteredVoices.length)]
        : validVoices[Math.floor(Math.random() * validVoices.length)];

    setRoundPool(newPool);

    const question: QuizQuestion = {
      id: `${Date.now()}-${Math.random()}`,
      glas: chosenGlas,
      voice: chosenVoice,
      selectedVoiceFilter: filter,
      audioFilename: `${chosenVoice}-${chosenGlas}.mp3`,
      allVoiceFilename: `ALL-${chosenGlas}.mp3`,
    };

    setCurrentQuestion(question);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setFeedback(null);

    // Start playback
    audioManager.play(question.voice, question.glas);
  }, [masteredByVoice]);

  // Start question on mount or when filter changes
  useEffect(() => {
    pickNextQuestion([], selectedVoiceFilter);
  }, [selectedVoiceFilter, pickNextQuestion]);

  const handleNextQuestion = () => {
    pickNextQuestion(roundPool, selectedVoiceFilter);
  };

  const handleReplay = () => {
    if (!currentQuestion) return;
    audioManager.play(currentQuestion.voice, currentQuestion.glas);
  };

  const handlePlayAllVoices = () => {
    if (!currentQuestion) return;
    audioManager.play('ALL', currentQuestion.glas);
  };

  // Mark current glas as "Знаю!"
  const handleMarkAsKnown = () => {
    if (!currentQuestion) return;
    const voice = currentQuestion.voice;
    const glas = currentQuestion.glas;

    const currentList = masteredByVoice[voice] || [];
    if (!currentList.includes(glas)) {
      const updatedList = [...currentList, glas];
      const updatedMastered = {
        ...masteredByVoice,
        [voice]: updatedList,
      };
      onUpdateMastered(updatedMastered);
    }

    // Move to next question right away
    handleNextQuestion();
  };

  // Reset mastered glas for current voice
  const handleResetMastered = (voice?: 'S' | 'A' | 'T' | 'B') => {
    if (voice) {
      const updated = { ...masteredByVoice, [voice]: [] };
      onUpdateMastered(updated);
    } else {
      onUpdateMastered({ S: [], A: [], T: [], B: [] });
    }
    setRoundPool([]);
    setTimeout(() => pickNextQuestion([], selectedVoiceFilter), 50);
  };

  // Handle user answer
  const handleSelectGlas = (glas: GlasNumber) => {
    if (!currentQuestion || isAnswered) return;

    const isCorrect = glas === currentQuestion.glas;
    setSelectedAnswer(glas);
    setIsAnswered(true);

    const voice = currentQuestion.voice;
    const currentGlasStat = stats.glasStats[currentQuestion.glas] || { attempts: 0, correct: 0 };
    const currentVoiceStat = stats.voiceStats[voice] || { attempts: 0, correct: 0 };

    const newStreak = isCorrect ? stats.currentStreak + 1 : 0;
    const newBestStreak = Math.max(stats.bestStreak, newStreak);

    const newStats: QuizStats = {
      ...stats,
      totalQuestions: stats.totalQuestions + 1,
      correctAnswers: stats.correctAnswers + (isCorrect ? 1 : 0),
      incorrectAnswers: stats.incorrectAnswers + (isCorrect ? 0 : 1),
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      glasStats: {
        ...stats.glasStats,
        [currentQuestion.glas]: {
          attempts: currentGlasStat.attempts + 1,
          correct: currentGlasStat.correct + (isCorrect ? 1 : 0),
        },
      },
      voiceStats: {
        ...stats.voiceStats,
        [voice]: {
          attempts: currentVoiceStat.attempts + 1,
          correct: currentVoiceStat.correct + (isCorrect ? 1 : 0),
        },
      },
      history: [
        {
          id: currentQuestion.id,
          timestamp: Date.now(),
          glas: currentQuestion.glas,
          voice: currentQuestion.voice,
          userAnswer: glas,
          isCorrect,
        },
        ...stats.history.slice(0, 49),
      ],
    };

    onUpdateStats(newStats);

    if (isCorrect) {
      setFeedback({
        isCorrect: true,
        message: `Верно! Это Глас ${currentQuestion.glas}.`,
      });
    } else {
      setFeedback({
        isCorrect: false,
        message: `Ошибка. Это Глас ${currentQuestion.glas}.`,
      });
    }
  };

  const totalMasteredCurrentVoice = useMemo(() => {
    if (selectedVoiceFilter === 'ANY') {
      const all = new Set<string>();
      (['S', 'A', 'T', 'B'] as const).forEach((v) => {
        (masteredByVoice[v] || []).forEach((g) => all.add(`${v}-${g}`));
      });
      return all.size; // out of 32
    } else {
      return (masteredByVoice[selectedVoiceFilter] || []).length; // out of 8
    }
  }, [selectedVoiceFilter, masteredByVoice]);

  const maxTotalForFilter = selectedVoiceFilter === 'ANY' ? 32 : 8;
  const allMastered = availablePoolForFilter.length === 0;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      
      {/* Prominent Canonical Zapev Text */}
      <div className="bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/30 dark:border-amber-400/20 rounded-2xl py-3 px-4 text-center shadow-xs">
        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
          Запев стихиры:
        </span>
        <p className="text-xl sm:text-2xl font-bold font-ecclesiastical text-slate-900 dark:text-slate-100 tracking-wide">
          «Испове́датися И́мени Твоему́»
        </p>
      </div>

      {/* Voice Part Selector (Mobile-friendly segmented pills) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span className="font-medium">Партия:</span>
          {/* Mastered count badge */}
          <button
            onClick={() => setShowMasteredList(!showMasteredList)}
            className="text-[11px] text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Изучено: {totalMasteredCurrentVoice}/{maxTotalForFilter}</span>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-xs">
          <button
            onClick={() => setSelectedVoiceFilter('ANY')}
            className={`py-2 px-1 rounded-lg font-medium transition-all ${
              selectedVoiceFilter === 'ANY'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Любая
          </button>
          {(['S', 'A', 'T', 'B'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setSelectedVoiceFilter(v)}
              className={`py-2 px-1 rounded-lg font-medium transition-all ${
                selectedVoiceFilter === v
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {VOICE_LABELS[v].short}
            </button>
          ))}
        </div>

        {/* Mastered Quick Drawer */}
        {showMasteredList && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Изученные гласы:
              </span>
              <button
                onClick={() => handleResetMastered(selectedVoiceFilter === 'ANY' ? undefined : selectedVoiceFilter)}
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Сбросить</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedVoiceFilter !== 'ANY' ? (
                (masteredByVoice[selectedVoiceFilter] || []).length > 0 ? (
                  (masteredByVoice[selectedVoiceFilter] || []).map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-md font-mono text-[11px]"
                    >
                      Глас {g}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">Пока нет изученных гласов</span>
                )
              ) : (
                (['S', 'A', 'T', 'B'] as const).map((v) => {
                  const list = masteredByVoice[v] || [];
                  if (list.length === 0) return null;
                  return (
                    <span
                      key={v}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[11px]"
                    >
                      {v}: {list.join(', ')}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Screen when all glas for this voice are marked as known */}
      {allMastered ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold font-ecclesiastical text-slate-900 dark:text-slate-100">
            Все гласы изучены!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Вы отметили все доступные гласы кнопкой «Знаю!». Чтобы повторить их заново, нажмите кнопку ниже:
          </p>
          <button
            onClick={() => handleResetMastered(selectedVoiceFilter === 'ANY' ? undefined : selectedVoiceFilter)}
            className="px-5 py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all shadow-md"
          >
            Сбросить и начать заново
          </button>
        </div>
      ) : (
        <>
          {/* Main Audio Player Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 text-center shadow-xs space-y-4">
            
            {/* Voice Info & Cycle counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {currentQuestion
                  ? `Партия: ${VOICE_LABELS[currentQuestion.voice].full} (${currentQuestion.voice})`
                  : ''}
              </span>
              <span className="font-mono text-[11px] tabular-nums">
                В цикле осталось: {roundPool.length + 1}
              </span>
            </div>

            {/* Play Button */}
            <div className="py-2 flex flex-col items-center justify-center">
              <button
                onClick={handleReplay}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-md ${
                  playerState.isPlaying
                    ? 'bg-amber-600 text-white ring-8 ring-amber-500/20 animate-pulse'
                    : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:scale-105'
                }`}
                aria-label={playerState.isPlaying ? 'Звучит запев' : 'Воспроизвести'}
              >
                {playerState.isPlaying ? (
                  <Volume2 className="w-10 h-10 animate-bounce" />
                ) : (
                  <Play className="w-10 h-10 fill-current translate-x-0.5" />
                )}
              </button>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2.5">
                {playerState.isPlaying ? 'Звучит запев...' : 'Слушать запев'}
              </p>
            </div>

            {/* "Знаю!" Button (Quick Skip) */}
            <div className="flex justify-center pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleMarkAsKnown}
                disabled={!currentQuestion}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 rounded-xl transition-all active:scale-95"
                title="Отметить этот глас как хорошо известный, чтобы больше не тренировать его"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Знаю! Больше не спрашивать</span>
              </button>
            </div>

          </div>

          {/* 8 Big Glas Action Buttons */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
              Выберите глас:
            </span>

            <div className="grid grid-cols-4 gap-2">
              {GLAS_LIST.map((glas) => {
                const isSelected = selectedAnswer === glas;
                const isCorrectTarget = currentQuestion?.glas === glas;

                let btnStyle =
                  'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 active:scale-95';

                if (isAnswered) {
                  if (isCorrectTarget) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20';
                  } else if (isSelected && !isCorrectTarget) {
                    btnStyle = 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20';
                  } else {
                    btnStyle = 'opacity-35 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400';
                  }
                }

                return (
                  <button
                    key={glas}
                    disabled={isAnswered}
                    onClick={() => handleSelectGlas(glas)}
                    className={`h-16 rounded-2xl border text-center transition-all flex flex-col items-center justify-center p-1 shadow-xs ${btnStyle}`}
                  >
                    <span className="text-[10px] uppercase opacity-70 leading-none">
                      Глас
                    </span>
                    <span className="text-2xl font-bold font-ecclesiastical leading-none mt-1">
                      {glas}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Answer Feedback & Actions */}
          {isAnswered && feedback && (
            <div
              className={`rounded-2xl p-4 border transition-all space-y-3 ${
                feedback.isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.isCorrect ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <X className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
                <span className="text-base font-bold font-ecclesiastical text-slate-900 dark:text-slate-100">
                  {feedback.message}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {/* Play Full Choir (ALL-N.mp3) */}
                <button
                  onClick={handlePlayAllVoices}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>Прослушать всеми партиями (весь хор)</span>
                </button>

                {/* Next Question */}
                <button
                  onClick={handleNextQuestion}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap active:scale-95"
                >
                  <span>Следующий запев</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Compact Mobile Scoreboard Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex items-center justify-around text-center text-xs">
        <div>
          <span className="text-[11px] text-slate-500 block">Правильно</span>
          <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {stats.correctAnswers}
          </span>
        </div>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
        <div>
          <span className="text-[11px] text-slate-500 block">Ошибок</span>
          <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
            {stats.incorrectAnswers}
          </span>
        </div>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
        <div className="flex flex-col items-center">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>Серия</span>
          </span>
          <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
            {stats.currentStreak}
          </span>
        </div>
      </div>

    </div>
  );
};
