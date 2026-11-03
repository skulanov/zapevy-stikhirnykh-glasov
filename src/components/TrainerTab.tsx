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

    let activePool = currentPool;
    const baseAvailable = filter === 'ANY'
      ? GLAS_LIST.filter(g => validVoices.some(v => !(masteredByVoice[v] || []).includes(g)))
      : GLAS_LIST.filter(g => !(masteredByVoice[filter] || []).includes(g));

    if (baseAvailable.length === 0) {
      setCurrentQuestion(null);
      return;
    }

    if (activePool.length === 0) {
      activePool = [...baseAvailable];
    }

    const randomIndex = Math.floor(Math.random() * activePool.length);
    const chosenGlas = activePool[randomIndex];
    const newPool = activePool.filter((_, idx) => idx !== randomIndex);

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
  }, [masteredByVoice]);

  // Stop audio when unmounting
  useEffect(() => {
    return () => {
      audioManager.stop();
    };
  }, []);

  useEffect(() => {
    pickNextQuestion([], selectedVoiceFilter);
  }, [selectedVoiceFilter, pickNextQuestion]);

  const handleNextQuestion = () => {
    audioManager.stop();
    pickNextQuestion(roundPool, selectedVoiceFilter);
  };

  const handlePlayToggle = () => {
    if (!currentQuestion) return;
    if (
      playerState.isPlaying &&
      playerState.currentVoice === currentQuestion.voice &&
      playerState.currentGlas === currentQuestion.glas
    ) {
      audioManager.stop();
    } else {
      audioManager.play(currentQuestion.voice, currentQuestion.glas);
    }
  };

  const handlePlayAllVoices = () => {
    if (!currentQuestion) return;
    audioManager.play('ALL', currentQuestion.glas);
  };

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

    handleNextQuestion();
  };

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
      return all.size;
    } else {
      return (masteredByVoice[selectedVoiceFilter] || []).length;
    }
  }, [selectedVoiceFilter, masteredByVoice]);

  const maxTotalForFilter = selectedVoiceFilter === 'ANY' ? 32 : 8;
  const allMastered = availablePoolForFilter.length === 0;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      
      {/* Canonical Zapev Text (transparent container) */}
      <div className="py-2 px-4 text-center">
        <p className="text-2xl sm:text-3xl font-bold font-ecclesiastical text-stone-900 dark:text-stone-100 tracking-wide leading-tight">
          «Испове́датися И́мени Твоему́»
        </p>
      </div>

      {/* Voice Part Selector with Full Words */}
      <div className="bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-2.5 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
          <span className="font-medium">Партия:</span>
          
          {/* Mastered count badge: black text in light theme, #E9DC00 in dark theme */}
          <button
            onClick={() => setShowMasteredList(!showMasteredList)}
            className="text-[11px] font-semibold hover:underline flex items-center gap-1.5 px-1 py-0.5 rounded text-stone-950 dark:text-[#E9DC00]"
          >
            <CheckCircle className="w-3.5 h-3.5 text-stone-950 dark:text-[#E9DC00]" />
            <span>Изучено: {totalMasteredCurrentVoice}/{maxTotalForFilter}</span>
          </button>
        </div>

        {/* 5 full-word buttons with #E9DC00 on active */}
        <div className="grid grid-cols-5 gap-1 p-1 bg-stone-100/80 dark:bg-stone-800/80 rounded-xl text-center text-xs">
          <button
            onClick={() => setSelectedVoiceFilter('ANY')}
            className={`py-2 px-1 rounded-lg font-medium transition-all ${
              selectedVoiceFilter === 'ANY'
                ? 'shadow-xs font-bold text-stone-950'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
            style={selectedVoiceFilter === 'ANY' ? { backgroundColor: '#E9DC00' } : undefined}
          >
            Любая
          </button>
          <button
            onClick={() => setSelectedVoiceFilter('S')}
            className={`py-2 px-1 rounded-lg font-medium transition-all ${
              selectedVoiceFilter === 'S'
                ? 'shadow-xs font-bold text-stone-950'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
            style={selectedVoiceFilter === 'S' ? { backgroundColor: '#E9DC00' } : undefined}
          >
            Сопрано
          </button>
          <button
            onClick={() => setSelectedVoiceFilter('A')}
            className={`py-2 px-1 rounded-lg font-medium transition-all ${
              selectedVoiceFilter === 'A'
                ? 'shadow-xs font-bold text-stone-950'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
            style={selectedVoiceFilter === 'A' ? { backgroundColor: '#E9DC00' } : undefined}
          >
            Альт
          </button>
          <button
            onClick={() => setSelectedVoiceFilter('T')}
            className={`py-2 px-1 rounded-lg font-medium transition-all ${
              selectedVoiceFilter === 'T'
                ? 'shadow-xs font-bold text-stone-950'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
            style={selectedVoiceFilter === 'T' ? { backgroundColor: '#E9DC00' } : undefined}
          >
            Тенор
          </button>
          <button
            onClick={() => setSelectedVoiceFilter('B')}
            className={`py-2 px-1 rounded-lg font-medium transition-all ${
              selectedVoiceFilter === 'B'
                ? 'shadow-xs font-bold text-stone-950'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
            style={selectedVoiceFilter === 'B' ? { backgroundColor: '#E9DC00' } : undefined}
          >
            Бас
          </button>
        </div>

        {/* Mastered Quick Drawer */}
        {showMasteredList && (
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-700 dark:text-stone-300">
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
                      className="px-2 py-0.5 border text-stone-900 dark:text-stone-100 rounded-md font-mono text-[11px] font-semibold bg-[#AFE800]/15 dark:bg-[#AFE800]/10 border-[#AFE800]/60"
                    >
                      Глас {g}
                    </span>
                  ))
                ) : (
                  <span className="text-stone-400 italic">Пока нет изученных гласов</span>
                )
              ) : (
                (['S', 'A', 'T', 'B'] as const).map((v) => {
                  const list = masteredByVoice[v] || [];
                  if (list.length === 0) return null;
                  return (
                    <span
                      key={v}
                      className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-md text-[11px]"
                    >
                      {VOICE_LABELS[v].short}: {list.join(', ')}
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
        <div className="bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 rounded-3xl p-8 text-center space-y-4 shadow-xs">
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-stone-950 border-2"
            style={{ backgroundColor: 'rgba(175, 232, 0, 0.75)', borderColor: '#AFE800' }}
          >
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold font-ecclesiastical text-stone-900 dark:text-stone-100">
            Все гласы изучены!
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Вы отметили все доступные гласы кнопкой «Знаю!». Чтобы повторить их заново, нажмите кнопку ниже:
          </p>
          <button
            onClick={() => handleResetMastered(selectedVoiceFilter === 'ANY' ? undefined : selectedVoiceFilter)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-stone-950 transition-all shadow-md hover:brightness-95 active:scale-95"
            style={{ backgroundColor: '#E9DC00' }}
          >
            Сбросить и начать заново
          </button>
        </div>
      ) : (
        <>
          {/* Main Audio Player Card */}
          <div className="bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 rounded-3xl p-5 text-center shadow-xs space-y-4">
            
            {/* Voice Info & Cycle counter */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {currentQuestion
                  ? `Партия: ${VOICE_LABELS[currentQuestion.voice].full}`
                  : ''}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-stone-400">
                В круге: {roundPool.length + 1}
              </span>
            </div>

            {/* Play Button colored with #E9DC00 */}
            <div className="py-2 flex flex-col items-center justify-center">
              <button
                onClick={handlePlayToggle}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-md text-stone-950 ${
                  playerState.isPlaying
                    ? 'ring-8 ring-[#E9DC00]/30 animate-pulse'
                    : 'hover:brightness-95 hover:scale-105'
                }`}
                style={{ backgroundColor: '#E9DC00' }}
                aria-label={playerState.isPlaying ? 'Звучит запев' : 'Воспроизвести'}
              >
                {playerState.isPlaying ? (
                  <Volume2 className="w-10 h-10 animate-bounce" />
                ) : (
                  <Play className="w-10 h-10 fill-current translate-x-0.5" />
                )}
              </button>
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-2.5">
                {playerState.isPlaying ? 'Звучит запев...' : 'Слушать запев'}
              </p>
            </div>

            {/* "Знаю! Больше не спрашивать" Button with same fill as "Верно!" field */}
            <div className="flex justify-center pt-1 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={handleMarkAsKnown}
                disabled={!currentQuestion}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs hover:bg-[#AFE800]/25 active:scale-95 border border-[#AFE800] bg-[#AFE800]/15 dark:bg-[#AFE800]/10 text-stone-900 dark:text-stone-100"
                title="Отметить этот глас как хорошо известный, чтобы больше не тренировать его"
              >
                <CheckCircle className="w-4 h-4 text-stone-900 dark:text-[#AFE800]" />
                <span>Знаю! Больше не спрашивать</span>
              </button>
            </div>

          </div>

          {/* 8 Big Glas Action Buttons */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-stone-600 dark:text-stone-400 px-1">
              Выберите глас:
            </span>

            <div className="grid grid-cols-4 gap-2">
              {GLAS_LIST.map((glas) => {
                const isSelected = selectedAnswer === glas;
                const isCorrectTarget = currentQuestion?.glas === glas;

                let customStyle: React.CSSProperties | undefined = undefined;
                let btnClass =
                  'bg-white dark:bg-stone-900/90 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-[#E9DC00] hover:bg-[#E9DC00]/10 active:scale-95';

                if (isAnswered) {
                  if (isCorrectTarget) {
                    customStyle = { backgroundColor: '#AFE800', borderColor: '#AFE800' };
                    btnClass = 'text-stone-950 shadow-md ring-2 ring-[#AFE800]/40 font-bold';
                  } else if (isSelected && !isCorrectTarget) {
                    btnClass = 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20';
                  } else {
                    btnClass = 'opacity-35 bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-400';
                  }
                }

                return (
                  <button
                    key={glas}
                    disabled={isAnswered}
                    onClick={() => handleSelectGlas(glas)}
                    className={`h-16 rounded-2xl border text-center transition-all flex flex-col items-center justify-center p-1 shadow-xs ${btnClass}`}
                    style={customStyle}
                  >
                    <span className="text-[10px] uppercase opacity-75 leading-none">
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
                  ? 'bg-[#AFE800]/15 dark:bg-[#AFE800]/10 border-[#AFE800]/50'
                  : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.isCorrect ? (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-stone-950"
                    style={{ backgroundColor: '#AFE800' }}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <X className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
                <span className="text-base font-bold font-ecclesiastical text-stone-900 dark:text-stone-100">
                  {feedback.message}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={handlePlayAllVoices}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap active:scale-95"
                >
                  <Users className="w-4 h-4" />
                  <span>Прослушать всеми партиями (весь хор)</span>
                </button>

                <button
                  onClick={handleNextQuestion}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-stone-950 shadow-xs transition-all whitespace-nowrap hover:brightness-95 active:scale-95"
                  style={{ backgroundColor: '#E9DC00' }}
                >
                  <span>Следующий запев</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Compact Mobile Scoreboard Bar with #AFE800 for correct answers digits */}
      <div className="bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-3 shadow-xs flex items-center justify-around text-center text-xs">
        <div>
          <span className="text-[11px] text-stone-500 block">Правильно</span>
          <span
            className="text-lg font-bold font-mono tabular-nums inline-block mt-0.5"
            style={{ color: '#AFE800' }}
          >
            {stats.correctAnswers}
          </span>
        </div>
        <div className="h-6 w-px bg-stone-200 dark:bg-stone-800" />
        <div>
          <span className="text-[11px] text-stone-500 block">Ошибок</span>
          <span className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums inline-block mt-0.5">
            {stats.incorrectAnswers}
          </span>
        </div>
        <div className="h-6 w-px bg-stone-200 dark:bg-stone-800" />
        <div className="flex flex-col items-center">
          <span className="text-[11px] text-stone-500 flex items-center gap-1">
            <Flame className="w-3 h-3 text-[#E9DC00]" />
            <span>Серия</span>
          </span>
          <span className="text-lg font-bold font-mono text-stone-800 dark:text-stone-200 tabular-nums inline-block mt-0.5">
            {stats.currentStreak}
          </span>
        </div>
      </div>

    </div>
  );
};
