/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioSlotStatus, GlasNumber, VoiceType } from '../types/chant';
import { clearAudioCache, getAllCachedKeys, getAudioBlob, saveAudioBlob } from './indexedDbStorage';
import { obikhodSynth } from './synthAudio';

export interface PlayerState {
  isPlaying: boolean;
  currentVoice: VoiceType | null;
  currentGlas: GlasNumber | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  sourceType: 'mp3_user' | 'mp3_server' | 'synth' | null;
  error: string | null;
}

type StateListener = (state: PlayerState) => void;

class AudioManager {
  private audioElement: HTMLAudioElement | null = null;
  private objectUrls: Map<string, string> = new Map();
  private localBlobKeys: Set<string> = new Set();
  private serverFilesAvailable: Set<string> = new Set();
  private synthStopFn: (() => void) | null = null;
  private animFrameId: number | null = null;
  private listeners: Set<StateListener> = new Set();

  private state: PlayerState = {
    isPlaying: false,
    currentVoice: null,
    currentGlas: null,
    currentTime: 0,
    duration: 0,
    playbackRate: 1.0,
    volume: 0.9,
    sourceType: null,
    error: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
      this.initStorage();
    }
  }

  private initAudioElement() {
    this.audioElement = new Audio();
    this.audioElement.volume = this.state.volume;
    this.audioElement.playbackRate = this.state.playbackRate;

    this.audioElement.addEventListener('play', () => {
      this.updateState({ isPlaying: true });
      this.startTimeTracker();
    });

    this.audioElement.addEventListener('pause', () => {
      this.updateState({ isPlaying: false });
      this.stopTimeTracker();
    });

    this.audioElement.addEventListener('ended', () => {
      this.updateState({ isPlaying: false, currentTime: this.state.duration });
      this.stopTimeTracker();
    });

    this.audioElement.addEventListener('loadedmetadata', () => {
      if (this.audioElement) {
        this.updateState({ duration: this.audioElement.duration || 0 });
      }
    });

    this.audioElement.addEventListener('error', () => {
      // Audio element failed to load file, will be handled in playback fallback
    });
  }

  private async initStorage() {
    try {
      const keys = await getAllCachedKeys();
      for (const key of keys) {
        this.localBlobKeys.add(key.toUpperCase());
        const blob = await getAudioBlob(key);
        if (blob) {
          const url = URL.createObjectURL(blob);
          this.objectUrls.set(key.toUpperCase(), url);
        }
      }
    } catch {
      // IndexedDB not ready or error
    }
    // Check server /public/audio availability for key files
    this.checkServerFiles();
  }

  public async checkServerFiles(): Promise<void> {
    const voices: VoiceType[] = ['S', 'A', 'T', 'B', 'ALL'];
    const checks: Promise<void>[] = [];

    for (const v of voices) {
      for (let g = 1; g <= 8; g++) {
        const key = `${v}-${g}`.toUpperCase();
        const filename = `${v}-${g}.mp3`;
        // Try relative paths matching both Vite dev and base './'
        const candidatePaths = [`./audio/${filename}`, `/audio/${filename}`, `audio/${filename}`];

        const checkPromise = async () => {
          for (const path of candidatePaths) {
            try {
              const res = await fetch(path, { method: 'HEAD' });
              if (res.ok && res.headers.get('content-type')?.includes('audio') || res.status === 200) {
                this.serverFilesAvailable.add(key);
                break;
              }
            } catch {
              // skip
            }
          }
        };
        checks.push(checkPromise());
      }
    }

    await Promise.allSettled(checks);
    this.notify();
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<PlayerState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private notify() {
    for (const l of this.listeners) {
      l(this.state);
    }
  }

  private startTimeTracker() {
    this.stopTimeTracker();
    const track = () => {
      if (this.audioElement && this.state.isPlaying) {
        this.updateState({ currentTime: this.audioElement.currentTime });
        this.animFrameId = requestAnimationFrame(track);
      }
    };
    this.animFrameId = requestAnimationFrame(track);
  }

  private stopTimeTracker() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public getTrackKey(voice: VoiceType, glas: GlasNumber): string {
    return `${voice}-${glas}`.toUpperCase();
  }

  public getTrackStatus(voice: VoiceType, glas: GlasNumber): AudioSlotStatus {
    const key = this.getTrackKey(voice, glas);
    const filename = `${voice}-${glas}.mp3`;
    const isLoadedLocally = this.localBlobKeys.has(key);
    const isAvailableOnServer = this.serverFilesAvailable.has(key);

    return {
      voice,
      glas,
      filename,
      isLoadedLocally,
      isAvailableOnServer,
      objectUrl: this.objectUrls.get(key),
    };
  }

  public async importAudioFile(file: File): Promise<{ success: boolean; key?: string; error?: string }> {
    // Expected filename: X-N.mp3, where X in [S, A, T, B, ALL], N in [1..8]
    // Accept variations like S-1.mp3, s_1.mp3, soprano-1.mp3, ALL-8.mp3
    const match = file.name.match(/^(S|A|T|B|ALL)[-_](\d)\.mp3$/i);
    let key = '';

    if (match) {
      const v = match[1].toUpperCase();
      const g = parseInt(match[2], 10);
      if (g >= 1 && g <= 8) {
        key = `${v}-${g}`.toUpperCase();
      }
    } else {
      // More flexible match if filename contains Soprano, Alto, Tenor, Bass
      const lower = file.name.toLowerCase();
      let v: VoiceType | null = null;
      if (lower.includes('all') || lower.includes('хор') || lower.includes('все')) v = 'ALL';
      else if (lower.includes('soprano') || lower.includes('сопрано') || lower.startsWith('s')) v = 'S';
      else if (lower.includes('alto') || lower.includes('альт') || lower.startsWith('a')) v = 'A';
      else if (lower.includes('tenor') || lower.includes('тенор') || lower.startsWith('t')) v = 'T';
      else if (lower.includes('bass') || lower.includes('бас') || lower.startsWith('b')) v = 'B';

      const numMatch = lower.match(/([1-8])/);
      if (v && numMatch) {
        const g = parseInt(numMatch[1], 10);
        key = `${v}-${g}`.toUpperCase();
      }
    }

    if (!key) {
      return {
        success: false,
        error: `Не удалось определить глас и партию из имени "${file.name}". Формат должен быть X-N.mp3 (например, S-1.mp3, ALL-4.mp3).`,
      };
    }

    try {
      await saveAudioBlob(key, file);
      this.localBlobKeys.add(key);

      if (this.objectUrls.has(key)) {
        URL.revokeObjectURL(this.objectUrls.get(key)!);
      }
      const newUrl = URL.createObjectURL(file);
      this.objectUrls.set(key, newUrl);
      this.notify();

      return { success: true, key };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  public async importBatchFiles(files: FileList | File[]): Promise<{ imported: number; failed: string[] }> {
    let imported = 0;
    const failed: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.importAudioFile(file);
      if (result.success) {
        imported++;
      } else {
        failed.push(`${file.name} (${result.error || 'ошибка'})`);
      }
    }
    return { imported, failed };
  }

  public async clearLoadedCache(): Promise<void> {
    await clearAudioCache();
    for (const url of this.objectUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.objectUrls.clear();
    this.localBlobKeys.clear();
    this.notify();
  }

  public stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if (this.synthStopFn) {
      this.synthStopFn();
      this.synthStopFn = null;
    }
    obikhodSynth.stop();
    this.stopTimeTracker();
    this.updateState({
      isPlaying: false,
      currentTime: 0,
      sourceType: null,
      error: null,
    });
  }

  public pause(): void {
    if (this.state.sourceType === 'synth') {
      this.stop();
    } else if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public resume(): void {
    if (this.audioElement && this.state.sourceType !== 'synth' && this.audioElement.src) {
      this.audioElement.play().catch(() => {});
    } else if (this.state.currentVoice && this.state.currentGlas) {
      this.play(this.state.currentVoice, this.state.currentGlas);
    }
  }

  public setSpeed(speed: number): void {
    const clamped = Math.max(0.5, Math.min(2.0, speed));
    if (this.audioElement) {
      this.audioElement.playbackRate = clamped;
    }
    this.updateState({ playbackRate: clamped });
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1.0, vol));
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
    this.updateState({ volume: clamped });
  }

  public async play(voice: VoiceType, glas: GlasNumber, speed?: number): Promise<void> {
    this.stop();

    const playbackSpeed = speed !== undefined ? speed : this.state.playbackRate;
    const key = this.getTrackKey(voice, glas);
    const filename = `${voice}-${glas}.mp3`;

    this.updateState({
      currentVoice: voice,
      currentGlas: glas,
      playbackRate: playbackSpeed,
      error: null,
    });

    // 1. Check user-loaded local blob
    if (this.objectUrls.has(key)) {
      const url = this.objectUrls.get(key)!;
      try {
        await this.playAudioUrl(url, 'mp3_user', playbackSpeed);
        return;
      } catch {
        // failed, continue fallback
      }
    }

    // 2. Check server file in public/audio/
    const candidatePaths = [`./audio/${filename}`, `/audio/${filename}`, `audio/${filename}`];
    for (const path of candidatePaths) {
      try {
        await this.playAudioUrl(path, 'mp3_server', playbackSpeed);
        this.serverFilesAvailable.add(key);
        return;
      } catch {
        // try next or fallback
      }
    }

    // 3. Fallback to Web Audio Obikhod Synthesizer
    this.playSynthesizerFallback(voice, glas, playbackSpeed);
  }

  private playAudioUrl(url: string, sourceType: 'mp3_user' | 'mp3_server', speed: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.audioElement) {
        reject(new Error('Audio element not initialized'));
        return;
      }

      this.audioElement.src = url;
      this.audioElement.playbackRate = speed;
      this.audioElement.volume = this.state.volume;

      const onCanPlay = () => {
        cleanup();
        this.audioElement?.play()
          .then(() => {
            this.updateState({
              isPlaying: true,
              sourceType,
              duration: this.audioElement?.duration || 0,
            });
            resolve();
          })
          .catch((err) => {
            cleanup();
            reject(err);
          });
      };

      const onError = (e: Event) => {
        cleanup();
        reject(new Error(`Failed to load audio: ${(e.target as HTMLAudioElement)?.error?.message || 'Network error'}`));
      };

      const cleanup = () => {
        this.audioElement?.removeEventListener('canplay', onCanPlay);
        this.audioElement?.removeEventListener('error', onError);
      };

      this.audioElement.addEventListener('canplay', onCanPlay);
      this.audioElement.addEventListener('error', onError);
      this.audioElement.load();
    });
  }

  private playSynthesizerFallback(voice: VoiceType, glas: GlasNumber, speed: number) {
    this.updateState({
      sourceType: 'synth',
      isPlaying: true,
      currentTime: 0,
    });

    const startTime = Date.now();
    const synthResult = obikhodSynth.playGlas(glas, voice, speed, this.state.volume, () => {
      this.updateState({
        isPlaying: false,
        currentTime: synthResult.duration,
      });
      this.stopTimeTracker();
    });

    this.synthStopFn = synthResult.stop;
    this.updateState({ duration: synthResult.duration });

    // Track simulated progress for synthesizer
    this.stopTimeTracker();
    const trackSynth = () => {
      if (this.state.isPlaying && this.state.sourceType === 'synth') {
        const elapsed = (Date.now() - startTime) / 1000;
        this.updateState({ currentTime: Math.min(elapsed, synthResult.duration) });
        if (elapsed < synthResult.duration) {
          this.animFrameId = requestAnimationFrame(trackSynth);
        }
      }
    };
    this.animFrameId = requestAnimationFrame(trackSynth);
  }

  public getState(): PlayerState {
    return this.state;
  }
}

export const audioManager = new AudioManager();
