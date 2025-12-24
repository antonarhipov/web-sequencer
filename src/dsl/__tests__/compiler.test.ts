import { describe, it, expect } from 'vitest';
import { compile, compileFromSource, generateSummary, formatEventsAsJson } from '../compiler';
import type { SynthEvent, CompilationResult } from '../compiler';
import { parse } from '../parser';
import { tokenize } from '../tokenizer';

// Helper function to compile DSL source
function compileDSL(source: string): SynthEvent[] {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  return compile(ast);
}

describe('compile', () => {
  describe('basic compilation', () => {
    it('should return empty array for empty sequence', () => {
      const events = compileDSL('');
      expect(events).toEqual([]);
    });

    it('should return empty array when no sequence is defined', () => {
      const events = compileDSL('bpm 120\ninst lead sine');
      expect(events).toEqual([]);
    });

    it('should compile a single note', () => {
      const events = compileDSL(`
        bpm 120
        inst lead sine
        seq: C4 1/4
      `);
      expect(events).toHaveLength(1);
      expect(events[0].kind).toBe('note');
    });

    it('should compile multiple notes', () => {
      const events = compileDSL(`
        bpm 120
        inst lead sine
        seq: C4 1/4, D4 1/4, E4 1/4
      `);
      expect(events).toHaveLength(3);
      expect(events.every(e => e.kind === 'note')).toBe(true);
    });
  });

  describe('SynthEvent properties', () => {
    it('should set correct time (t) for events', () => {
      // At 120 BPM, a quarter note (1/4) = 0.5 seconds
      const events = compileDSL(`
        bpm 120
        seq: C4 1/4, D4 1/4, E4 1/4
      `);
      expect(events[0].t).toBeCloseTo(0, 5);
      expect(events[1].t).toBeCloseTo(0.5, 5);
      expect(events[2].t).toBeCloseTo(1.0, 5);
    });

    it('should set correct duration (dur) based on BPM', () => {
      // At 120 BPM, a quarter note = 0.5 seconds
      const events = compileDSL(`
        bpm 120
        seq: C4 1/4
      `);
      expect(events[0].dur).toBeCloseTo(0.5, 5);
    });

    it('should calculate duration correctly at different BPMs', () => {
      // At 60 BPM, a quarter note = 1 second
      const events60 = compileDSL(`
        bpm 60
        seq: C4 1/4
      `);
      expect(events60[0].dur).toBeCloseTo(1.0, 5);

      // At 240 BPM, a quarter note = 0.25 seconds
      const events240 = compileDSL(`
        bpm 240
        seq: C4 1/4
      `);
      expect(events240[0].dur).toBeCloseTo(0.25, 5);
    });

    it('should calculate different note durations correctly', () => {
      const events = compileDSL(`
        bpm 120
        seq: C4 1/4, D4 1/8, E4 1/2
      `);
      // At 120 BPM: 1/4 = 0.5s, 1/8 = 0.25s, 1/2 = 1s
      expect(events[0].dur).toBeCloseTo(0.5, 5);
      expect(events[1].dur).toBeCloseTo(0.25, 5);
      expect(events[2].dur).toBeCloseTo(1.0, 5);
    });

    it('should set correct MIDI note numbers', () => {
      const events = compileDSL(`
        bpm 120
        seq: C4 1/4, A4 1/4
      `);
      // C4 = 60, A4 = 69
      expect(events[0].midi).toBe(60);
      expect(events[1].midi).toBe(69);
    });

    it('should handle accidentals in MIDI calculation', () => {
      const events = compileDSL(`
        bpm 120
        seq: C#4 1/4, Bb3 1/4
      `);
      // C#4 = 61, Bb3 = 58
      expect(events[0].midi).toBe(61);
      expect(events[1].midi).toBe(58);
    });

    it('should set correct frequency values', () => {
      const events = compileDSL(`
        bpm 120
        seq: A4 1/4, C4 1/4
      `);
      // A4 = 440 Hz
      expect(events[0].freq).toBeCloseTo(440, 1);
      // C4 ≈ 261.63 Hz
      expect(events[1].freq).toBeCloseTo(261.63, 1);
    });

    it('should set constant velocity of 0.8 for notes', () => {
      const events = compileDSL(`
        bpm 120
        seq: C4 1/4, D4 1/4, E4 1/4
      `);
      expect(events[0].vel).toBe(0.8);
      expect(events[1].vel).toBe(0.8);
      expect(events[2].vel).toBe(0.8);
    });

    it('should set instrument name from inst directive', () => {
      const events = compileDSL(`
        inst lead sine
        seq: C4 1/4
      `);
      expect(events[0].inst).toBe('lead');
    });

    it('should set waveform from inst directive', () => {
      const eventsSquare = compileDSL(`
        inst bass square
        seq: C4 1/4
      `);
      expect(eventsSquare[0].waveform).toBe('square');

      const eventsSawtooth = compileDSL(`
        inst synth sawtooth
        seq: C4 1/4
      `);
      expect(eventsSawtooth[0].waveform).toBe('sawtooth');
    });
  });

  describe('rest handling', () => {
    it('should create rest events', () => {
      const events = compileDSL(`
        bpm 120
        seq: C4 1/4, r 1/4, D4 1/4
      `);
      expect(events).toHaveLength(3);
      expect(events[1].kind).toBe('rest');
    });

    it('should set rest event properties correctly', () => {
      const events = compileDSL(`
        bpm 120
        seq: r 1/4
      `);
      expect(events[0].kind).toBe('rest');
      expect(events[0].midi).toBeNull();
      expect(events[0].freq).toBeNull();
      expect(events[0].vel).toBe(0);
    });

    it('should advance time correctly after rest', () => {
      const events = compileDSL(`
        bpm 120
        seq: C4 1/4, r 1/4, D4 1/4
      `);
      // At 120 BPM: 1/4 = 0.5s
      expect(events[0].t).toBeCloseTo(0, 5);
      expect(events[1].t).toBeCloseTo(0.5, 5);
      expect(events[2].t).toBeCloseTo(1.0, 5);
    });

    it('should handle multiple consecutive rests', () => {
      const events = compileDSL(`
        bpm 120
        seq: C4 1/4, r 1/4, r 1/4, D4 1/4
      `);
      expect(events).toHaveLength(4);
      expect(events[3].t).toBeCloseTo(1.5, 5);
    });
  });

  describe('event sorting', () => {
    it('should return events sorted by start time', () => {
      const events = compileDSL(`
        bpm 120
        seq: C4 1/4, D4 1/4, E4 1/4, F4 1/4
      `);
      for (let i = 1; i < events.length; i++) {
        expect(events[i].t).toBeGreaterThanOrEqual(events[i - 1].t);
      }
    });
  });
});

describe('compileFromSource', () => {
  it('should compile source code to CompilationResult', () => {
    const result = compileFromSource(`
      bpm 120
      inst lead sine
      seq: C4 1/4, D4 1/4
    `);
    expect(result.bpm).toBe(120);
    expect(result.eventCount).toBe(2);
    expect(result.events).toHaveLength(2);
  });

  it('should calculate total duration correctly', () => {
    // 2 quarter notes at 120 BPM = 1 second total
    const result = compileFromSource(`
      bpm 120
      seq: C4 1/4, D4 1/4
    `);
    expect(result.totalDuration).toBeCloseTo(1.0, 5);
  });

  it('should handle empty source', () => {
    const result = compileFromSource('');
    expect(result.bpm).toBe(120); // default
    expect(result.eventCount).toBe(0);
    expect(result.totalDuration).toBe(0);
  });

  it('should use default BPM when not specified', () => {
    const result = compileFromSource(`
      seq: C4 1/4
    `);
    expect(result.bpm).toBe(120);
  });
});

describe('generateSummary', () => {
  it('should generate correct summary', () => {
    const result: CompilationResult = {
      bpm: 120,
      totalDuration: 1.5,
      eventCount: 3,
      events: [
        { t: 0, dur: 0.5, kind: 'note', midi: 60, freq: 261.63, vel: 0.8, inst: 'lead', waveform: 'sine' },
        { t: 0.5, dur: 0.5, kind: 'rest', midi: null, freq: null, vel: 0, inst: 'lead', waveform: 'sine' },
        { t: 1.0, dur: 0.5, kind: 'note', midi: 62, freq: 293.66, vel: 0.8, inst: 'lead', waveform: 'sine' },
      ],
      globalSettings: { swing: 0, loop: 1, grid: 16 },
    };
    const summary = generateSummary(result);
    expect(summary).toContain('BPM: 120');
    expect(summary).toContain('Total Duration: 1.500s');
    expect(summary).toContain('Events: 3 (2 notes, 1 rests)');
  });

  it('should handle zero events', () => {
    const result: CompilationResult = {
      bpm: 120,
      totalDuration: 0,
      eventCount: 0,
      events: [],
      globalSettings: { swing: 0, loop: 1, grid: 16 },
    };
    const summary = generateSummary(result);
    expect(summary).toContain('Events: 0 (0 notes, 0 rests)');
  });
});

describe('formatEventsAsJson', () => {
  it('should format events as pretty JSON', () => {
    const events: SynthEvent[] = [
      { t: 0, dur: 0.5, kind: 'note', midi: 60, freq: 261.63, vel: 0.8, inst: 'lead', waveform: 'sine' },
    ];
    const json = formatEventsAsJson(events);
    expect(json).toContain('"t": 0');
    expect(json).toContain('"midi": 60');
    expect(json).toContain('"kind": "note"');
  });

  it('should handle empty events array', () => {
    const json = formatEventsAsJson([]);
    expect(json).toBe('[]');
  });
});
