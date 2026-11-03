/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GLAS_DATA } from '../data/glasData';
import { GlasNumber, VoiceType } from '../types/chant';

// Convert scientific note name (e.g. "F4", "C#3", "Bb3") to frequency in Hz
function noteToFreq(note: string): number {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const normalized = note.replace('Db', 'C#').replace('Eb', 'D#').replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#');
  const match = normalized.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440;
  const noteName = match[1];
  const octave = parseInt(match[2], 10);
  const semitoneIndex = notes.indexOf(noteName);
  const midi = (octave + 1) * 12 + semitoneIndex;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class ObikhodSynthesizer {
  private ctx: AudioContext | null = null;
  private activeNodes: Array<{ stop: () => void }> = [];
  private isPlaying = false;
  private stopTimeout: number | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public stop(): void {
    if (this.stopTimeout !== null) {
      window.clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
    for (const node of this.activeNodes) {
      try {
        node.stop();
      } catch {
        // ignore already stopped nodes
      }
    }
    this.activeNodes = [];
    this.isPlaying = false;
  }

  public playGlas(
    glas: GlasNumber,
    voice: VoiceType,
    speed = 1.0,
    volume = 0.8,
    onEnd?: () => void
  ): { duration: number; stop: () => void } {
    this.stop();
    const ctx = this.getContext();
    const glasInfo = GLAS_DATA[glas];
    if (!glasInfo || !glasInfo.synthScore) {
      return { duration: 0, stop: () => {} };
    }

    const { bpm, measures } = glasInfo.synthScore;
    const beatDuration = (60 / bpm) / Math.max(0.2, speed);
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Convolver-like gentle presence filter for ecclesiastical choir depth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, ctx.currentTime);
    filter.connect(masterGain);

    let currentTime = ctx.currentTime + 0.05;
    const voicesToPlay: Array<'S' | 'A' | 'T' | 'B'> = voice === 'ALL' ? ['S', 'A', 'T', 'B'] : [voice];

    for (const measure of measures) {
      const noteDuration = measure.duration * beatDuration;

      for (const v of voicesToPlay) {
        const noteStr = measure.notes[v];
        if (!noteStr) continue;

        const freq = noteToFreq(noteStr);
        // Add gentle vocal choral harmonics (fundamental + 2nd + 3rd harmonic)
        const harmonics = [
          { mult: 1, gain: 0.65 },
          { mult: 2, gain: 0.22 },
          { mult: 3, gain: 0.12 },
          { mult: 4, gain: 0.05 },
        ];

        for (const harm of harmonics) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = harm.mult === 1 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq * harm.mult, currentTime);

          // Subtle gentle choir vibrato
          const vibrato = ctx.createOscillator();
          const vibratoGain = ctx.createGain();
          vibrato.frequency.setValueAtTime(5.2 + Math.random() * 0.4, currentTime);
          vibratoGain.gain.setValueAtTime(freq * 0.003, currentTime);
          vibrato.connect(osc.frequency);
          vibrato.start(currentTime);
          vibrato.stop(currentTime + noteDuration);

          // Smooth vocal-like envelope: soft attack, warm sustain, gentle release
          const attack = 0.08 / speed;
          const release = 0.12 / speed;
          const peakGain = (harm.gain * (voice === 'ALL' ? 0.35 : 0.8));

          gain.gain.setValueAtTime(0.0001, currentTime);
          gain.gain.exponentialRampToValueAtTime(peakGain, currentTime + attack);
          gain.gain.setValueAtTime(peakGain * 0.9, currentTime + noteDuration - release);
          gain.gain.exponentialRampToValueAtTime(0.0001, currentTime + noteDuration);

          osc.connect(gain);
          gain.connect(filter);

          osc.start(currentTime);
          osc.stop(currentTime + noteDuration);

          this.activeNodes.push({
            stop: () => {
              try {
                osc.stop();
                vibrato.stop();
              } catch {
                // ignore
              }
            },
          });
        }
      }

      currentTime += noteDuration;
    }

    const totalDuration = currentTime - ctx.currentTime;
    this.isPlaying = true;

    this.stopTimeout = window.setTimeout(() => {
      this.isPlaying = false;
      this.activeNodes = [];
      if (onEnd) onEnd();
    }, totalDuration * 1000);

    return {
      duration: totalDuration,
      stop: () => this.stop(),
    };
  }
}

export const obikhodSynth = new ObikhodSynthesizer();
