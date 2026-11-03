/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';
import { audioManager, PlayerState } from '../services/audioManager';
import { GLAS_LIST, VOICE_LABELS } from '../data/glasData';
import { GlasNumber, VoiceType } from '../types/chant';

interface StudyTabProps {
  initialGlas?: GlasNumber;
}

export const StudyTab: React.FC<StudyTabProps> = ({ initialGlas = 1 }) => {
  const [activeGlas, setActiveGlas] = useState<GlasNumber>(initialGlas);
  const [activeVoice, setActiveVoice] = useState<VoiceType>('ALL');
  const [playerState, setPlayerState] = useState<PlayerState>(audioManager.getState());

  useEffect(() => {
    return audioManager.subscribe((st) => {
      setPlayerState(st);
    });
  }, []);

  useEffect(() => {
    if (initialGlas) {
      setActiveGlas(initialGlas);
    }
  }, [initialGlas]);

  const isCurrentPlaying =
    playerState.isPlaying &&
    playerState.currentGlas === activeGlas &&
    playerState.currentVoice === activeVoice;

  const handlePlayToggle = (voice = activeVoice, glas = activeGlas) => {
    if (playerState.isPlaying && playerState.currentGlas === glas && playerState.currentVoice === voice) {
      audioManager.stop();
    } else {
      setActiveVoice(voice);
      setActiveGlas(glas);
      audioManager.play(voice, glas);
    }
  };

  const trackStatus = audioManager.getTrackStatus(activeVoice, activeGlas);

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

      {/* 8 Glas Selection Buttons (4x2 grid for mobile) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs space-y-2">
        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
          Выберите глас:
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {GLAS_LIST.map((glas) => (
            <button
              key={glas}
              onClick={() => {
                setActiveGlas(glas);
                if (playerState.isPlaying) {
                  audioManager.play(activeVoice, glas);
                }
              }}
              className={`h-14 rounded-xl border text-center transition-all flex flex-col items-center justify-center p-1 active:scale-95 ${
                activeGlas === glas
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400'
              }`}
            >
              <span className="text-[10px] uppercase opacity-70 leading-none">
                Глас
              </span>
              <span className="text-xl font-bold font-ecclesiastical leading-none mt-0.5">
                {glas}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Single Unified Voice Part Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs space-y-2">
        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
          Выберите партию:
        </span>
        <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-center">
          <button
            onClick={() => handlePlayToggle('ALL', activeGlas)}
            className={`py-2.5 px-1 rounded-lg font-medium transition-all ${
              activeVoice === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Хор
          </button>
          {(['S', 'A', 'T', 'B'] as const).map((v) => (
            <button
              key={v}
              onClick={() => handlePlayToggle(v, activeGlas)}
              className={`py-2.5 px-1 rounded-lg font-medium transition-all ${
                activeVoice === v
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {VOICE_LABELS[v].full}
            </button>
          ))}
        </div>
      </div>

      {/* Main Playback Deck */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-xs space-y-4">
        
        <div>
          <h2 className="text-xl font-bold font-ecclesiastical text-slate-900 dark:text-slate-100">
            Глас {activeGlas} — {VOICE_LABELS[activeVoice].full}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {trackStatus.filename}
          </p>
        </div>

        {/* Big Touch Play Button */}
        <div className="py-2 flex flex-col items-center justify-center">
          <button
            onClick={() => handlePlayToggle(activeVoice, activeGlas)}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-md ${
              isCurrentPlaying
                ? 'bg-amber-600 text-white ring-8 ring-amber-500/20'
                : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:scale-105'
            }`}
            aria-label={isCurrentPlaying ? 'Остановить' : 'Слушать'}
          >
            {isCurrentPlaying ? (
              <Square className="w-9 h-9 fill-current" />
            ) : (
              <Play className="w-10 h-10 fill-current translate-x-0.5" />
            )}
          </button>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2.5">
            {isCurrentPlaying ? 'Идёт воспроизведение...' : 'Нажмите для воспроизведения'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-1 pt-1">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all"
              style={{
                width: `${
                  playerState.duration > 0
                    ? Math.min(100, (playerState.currentTime / playerState.duration) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums">
            <span>
              {Math.floor(playerState.currentTime / 60)}:
              {Math.floor(playerState.currentTime % 60)
                .toString()
                .padStart(2, '0')}
            </span>
            <span>
              {Math.floor(playerState.duration / 60)}:
              {Math.floor(playerState.duration % 60)
                .toString()
                .padStart(2, '0')}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
