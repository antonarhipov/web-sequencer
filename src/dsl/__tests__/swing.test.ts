import { describe, it, expect } from 'vitest';
import { applySwing } from '../swing';
import type { SynthEvent } from '../compiler';

/**
 * Helper to create a minimal SynthEvent for testing
 */
function createEvent(t: number, dur: number = 0.125): SynthEvent {
  return {
    t,
    dur,
    kind: 'note',
    midi: 60,
    freq: 261.63,
    vel: 0.8,
    inst: 'lead',
    waveform: 'sine',
  };
}

describe('applySwing', () => {
  // Test parameters:
  // BPM = 120 => quarter note = 0.5s
  // Grid = 16 => 16th note subdivision = 0.5 * (4/16) = 0.125s
  const bpm = 120;
  const grid = 16;
  const subdivisionDuration = 0.125; // 60/120 * 4/16 = 0.125s

  describe('with swing = 0', () => {
    it('should return events unchanged', () => {
      const events: SynthEvent[] = [
        createEvent(0),      // beat 1 (on-beat, index 0)
        createEvent(0.125),  // off-beat (index 1)
        createEvent(0.25),   // on-beat (index 2)
        createEvent(0.375),  // off-beat (index 3)
      ];

      const result = applySwing(events, 0, grid, bpm);

      expect(result).toEqual(events);
    });
  });

  describe('with swing = 0.5', () => {
    const swing = 0.5;
    const expectedDelay = swing * subdivisionDuration; // 0.0625s

    it('should delay off-beat events by swing amount', () => {
      const events: SynthEvent[] = [
        createEvent(0),      // on-beat (index 0) - no change
        createEvent(0.125),  // off-beat (index 1) - should be delayed
        createEvent(0.25),   // on-beat (index 2) - no change
        createEvent(0.375),  // off-beat (index 3) - should be delayed
      ];

      const result = applySwing(events, swing, grid, bpm);

      expect(result[0].t).toBeCloseTo(0, 5);
      expect(result[1].t).toBeCloseTo(0.125 + expectedDelay, 5); // 0.1875
      expect(result[2].t).toBeCloseTo(0.25, 5);
      expect(result[3].t).toBeCloseTo(0.375 + expectedDelay, 5); // 0.4375
    });

    it('should not modify on-beat events', () => {
      const events: SynthEvent[] = [
        createEvent(0),    // on-beat (index 0)
        createEvent(0.25), // on-beat (index 2)
        createEvent(0.5),  // on-beat (index 4)
      ];

      const result = applySwing(events, swing, grid, bpm);

      expect(result[0].t).toBeCloseTo(0, 5);
      expect(result[1].t).toBeCloseTo(0.25, 5);
      expect(result[2].t).toBeCloseTo(0.5, 5);
    });

    it('should only modify off-beat events', () => {
      const events: SynthEvent[] = [
        createEvent(0.125), // off-beat (index 1)
        createEvent(0.375), // off-beat (index 3)
        createEvent(0.625), // off-beat (index 5)
      ];

      const result = applySwing(events, swing, grid, bpm);

      expect(result[0].t).toBeCloseTo(0.125 + expectedDelay, 5);
      expect(result[1].t).toBeCloseTo(0.375 + expectedDelay, 5);
      expect(result[2].t).toBeCloseTo(0.625 + expectedDelay, 5);
    });
  });

  describe('with swing = 0.75 (maximum)', () => {
    const swing = 0.75;
    const expectedDelay = swing * subdivisionDuration; // 0.09375s

    it('should apply maximum swing delay', () => {
      const events: SynthEvent[] = [
        createEvent(0),
        createEvent(0.125),
      ];

      const result = applySwing(events, swing, grid, bpm);

      expect(result[0].t).toBeCloseTo(0, 5);
      expect(result[1].t).toBeCloseTo(0.125 + expectedDelay, 5); // 0.21875
    });
  });

  describe('with different grid values', () => {
    it('should work with grid = 8 (8th notes)', () => {
      // Grid = 8 => 8th note subdivision = 0.5 * (4/8) = 0.25s
      const grid8 = 8;
      const subdivision8 = 0.25;
      const swing = 0.5;
      const expectedDelay = swing * subdivision8; // 0.125s

      const events: SynthEvent[] = [
        createEvent(0),    // on-beat (index 0)
        createEvent(0.25), // off-beat (index 1)
        createEvent(0.5),  // on-beat (index 2)
        createEvent(0.75), // off-beat (index 3)
      ];

      const result = applySwing(events, swing, grid8, bpm);

      expect(result[0].t).toBeCloseTo(0, 5);
      expect(result[1].t).toBeCloseTo(0.25 + expectedDelay, 5); // 0.375
      expect(result[2].t).toBeCloseTo(0.5, 5);
      expect(result[3].t).toBeCloseTo(0.75 + expectedDelay, 5); // 0.875
    });

    it('should work with grid = 32 (32nd notes)', () => {
      // Grid = 32 => 32nd note subdivision = 0.5 * (4/32) = 0.0625s
      const grid32 = 32;
      const subdivision32 = 0.0625;
      const swing = 0.5;
      const expectedDelay = swing * subdivision32; // 0.03125s

      const events: SynthEvent[] = [
        createEvent(0),       // on-beat (index 0)
        createEvent(0.0625),  // off-beat (index 1)
        createEvent(0.125),   // on-beat (index 2)
      ];

      const result = applySwing(events, swing, grid32, bpm);

      expect(result[0].t).toBeCloseTo(0, 5);
      expect(result[1].t).toBeCloseTo(0.0625 + expectedDelay, 5);
      expect(result[2].t).toBeCloseTo(0.125, 5);
    });
  });

  describe('with different BPM values', () => {
    it('should work with BPM = 60', () => {
      // BPM = 60 => quarter note = 1.0s
      // Grid = 16 => subdivision = 1.0 * (4/16) = 0.25s
      const bpm60 = 60;
      const subdivision60 = 0.25;
      const swing = 0.5;
      const expectedDelay = swing * subdivision60; // 0.125s

      const events: SynthEvent[] = [
        createEvent(0),
        createEvent(0.25), // off-beat
        createEvent(0.5),
      ];

      const result = applySwing(events, swing, grid, bpm60);

      expect(result[0].t).toBeCloseTo(0, 5);
      expect(result[1].t).toBeCloseTo(0.25 + expectedDelay, 5); // 0.375
      expect(result[2].t).toBeCloseTo(0.5, 5);
    });

    it('should work with BPM = 180', () => {
      // BPM = 180 => quarter note = 0.333s
      // Grid = 16 => subdivision = 0.333 * (4/16) = 0.0833s
      const bpm180 = 180;
      const quarterNote180 = 60 / 180;
      const subdivision180 = quarterNote180 * (4 / 16);
      const swing = 0.5;
      const expectedDelay = swing * subdivision180;

      const events: SynthEvent[] = [
        createEvent(0),
        createEvent(subdivision180), // off-beat
        createEvent(subdivision180 * 2),
      ];

      const result = applySwing(events, swing, grid, bpm180);

      expect(result[0].t).toBeCloseTo(0, 5);
      expect(result[1].t).toBeCloseTo(subdivision180 + expectedDelay, 5);
      expect(result[2].t).toBeCloseTo(subdivision180 * 2, 5);
    });
  });

  describe('re-sorting after transform', () => {
    it('should re-sort events by time after applying swing', () => {
      // With high swing, off-beat at 0.125 might end up after on-beat at 0.25
      // swing = 0.75, delay = 0.09375, so 0.125 + 0.09375 = 0.21875 (still before 0.25)
      // Let's use extreme case: two events close together
      const swing = 0.75;
      const events: SynthEvent[] = [
        createEvent(0.125), // off-beat, will be delayed to ~0.21875
        createEvent(0.15),  // not on grid, should stay at 0.15
      ];

      const result = applySwing(events, swing, grid, bpm);

      // After swing, 0.125 becomes ~0.21875, which is after 0.15
      // Events should be re-sorted
      expect(result[0].t).toBeLessThanOrEqual(result[1].t);
    });
  });

  describe('clamping negative values', () => {
    it('should clamp event times to prevent negative values', () => {
      // This is a safety check - with positive swing values, times should never go negative
      // But we test the clamping behavior anyway
      const events: SynthEvent[] = [
        createEvent(0),
      ];

      const result = applySwing(events, 0.5, grid, bpm);

      // All times should be >= 0
      for (const event of result) {
        expect(event.t).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('events not on grid', () => {
    it('should not modify events that are not aligned to grid', () => {
      const swing = 0.5;
      const events: SynthEvent[] = [
        createEvent(0.1),   // not on 16th note grid
        createEvent(0.2),   // not on 16th note grid
        createEvent(0.33),  // not on 16th note grid
      ];

      const result = applySwing(events, swing, grid, bpm);

      // These events should not be modified as they don't fall on grid lines
      expect(result[0].t).toBeCloseTo(0.1, 5);
      expect(result[1].t).toBeCloseTo(0.2, 5);
      expect(result[2].t).toBeCloseTo(0.33, 5);
    });
  });

  describe('empty events array', () => {
    it('should handle empty events array', () => {
      const result = applySwing([], 0.5, grid, bpm);
      expect(result).toEqual([]);
    });
  });

  describe('preserves other event properties', () => {
    it('should preserve all event properties except time', () => {
      const event: SynthEvent = {
        t: 0.125, // off-beat
        dur: 0.25,
        kind: 'note',
        midi: 72,
        freq: 523.25,
        vel: 0.6,
        inst: 'bass',
        waveform: 'sawtooth',
        track: 'track1',
        gain: 0.9,
        adsr: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 },
      };

      const result = applySwing([event], 0.5, grid, bpm);

      expect(result[0].dur).toBe(0.25);
      expect(result[0].kind).toBe('note');
      expect(result[0].midi).toBe(72);
      expect(result[0].freq).toBe(523.25);
      expect(result[0].vel).toBe(0.6);
      expect(result[0].inst).toBe('bass');
      expect(result[0].waveform).toBe('sawtooth');
      expect(result[0].track).toBe('track1');
      expect(result[0].gain).toBe(0.9);
      expect(result[0].adsr).toEqual({ attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2 });
    });
  });
});
