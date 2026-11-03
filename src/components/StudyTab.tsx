/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Volume2,
  Users,
  Music2,
  BookOpen,
  ArrowRight,
  Disc3,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { audioManager, PlayerState } from '../services/audioManager';
import { GLAS_DATA, GLAS_LIST, VOICE_LABELS } from '../data/glasData';
import { GlasNumber, VoiceType } from '../types/chant';

interface StudyTabProps {
  initialGlas?: GlasNumber;
  onStartTrainingWithVoice?: (voice: 'S' | 'A' | 'T' | 'B' | 'ANY') => void;
}

export const StudyTab: React.FC<StudyTabProps> = ({
  initialGlas = 1,
  onStartTrainingWithVoice,
}) => {
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

  const glasInfo = GLAS_DATA[activeGlas];
  const voiceDetail = glasInfo.voices[activeVoice];
  const isCurrentlyPlayingThis =
    playerState.isPlaying &&
    playerState.currentGlas === activeGlas &&
    playerState.currentVoice === activeVoice;

  const handlePlayToggle = (voice = activeVoice) => {
    if (playerState.isPlaying && playerState.currentGlas === activeGlas && playerState.currentVoice === voice) {
      audioManager.stop();
    } else {
      setActiveVoice(voice);
      audioManager.play(voice, activeGlas);
    }
  };

  const handleSpeedChange = (speed: number) => {
    audioManager.setSpeed(speed);
  };

  const trackStatus = audioManager.getTrackStatus(activeVoice, activeGlas);

  return (
    <div className="space-y-6">
      
      {/* 8 Glas Selector Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {GLAS_LIST.map((glas) => (
            <button
              key={glas}
              onClick={() => {
                setActiveGlas(glas);
                // Keep playing currently selected voice for the new glas if already playing
                if (playerState.isPlaying) {
                  audioManager.play(activeVoice, glas);
                }
              }}
              className={`py-3 px-2 rounded-xl text-center transition-all flex flex-col items-center gap-0.5 ${
                activeGlas === glas
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70">
                Глас
              </span>
              <span className="text-xl sm:text-2xl font-ecclesiastical leading-none">
                {glas}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Glas Guide View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Audio Player & Voice Selector */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Audio Player Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Аудиозапись
                </span>
                <h3 className="text-lg font-bold font-ecclesiastical text-slate-900 dark:text-slate-100">
                  {glasInfo.title} — {VOICE_LABELS[activeVoice].full}
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
                {trackStatus.filename}
              </span>
            </div>

            {/* Voice Part Selector Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Выберите партию для прослушивания:
              </label>
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                {(['ALL', 'S', 'A', 'T', 'B'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setActiveVoice(v);
                      if (playerState.isPlaying) {
                        audioManager.play(v, activeGlas);
                      }
                    }}
                    className={`py-2 px-1 text-center rounded-lg text-xs transition-all font-medium ${
                      activeVoice === v
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {VOICE_LABELS[v].short}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Audio Trigger Sphere & Timeline */}
            <div className="flex flex-col items-center justify-center py-2 space-y-4">
              <button
                onClick={() => handlePlayToggle(activeVoice)}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-md ${
                  isCurrentlyPlayingThis
                    ? 'bg-amber-600 text-white shadow-amber-500/30 ring-4 ring-amber-500/20'
                    : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:scale-105'
                }`}
                title={isCurrentlyPlayingThis ? 'Остановить' : 'Слушать'}
              >
                {isCurrentlyPlayingThis ? (
                  <Square className="w-8 h-8 fill-current" />
                ) : (
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                )}
              </button>

              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {isCurrentlyPlayingThis ? 'Воспроизведение...' : 'Воспроизвести запись'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {trackStatus.isLoadedLocally || trackStatus.isAvailableOnServer
                    ? 'Файл MP3'
                    : 'Синтезатор обихода'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full space-y-1">
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all"
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

              {/* Speed controls */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 w-full justify-center">
                <span className="text-xs text-slate-400">Скорость:</span>
                {[0.75, 1.0, 1.25].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
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

            {/* Quick Voice Compare Pill Strip */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
                Быстрое переключение при прослушивании:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['S', 'A', 'T', 'B'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => handlePlayToggle(v)}
                    className={`p-2 rounded-xl text-left border flex items-center justify-between transition-colors ${
                      activeVoice === v
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-medium">{VOICE_LABELS[v].full}</span>
                    <span className="text-[10px] opacity-70 font-mono">({v})</span>
                  </button>
                ))}
                <button
                  onClick={() => handlePlayToggle('ALL')}
                  className={`col-span-2 p-2 rounded-xl text-center border flex items-center justify-center gap-1.5 transition-colors ${
                    activeVoice === 'ALL'
                      ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Весь хор (4 партии SATB)</span>
                </button>
              </div>
            </div>

          </div>

          {/* Quick Quiz CTA */}
          {onStartTrainingWithVoice && (
            <button
              onClick={() => onStartTrainingWithVoice(activeVoice === 'ALL' ? 'ANY' : activeVoice)}
              className="w-full flex items-center justify-center gap-2 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-sm transition-all shadow-md active:scale-95"
            >
              <span>Тренировать партию {VOICE_LABELS[activeVoice].full} в тренажёре</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

        </div>

        {/* Right Column: In-depth Liturgical Text, Musical Cues & Voice Roles */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Liturgical Text & Character Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{glasInfo.greekName}</span>
                <span>{glasInfo.psalmCitation}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-ecclesiastical text-slate-900 dark:text-slate-100">
                {glasInfo.title}
              </h2>
            </div>

            {/* Primary Zapev Text */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Канонический текст запева (стихира 10-я):
              </span>
              <p className="text-xl sm:text-2xl font-ecclesiastical text-slate-900 dark:text-slate-100 leading-relaxed">
                {glasInfo.primaryZapevText}
              </p>
              {glasInfo.secondaryZapevText && (
                <div className="pt-2 border-t border-amber-200/40 dark:border-amber-900/30">
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 block">
                    Вторая половина / 9-я стихира:
                  </span>
                  <p className="text-base font-ecclesiastical text-slate-800 dark:text-slate-200 italic">
                    {glasInfo.secondaryZapevText}
                  </p>
                </div>
              )}
            </div>

            {/* Character & Key Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Характер звучания:
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {glasInfo.character}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Гармонический строй и каденция:
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  {glasInfo.harmonicKey}
                </p>
                <p className="text-slate-500 text-[11px] mt-1">
                  Окончание: {glasInfo.finalCadence}
                </p>
              </div>
            </div>

            {/* Key Features List */}
            <div className="space-y-2 pt-2">
              <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Главные попевки и приметы на слух:
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {glasInfo.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Voice Part Focus Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Music2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Партия: {voiceDetail.title}
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Диапазон: {voiceDetail.rangeDesc}
              </span>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {voiceDetail.roleDescription}
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Что слушать певчему этой партии:
              </span>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {voiceDetail.musicalCues.map((cue, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
