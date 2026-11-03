/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VoiceType = 'S' | 'A' | 'T' | 'B' | 'ALL';
export type VoiceFilter = 'ANY' | 'S' | 'A' | 'T' | 'B';
export type GlasNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface VoiceDetails {
  title: string;
  clef: string;
  rangeDesc: string;
  roleDescription: string;
  musicalCues: string[];
}

export interface GlasInfo {
  number: GlasNumber;
  title: string;
  greekName: string;
  primaryZapevText: string;
  secondaryZapevText?: string;
  psalmCitation: string;
  character: string;
  harmonicKey: string;
  finalCadence: string;
  keyFeatures: string[];
  voices: {
    S: VoiceDetails;
    A: VoiceDetails;
    T: VoiceDetails;
    B: VoiceDetails;
    ALL: VoiceDetails;
  };
  // Frequency data for chant synthesizer (fallback audio)
  synthScore: {
    bpm: number;
    measures: Array<{
      duration: number; // in beats
      notes: {
        S: string; // note name like "F4"
        A: string;
        T: string;
        B: string;
      };
    }>;
  };
}

export interface QuizQuestion {
  id: string;
  glas: GlasNumber;
  voice: 'S' | 'A' | 'T' | 'B';
  selectedVoiceFilter: VoiceFilter;
  audioFilename: string;
  allVoiceFilename: string;
  userAnswer?: GlasNumber;
  isCorrect?: boolean;
  answeredAt?: number;
}

export interface GlasStat {
  attempts: number;
  correct: number;
}

export interface QuizStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  currentStreak: number;
  bestStreak: number;
  glasStats: Record<GlasNumber, GlasStat>;
  voiceStats: Record<'S' | 'A' | 'T' | 'B', GlasStat>;
  history: Array<{
    id: string;
    timestamp: number;
    glas: GlasNumber;
    voice: 'S' | 'A' | 'T' | 'B';
    userAnswer: GlasNumber;
    isCorrect: boolean;
  }>;
}

export interface AudioSlotStatus {
  voice: VoiceType;
  glas: GlasNumber;
  filename: string;
  isLoadedLocally: boolean;
  isAvailableOnServer: boolean;
  objectUrl?: string;
}
