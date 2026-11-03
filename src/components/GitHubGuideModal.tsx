/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Github, Copy, Check, Folder, Terminal, Globe, ArrowRight } from 'lucide-react';

interface GitHubGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubGuideModal: React.FC<GitHubGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const gitCommands = `# 1. Перейдите в папку проекта на вашем компьютере:
cd zapevy-stikhirnykh-glasov

# 2. Положите ваши аудиофайлы в папку public/audio/:
# public/audio/S-1.mp3 ... S-8.mp3
# public/audio/A-1.mp3 ... A-8.mp3
# public/audio/T-1.mp3 ... T-8.mp3
# public/audio/B-1.mp3 ... B-8.mp3
# public/audio/ALL-1.mp3 ... ALL-8.mp3

# 3. Инициализируйте репозиторий и сделайте первый коммит:
git init
git add .
git commit -m "feat: Интерактивный тренажёр по запевам 8 стихирных гласов"

# 4. Привяжите ваш GitHub репозиторий (замените ВАШ_ЛОГИН):
git remote add origin https://github.com/ВАШ_ЛОГИН/zapevy-stikhirnykh-glasov.git
git branch -M main
git push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-slate-900 dark:text-slate-100" />
            <h2 className="text-lg font-bold font-ecclesiastical text-slate-900 dark:text-slate-100">
              Развёртывание на GitHub (zapevy-stikhirnykh-glasov)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          
          {/* Step 1: Repo name */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              1
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Создайте репозиторий на GitHub
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Создайте новый публичный репозиторий с названием:{' '}
                <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  zapevy-stikhirnykh-glasov
                </code>
              </p>
            </div>
          </div>

          {/* Step 2: Audio location */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              2
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Размещение ваших 40 готовых MP3 аудиофайлов
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Скопируйте подготовленные файлы прямо в папку <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">public/audio/</code>:
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
                <p>• <span className="text-rose-600 dark:text-rose-400 font-bold">S-1.mp3</span> до <span className="text-rose-600 dark:text-rose-400 font-bold">S-8.mp3</span> — Сопрано</p>
                <p>• <span className="text-amber-600 dark:text-amber-400 font-bold">A-1.mp3</span> до <span className="text-amber-600 dark:text-amber-400 font-bold">A-8.mp3</span> — Альт</p>
                <p>• <span className="text-emerald-600 dark:text-emerald-400 font-bold">T-1.mp3</span> до <span className="text-emerald-600 dark:text-emerald-400 font-bold">T-8.mp3</span> — Тенор</p>
                <p>• <span className="text-indigo-600 dark:text-indigo-400 font-bold">B-1.mp3</span> до <span className="text-indigo-600 dark:text-indigo-400 font-bold">B-8.mp3</span> — Бас</p>
                <p>• <span className="text-purple-600 dark:text-purple-400 font-bold">ALL-1.mp3</span> до <span className="text-purple-600 dark:text-purple-400 font-bold">ALL-8.mp3</span> — Все партии (Хор)</p>
              </div>
            </div>
          </div>

          {/* Step 3: Git commands */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              3
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Команды для отправки в GitHub
                </h3>
                <button
                  onClick={() => copyToClipboard(gitCommands, 1)}
                  className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  {copiedIndex === 1 ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Скопировать команды</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {gitCommands}
              </pre>
            </div>
          </div>

          {/* Step 4: 1-Click GitHub Pages */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              4
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Бесплатная публикация на GitHub Pages</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                В вашем проекте уже настроен <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">vite.config.ts (base: './')</code> и готов файл GitHub Actions.
                В репозитории на GitHub перейдите в <strong>Settings → Pages → Build and deployment → Source</strong> и выберите <strong>GitHub Actions</strong>. Сайт опубликуется автоматически за 1 минуту!
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Понятно
          </button>
        </div>

      </div>
    </div>
  );
};
