/**
 * Integration Tests
 * Tests the full pipeline from DSL source to compiled SynthEvents.
 */

import { describe, it, expect } from 'vitest';
import { compileFromSource } from '../compiler';

describe('Integration: Full Source → Compiled Events', () => {
  describe('complete program compilation', () => {
    it('should compile a complete DSL program with all directives', () => {
      const source = `
        bpm 120
        inst lead sine
        seq: C4 1/4, D4 1/4, E4 1/4, F4 1/4
      `;

      const result = compileFromSource(source);

      expect(result.bpm).toBe(120);
      expect(result.eventCount).toBe(4);
      expect(result.events).toHaveLength(4);
      
      // Verify total duration: 4 quarter notes at 120 BPM = 4 * 0.5s = 2s
      expect(result.totalDuration).toBeCloseTo(2.0, 5);
    });

    it('should compile example program from README', () => {
      const source = `// Web DSL Music Sequencer - Example Program
// This is a simple melody demonstration

bpm 120

inst lead sine

seq:
  C4 1/4, D4 1/4, E4 1/4, F4 1/4,
  G4 1/2, E4 1/4, C4 1/4,
  D4 1/4, D4 1/4, E4 1/4, D4 1/4,
  C4 1/1
`;

      const result = compileFromSource(source);

      expect(result.bpm).toBe(120);
      expect(result.eventCount).toBe(12);
      expect(result.events.every(e => e.inst === 'lead')).toBe(true);
      expect(result.events.every(e => e.waveform === 'sine')).toBe(true);
    });

    it('should handle program with rests', () => {
      const source = `
        bpm 120
        inst bass square
        seq: C3 1/4, r 1/4, E3 1/4, r 1/4
      `;

      const result = compileFromSource(source);

      expect(result.eventCount).toBe(4);
      
      const notes = result.events.filter(e => e.kind === 'note');
      const rests = result.events.filter(e => e.kind === 'rest');
      
      expect(notes).toHaveLength(2);
      expect(rests).toHaveLength(2);
    });

    it('should use default values when directives are omitted', () => {
      const source = `seq: A4 1/4`;

      const result = compileFromSource(source);

      // Default BPM is 120
      expect(result.bpm).toBe(120);
      // Default instrument is lead sine
      expect(result.events[0].inst).toBe('lead');
      expect(result.events[0].waveform).toBe('sine');
    });
  });

  describe('event timing verification', () => {
    it('should calculate correct start times for sequential notes', () => {
      const source = `
        bpm 120
        seq: C4 1/4, D4 1/4, E4 1/4
      `;

      const result = compileFromSource(source);

      // At 120 BPM, each quarter note = 0.5s
      expect(result.events[0].t).toBeCloseTo(0.0, 5);
      expect(result.events[1].t).toBeCloseTo(0.5, 5);
      expect(result.events[2].t).toBeCloseTo(1.0, 5);
    });

    it('should calculate correct durations at different BPMs', () => {
      const source60 = `bpm 60\nseq: C4 1/4`;
      const source120 = `bpm 120\nseq: C4 1/4`;
      const source240 = `bpm 240\nseq: C4 1/4`;

      const result60 = compileFromSource(source60);
      const result120 = compileFromSource(source120);
      const result240 = compileFromSource(source240);

      // Quarter note duration: 60/BPM seconds
      expect(result60.events[0].dur).toBeCloseTo(1.0, 5);
      expect(result120.events[0].dur).toBeCloseTo(0.5, 5);
      expect(result240.events[0].dur).toBeCloseTo(0.25, 5);
    });

    it('should handle mixed note durations correctly', () => {
      const source = `
        bpm 120
        seq: C4 1/2, D4 1/4, E4 1/8, F4 1/8
      `;

      const result = compileFromSource(source);

      // At 120 BPM: 1/2 = 1s, 1/4 = 0.5s, 1/8 = 0.25s
      expect(result.events[0].dur).toBeCloseTo(1.0, 5);
      expect(result.events[1].dur).toBeCloseTo(0.5, 5);
      expect(result.events[2].dur).toBeCloseTo(0.25, 5);
      expect(result.events[3].dur).toBeCloseTo(0.25, 5);

      // Verify start times accumulate correctly
      expect(result.events[0].t).toBeCloseTo(0.0, 5);
      expect(result.events[1].t).toBeCloseTo(1.0, 5);
      expect(result.events[2].t).toBeCloseTo(1.5, 5);
      expect(result.events[3].t).toBeCloseTo(1.75, 5);
    });
  });

  describe('pitch and frequency verification', () => {
    it('should convert pitches to correct MIDI and frequency values', () => {
      const source = `
        bpm 120
        seq: A4 1/4, C4 1/4, G3 1/4
      `;

      const result = compileFromSource(source);

      // A4 = MIDI 69, 440 Hz
      expect(result.events[0].midi).toBe(69);
      expect(result.events[0].freq).toBeCloseTo(440, 1);

      // C4 = MIDI 60, ~261.63 Hz
      expect(result.events[1].midi).toBe(60);
      expect(result.events[1].freq).toBeCloseTo(261.63, 1);

      // G3 = MIDI 55, ~196 Hz
      expect(result.events[2].midi).toBe(55);
      expect(result.events[2].freq).toBeCloseTo(196, 1);
    });

    it('should handle accidentals correctly', () => {
      const source = `
        bpm 120
        seq: C#4 1/4, Bb3 1/4, F#5 1/4
      `;

      const result = compileFromSource(source);

      // C#4 = MIDI 61
      expect(result.events[0].midi).toBe(61);
      // Bb3 = MIDI 58
      expect(result.events[1].midi).toBe(58);
      // F#5 = MIDI 78
      expect(result.events[2].midi).toBe(78);
    });
  });

  describe('waveform types', () => {
    it('should set correct waveform for each instrument type', () => {
      const waveforms = ['sine', 'square', 'sawtooth', 'triangle'];

      for (const waveform of waveforms) {
        const source = `inst test ${waveform}\nseq: C4 1/4`;
        const result = compileFromSource(source);
        expect(result.events[0].waveform).toBe(waveform);
      }
    });
  });

  describe('error handling', () => {
    it('should throw on invalid pitch', () => {
      const source = `seq: X4 1/4`;
      expect(() => compileFromSource(source)).toThrow();
    });

    it('should throw on invalid duration', () => {
      const source = `seq: C4 abc`;
      expect(() => compileFromSource(source)).toThrow();
    });

    it('should throw on invalid BPM', () => {
      const source = `bpm abc`;
      expect(() => compileFromSource(source)).toThrow();
    });

    it('should throw on invalid waveform', () => {
      const source = `inst lead invalid`;
      expect(() => compileFromSource(source)).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty source', () => {
      const result = compileFromSource('');
      expect(result.events).toHaveLength(0);
      expect(result.bpm).toBe(120); // Default
    });

    it('should handle program with only comments', () => {
      const source = `// This is a comment
// Another comment`;
      const result = compileFromSource(source);
      expect(result.events).toHaveLength(0);
    });

    it('should handle very fast BPM', () => {
      const source = `bpm 300\nseq: C4 1/16`;
      const result = compileFromSource(source);
      // At 300 BPM, 1/16 = 0.05s
      expect(result.events[0].dur).toBeCloseTo(0.05, 5);
    });

    it('should handle very slow BPM', () => {
      const source = `bpm 30\nseq: C4 1/1`;
      const result = compileFromSource(source);
      // At 30 BPM, 1/1 = 8s
      expect(result.events[0].dur).toBeCloseTo(8.0, 5);
    });
  });
});
