/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Check,
  X,
  Volume2,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Flame,
  HelpCircle,
  BookOpen,
  Settings2
} from 'lucide-react';
import { audioManager, PlayerState } from '../services/audioManager';
import { GLAS_DATA, GLAS_LIST, VOICE_LABELS } from '../data/glasData';
import { GlasNumber, QuizQuestion, QuizStats, VoiceFilter, VoiceType } from '../types/chant';

interface TrainerTabProps {
  stats: QuizStats;
  onUpdateStats: (newStats: QuizStats) => void;
  onOpenStudyGlas: (glas: GlasNumber) => void;
  onOpenAudioModal: () => void;
}

export const TrainerTab: React.FC<TrainerTabProps> = ({
  stats,
  onUpdateStats,
  onOpenStudyGlas,
  onOpenAudioModal,
}) => {
  const [selectedVoiceFilter, setSelectedVoiceFilter] = useState<VoiceFilter>('ANY');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(audioManager.getState());
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [showVoiceHint, setShowVoiceHint] = useState(true);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<GlasNumber | null>(null);
  const [lastFeedback, setLastFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);

  // Subscribe to audio manager state
  useEffect(() => {
    return audioManager.subscribe((st) => {
      setPlayerState(st);
    });
  }, []);

  // Generate a new random question
  const generateNewQuestion = useCallback((filter: VoiceFilter): QuizQuestion => {
    const validVoices: Array<'S' | 'A' | 'T' | 'B'> =
      filter === 'ANY' ? ['S', 'A', 'T', 'B'] : [filter];
    const randomVoice = validVoices[Math.floor(Math.random() * validVoices.length)];
    const randomGlas = GLAS_LIST[Math.floor(Math.random() * GLAS_LIST.length)];

    return {
      id: `${Date.now()}-${Math.random()}`,
      glas: randomGlas,
      voice: randomVoice,
      selectedVoiceFilter: filter,
      audioFilename: `${randomVoice}-${randomGlas}.mp3`,
      allVoiceFilename: `ALL-${randomGlas}.mp3`,
    };
  }, []);

  // Start question or next
  const startNextQuestion = useCallback((filter = selectedVoiceFilter) => {
    if (autoAdvanceTimerRef.current !== null) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    const q = generateNewQuestion(filter);
    setCurrentQuestion(q);
    setIsAnswered(false);
    setSelectedAnswer(null);
    setLastFeedback(null);

    // Play sound for the new question
    audioManager.play(q.voice, q.glas);
  }, [generateNewQuestion, selectedVoiceFilter]);

  // Initial setup on mount
  useEffect(() => {
    if (!currentQuestion) {
      startNextQuestion();
    }
  }, [currentQuestion, startNextQuestion]);

  // Change voice filter
  const handleVoiceFilterChange = (filter: VoiceFilter) => {
    setSelectedVoiceFilter(filter);
    startNextQuestion(filter);
  };

  // Replay current clip
  const handleReplay = () => {
    if (!currentQuestion) return;
    audioManager.play(currentQuestion.voice, currentQuestion.glas);
  };

  // Play full choir version for comparison
  const handlePlayAllVoices = () => {
    if (!currentQuestion) return;
    audioManager.play('ALL', currentQuestion.glas);
  };

  // Handle user's answer click
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
      setLastFeedback({
        isCorrect: true,
        message: `Верно! Это ${GLAS_DATA[currentQuestion.glas].title}.`,
      });
    } else {
      setLastFeedback({
        isCorrect: false,
        message: `Ошибка. Вы выбрали Глас ${glas}, но это ${GLAS_DATA[currentQuestion.glas].title}.`,
      });
    }

    if (autoAdvance) {
      autoAdvanceTimerRef.current = window.setTimeout(() => {
        startNextQuestion();
      }, 3500);
    }
  };

  // Keyboard shortcut listener (Keys 1-8 for glas, Space for replay, Enter for next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 8) {
        e.preventDefault();
        handleSelectGlas(num as GlasNumber);
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (isAnswered) {
          startNextQuestion();
        } else {
          handleReplay();
        }
      } else if (e.code === 'Enter') {
        e.preventDefault();
        startNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const accuracy =
    stats.totalQuestions > 0
      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
      : 0;

  const currentGlasData = currentQuestion ? GLAS_DATA[currentQuestion.glas] : null;

  return (
    <div className="space-y-6">
      
      {/* Voice Mode Selector & Settings Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Voice Part Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Партия для тренировки:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => handleVoiceFilterChange('ANY')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                  selectedVoiceFilter === 'ANY'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Все партии (случайно)
              </button>
              {(['S', 'A', 'T', 'B'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => handleVoiceFilterChange(v)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                    selectedVoiceFilter === v
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {VOICE_LABELS[v].full} ({v})
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Controls & Shortcuts */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={() => setAutoAdvance(!autoAdvance)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                autoAdvance
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Автоматический переход к следующему вопросу через 3 секунды"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Авто-переход</span>
            </button>

            <button
              onClick={() => setShowVoiceHint(!showVoiceHint)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
                showVoiceHint
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                  : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
              title="Показывать название звучащей партии"
            >
              {showVoiceHint ? 'Подсказка партии: Вкл' : 'Подсказка: Скрыта'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Player & 8-Glas Choice Buttons */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Audio Playback Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-xs">
            
            {/* Top metadata indicators */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-6">
              <div className="flex items-center gap-2">
                {currentQuestion && showVoiceHint && (
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Звучит партия: <strong className="text-slate-900 dark:text-white">{VOICE_LABELS[currentQuestion.voice].full}</strong> ({currentQuestion.voice})
                  </span>
                )}
                {currentQuestion && !showVoiceHint && (
                  <span className="italic text-slate-400">Партия скрыта (сложный режим)</span>
                )}
              </div>

              {/* Source indicator */}
              <div className="flex items-center gap-1.5">
                {playerState.sourceType === 'synth' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Синтезатор обихода
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Файл {currentQuestion?.audioFilename}
                  </span>
                )}
              </div>
            </div>

            {/* Central Play/Replay Sphere */}
            <div className="my-6 flex flex-col items-center justify-center">
              <button
                onClick={handleReplay}
                className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-lg ${
                  playerState.isPlaying
                    ? 'bg-amber-600 text-white shadow-amber-500/25 ring-8 ring-amber-500/15 animate-pulse'
                    : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-slate-900/10 hover:scale-105'
                }`}
                title="Воспроизвести запев (Пробел)"
              >
                {playerState.isPlaying ? (
                  <Volume2 className="w-10 h-10 animate-bounce" />
                ) : (
                  <Play className="w-10 h-10 fill-current translate-x-0.5" />
                )}
              </button>

              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {playerState.isPlaying ? 'Звучит запев...' : 'Слушать запев'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Клавиша: <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono">Пробел</kbd>
                </p>
              </div>

              {/* Sound Wave Animation Visualizer */}
              <div className="flex items-center justify-center gap-1.5 mt-5 h-8">
                {[40, 75, 55, 90, 60, 100, 70, 85, 45, 95, 65, 80, 50].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      height: playerState.isPlaying ? `${h}%` : '20%',
                      transition: 'height 0.15s ease',
                    }}
                    className={`w-1 rounded-full ${
                      playerState.isPlaying
                        ? 'bg-amber-500 dark:bg-amber-400'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Playback Speed Switcher */}
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400">Скорость:</span>
              {[0.75, 1.0, 1.25].map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    audioManager.setSpeed(speed);
                    handleReplay();
                  }}
                  className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                    playerState.playbackRate === speed
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-medium'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Glas Selection Title */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-ecclesiastical text-slate-900 dark:text-slate-100">
                Определите глас (1–8):
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Нажмите кнопку или используйте цифры 1–8 на клавиатуре
              </p>
            </div>

            {isAnswered && (
              <button
                onClick={() => startNextQuestion()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                <span>Следующий запев</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 8 Big Glas Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {GLAS_LIST.map((glas) => {
              const isSelected = selectedAnswer === glas;
              const isCorrectTarget = currentQuestion?.glas === glas;

              let btnStyle =
                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-md';

              if (isAnswered) {
                if (isCorrectTarget) {
                  // Correct answer: always bright green highlight!
                  btnStyle =
                    'bg-emerald-600 text-white border-emerald-600 ring-4 ring-emerald-500/20 shadow-lg';
                } else if (isSelected && !isCorrectTarget) {
                  // Chosen wrong answer: red highlight!
                  btnStyle =
                    'bg-rose-600 text-white border-rose-600 ring-4 ring-rose-500/20 shadow-lg';
                } else {
                  // Other unselected answers
                  btnStyle = 'opacity-40 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400';
                }
              }

              return (
                <button
                  key={glas}
                  disabled={isAnswered}
                  onClick={() => handleSelectGlas(glas)}
                  className={`relative p-4 sm:p-5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 group active:scale-95 ${btnStyle}`}
                >
                  <span className="text-xs uppercase tracking-wider opacity-70 font-medium">
                    Глас
                  </span>
                  <span className="text-3xl sm:text-4xl font-bold font-ecclesiastical leading-none">
                    {glas}
                  </span>
                  <span className="text-[11px] opacity-60 font-mono mt-0.5">
                    Клавиша [{glas}]
                  </span>

                  {/* Feedback indicator icon on button */}
                  {isAnswered && isCorrectTarget && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                  {isAnswered && isSelected && !isCorrectTarget && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-xs">
                      <X className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Educational Breakdown after Answer */}
          {isAnswered && currentGlasData && (
            <div
              className={`rounded-2xl p-6 border transition-all animate-fadeIn ${
                lastFeedback?.isCorrect
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {lastFeedback?.isCorrect ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                        <X className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                    <h3 className="text-lg font-bold font-ecclesiastical text-slate-900 dark:text-slate-100">
                      {lastFeedback?.message}
                    </h3>
                  </div>

                  <p className="text-sm font-ecclesiastical italic text-slate-800 dark:text-slate-200 pl-9">
                    {currentGlasData.primaryZapevText}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-9">
                    {currentGlasData.psalmCitation} · {currentGlasData.character}
                  </p>
                </div>

                {/* Compare with Full Choir Button (ALL-N.mp3) */}
                <div className="flex flex-col gap-2 shrink-0 sm:self-center">
                  <button
                    onClick={handlePlayAllVoices}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all whitespace-nowrap active:scale-95"
                    title="Прослушать этот глас в исполнении полного 4-голосного хора"
                  >
                    <Users className="w-4 h-4" />
                    <span>Прослушать всеми партиями (Хор)</span>
                  </button>

                  <button
                    onClick={() => onOpenStudyGlas(currentGlasData.number)}
                    className="flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline underline-offset-2 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Подробнее в учебном разделе</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Scoreboard, Streak & Tone Mastery */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Score Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Результаты тренировки
              </h3>
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                <Flame className="w-4 h-4" />
                <span>Серия: {stats.currentStreak}</span>
              </div>
            </div>

            {/* Score Numbers */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Правильно
                </span>
                <p className="text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1 tabular-nums">
                  {stats.correctAnswers}
                </p>
              </div>

              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/40 rounded-2xl">
                <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
                  Ошибки
                </span>
                <p className="text-3xl font-bold font-mono text-rose-700 dark:text-rose-300 mt-1 tabular-nums">
                  {stats.incorrectAnswers}
                </p>
              </div>
            </div>

            {/* Accuracy & Best Streak */}
            <div className="space-y-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between font-medium">
                <span>Точность ответов:</span>
                <span className="text-slate-900 dark:text-slate-100 font-bold font-mono tabular-nums">
                  {accuracy}% ({stats.correctAnswers}/{stats.totalQuestions})
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${accuracy}%` }}
                />
              </div>

              <div className="flex justify-between pt-2">
                <span>Лучшая серия:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                  {stats.bestStreak} подряд
                </span>
              </div>
            </div>

            {/* Manage audio files button shortcut */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onOpenAudioModal}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Загрузка / Проверка MP3 файлов</span>
              </button>
            </div>
          </div>

          {/* Glas Accuracy Matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
            <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Успеваемость по гласам
            </h4>
            
            <div className="space-y-2">
              {GLAS_LIST.map((g) => {
                const stat = stats.glasStats[g] || { attempts: 0, correct: 0 };
                const pct = stat.attempts > 0 ? Math.round((stat.correct / stat.attempts) * 100) : 0;
                
                return (
                  <div key={g} className="flex items-center justify-between text-xs">
                    <span className="w-16 font-medium text-slate-700 dark:text-slate-300">
                      Глас {g}
                    </span>
                    <div className="flex-1 mx-3 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          stat.attempts === 0
                            ? 'bg-transparent'
                            : pct >= 80
                            ? 'bg-emerald-500'
                            : pct >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${stat.attempts === 0 ? 0 : pct}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {stat.attempts === 0 ? '—' : `${pct}% (${stat.correct}/${stat.attempts})`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
