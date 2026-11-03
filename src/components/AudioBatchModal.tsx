/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  Music,
  Trash2,
  X,
  Play,
  Square,
  RefreshCw,
  FolderOpen,
  Info
} from 'lucide-react';
import { audioManager, PlayerState } from '../services/audioManager';
import { GLAS_LIST, VOICE_LABELS } from '../data/glasData';
import { GlasNumber, VoiceType } from '../types/chant';

interface AudioBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioBatchModal: React.FC<AudioBatchModalProps> = ({ isOpen, onClose }) => {
  const [playerState, setPlayerState] = useState<PlayerState>(audioManager.getState());
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return audioManager.subscribe((state) => {
      setPlayerState(state);
    });
  }, []);

  if (!isOpen) return null;

  const voices: VoiceType[] = ['S', 'A', 'T', 'B', 'ALL'];
  let loadedCount = 0;
  const totalCount = voices.length * GLAS_LIST.length; // 40 tracks

  for (const v of voices) {
    for (const g of GLAS_LIST) {
      const status = audioManager.getTrackStatus(v, g);
      if (status.isLoadedLocally || status.isAvailableOnServer) {
        loadedCount++;
      }
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    setUploadMessage('Обработка файлов...');
    const result = await audioManager.importBatchFiles(files);
    setIsProcessing(false);

    if (result.imported > 0) {
      setUploadMessage(`Успешно загружено и сохранено в браузере: ${result.imported} аудиофайл(ов)!`);
    } else {
      setUploadMessage(`Не удалось импортировать файлы. Проверьте имена (например: S-1.mp3, ALL-4.mp3).`);
    }
    setTimeout(() => setUploadMessage(null), 5000);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Очистить все локально загруженные в браузере аудиофайлы? (Файлы на сервере в public/audio останутся).')) {
      await audioManager.clearLoadedCache();
      setUploadMessage('Локальный кэш очищен.');
      setTimeout(() => setUploadMessage(null), 3000);
    }
  };

  const handleTrackPlay = (voice: VoiceType, glas: GlasNumber) => {
    const isCurrent = playerState.currentVoice === voice && playerState.currentGlas === glas && playerState.isPlaying;
    if (isCurrent) {
      audioManager.stop();
    } else {
      audioManager.play(voice, glas);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold font-ecclesiastical text-slate-900 dark:text-slate-100">
              Управление аудиофайлами запевов
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Всего дорожек: 40</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                Загружено MP3: {loadedCount} из {totalCount}
              </span>
              <span aria-hidden="true">·</span>
              <span>Формат: X-N.mp3</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Instructions Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="font-semibold text-sm">Два способа использования ваших MP3-файлов:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                <li>
                  <strong className="text-slate-900 dark:text-slate-100">Прямо сейчас в браузере:</strong> перетащите все ваши файлы сюда в поле загрузки. Они сохранятся в памяти браузера (IndexedDB) и будут звучать сразу.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-slate-100">Для GitHub:</strong> положите файлы в папку <code className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 rounded font-mono text-[11px]">public/audio/</code> вашего проекта перед заливкой на GitHub.
                </li>
                <li>
                  Если файл не загружен, приложение автоматически воспроизводит настоящий обиходный распев через встроенный 4-голосный синтезатор хора!
                </li>
              </ul>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".mp3,audio/mpeg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
              }}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Перетащите сюда файлы MP3 или нажмите для выбора
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Можно выбрать сразу все файлы. Поддерживаются имена: <code className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">S-1.mp3 ... S-8.mp3</code>, <code className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">A-1.mp3</code>, <code className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">T-1.mp3</code>, <code className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">B-1.mp3</code>, <code className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">ALL-1.mp3 ... ALL-8.mp3</code>.
              </p>
            </div>
          </div>

          {uploadMessage && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-center font-medium text-slate-800 dark:text-slate-200 animate-fadeIn">
              {uploadMessage}
            </div>
          )}

          {/* Matrix of all 40 tracks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Статус дорожек (8 гласов × 5 партий)
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => audioManager.checkServerFiles()}
                  className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Перепроверить</span>
                </button>
                {loadedCount > 0 && (
                  <button
                    onClick={handleClearCache}
                    className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Очистить кэш браузера</span>
                  </button>
                )}
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">Глас</th>
                    {voices.map((v) => (
                      <th key={v} className="py-2.5 px-3 font-semibold text-center">
                        {VOICE_LABELS[v].short} ({v})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {GLAS_LIST.map((glas) => (
                    <tr key={glas} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                        Глас {glas}
                      </td>
                      {voices.map((voice) => {
                        const status = audioManager.getTrackStatus(voice, glas);
                        const isPlaying =
                          playerState.isPlaying &&
                          playerState.currentVoice === voice &&
                          playerState.currentGlas === glas;
                        const isMp3 = status.isLoadedLocally || status.isAvailableOnServer;

                        return (
                          <td key={voice} className="py-2 px-2 text-center">
                            <button
                              onClick={() => handleTrackPlay(voice, glas)}
                              title={
                                isMp3
                                  ? `Файл ${status.filename} готов. Нажмите для прослушивания`
                                  : `Файл не найден. Нажмите, чтобы послушать синтезатор обихода`
                              }
                              className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                                isPlaying
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : isMp3
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              {isPlaying ? (
                                <Square className="w-3 h-3 fill-current" />
                              ) : (
                                <Play className="w-3 h-3 fill-current opacity-70" />
                              )}
                              <span>{status.filename}</span>
                              {isMp3 && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-0.5" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>MP3 файл готов</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400 ml-3"></span>
            <span>Синтезатор обихода (демо)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors"
          >
            Готово
          </button>
        </div>

      </div>
    </div>
  );
};
