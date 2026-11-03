/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
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

  return (
    <div className="max-w-xl mx-auto space-y-4">
      
      {/* Canonical Zapev Text (transparent container) */}
      <div className="py-2 px-4 text-center">
        <p className="text-2xl sm:text-3xl font-bold font-ecclesiastical text-stone-900 dark:text-stone-100 tracking-wide leading-tight">
          «Испове́датися И́мени Твоему́»
        </p>
      </div>

      {/* 8 Glas Selection Buttons (4x2 grid for mobile) */}
      <div className="bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-3 shadow-xs space-y-2">
        <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 px-1">
          Выберите глас:
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {GLAS_LIST.map((glas) => {
            const isActive = activeGlas === glas;
            return (
              <button
                key={glas}
                onClick={() => {
                  setActiveGlas(glas);
                  if (playerState.isPlaying) {
                    audioManager.play(activeVoice, glas);
                  }
                }}
                className={`h-14 rounded-xl border text-center transition-all flex flex-col items-center justify-center p-1 active:scale-95 ${
                  isActive
                    ? 'border-[#E9DC00] shadow-sm font-bold text-stone-950'
                    : 'bg-white dark:bg-stone-900/90 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 hover:border-[#E9DC00]/80'
                }`}
                style={isActive ? { backgroundColor: '#E9DC00' } : undefined}
              >
                <span className="text-[10px] uppercase opacity-75 leading-none">
                  Глас
                </span>
                <span className="text-xl font-bold font-ecclesiastical leading-none mt-0.5">
                  {glas}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sheet Music of the Selected Glas (underneath the Glas selector block, without "Обиход") */}
      <div className="bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 px-1">
          <span className="font-semibold">Ноты запева (Глас {activeGlas})</span>
        </div>
        
        {/* White background container for pristine sheet music contrast */}
        <div className="bg-white rounded-xl p-2.5 border border-stone-100 dark:border-stone-700 flex items-center justify-center overflow-hidden">
          <img
            key={activeGlas}
            src={`./images/glas-${activeGlas}-zapev.png`}
            alt={`Ноты запева — Глас ${activeGlas}`}
            className="w-full h-auto max-h-44 object-contain"
            loading="eager"
            onError={(e) => {
              const target = e.currentTarget;
              if (activeGlas === 4) {
                target.src = './assets/aistudio/_zapev_gl_4-short_613d9e23.png';
              } else {
                target.src = `https://skulanov.github.io/stikhirnye-glasy/images/glas-${activeGlas}-zapev.png`;
              }
            }}
          />
        </div>
      </div>

      {/* Single Unified Voice Part Selector */}
      <div className="bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 rounded-2xl p-3 shadow-xs space-y-2">
        <span className="block text-xs font-semibold text-stone-500 dark:text-stone-400 px-1">
          Выберите партию:
        </span>
        <div className="grid grid-cols-5 gap-1 p-1 bg-stone-100/80 dark:bg-stone-800/80 rounded-xl text-xs text-center">
          <button
            onClick={() => handlePlayToggle('ALL', activeGlas)}
            className={`py-2.5 px-1 rounded-lg font-medium transition-all ${
              activeVoice === 'ALL'
                ? 'shadow-xs font-bold text-stone-950'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
            style={activeVoice === 'ALL' ? { backgroundColor: '#E9DC00' } : undefined}
          >
            Хор
          </button>
          {(['S', 'A', 'T', 'B'] as const).map((v) => {
            const isActive = activeVoice === v;
            return (
              <button
                key={v}
                onClick={() => handlePlayToggle(v, activeGlas)}
                className={`py-2.5 px-1 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'shadow-xs font-bold text-stone-950'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
                style={isActive ? { backgroundColor: '#E9DC00' } : undefined}
              >
                {VOICE_LABELS[v].full}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Playback Deck (filename and status messages removed) */}
      <div className="bg-white dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800/80 rounded-3xl p-6 text-center shadow-xs space-y-4">
        
        <div>
          <h2 className="text-xl font-bold font-ecclesiastical text-stone-900 dark:text-stone-100">
            Глас {activeGlas} — {VOICE_LABELS[activeVoice].full}
          </h2>
        </div>

        {/* Big Touch Play Button with #E9DC00 */}
        <div className="py-2 flex flex-col items-center justify-center">
          <button
            onClick={() => handlePlayToggle(activeVoice, activeGlas)}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-md text-stone-950 ${
              isCurrentPlaying
                ? 'ring-8 ring-[#E9DC00]/30 animate-pulse'
                : 'hover:brightness-95 hover:scale-105'
            }`}
            style={{ backgroundColor: '#E9DC00' }}
            aria-label={isCurrentPlaying ? 'Остановить' : 'Слушать'}
          >
            {isCurrentPlaying ? (
              <Square className="w-9 h-9 fill-current" />
            ) : (
              <Play className="w-10 h-10 fill-current translate-x-0.5" />
            )}
          </button>
        </div>

        {/* Progress Bar with #E9DC00 */}
        <div className="w-full space-y-1 pt-1">
          <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                backgroundColor: '#E9DC00',
                width: `${
                  playerState.duration > 0
                    ? Math.min(100, (playerState.currentTime / playerState.duration) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-stone-400 tabular-nums">
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
