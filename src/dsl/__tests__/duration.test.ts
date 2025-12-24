import { describe, it, expect } from 'vitest';
import { parseDuration, durationToSeconds, parseDurationToSeconds } from '../duration';
import type { Duration } from '../duration';

describe('parseDuration', () => {
  it('should parse 1/4', () => {
    const duration = parseDuration('1/4');
    expect(duration).toEqual({ numerator: 1, denominator: 4 });
  });

  it('should parse 1/8', () => {
    const duration = parseDuration('1/8');
    expect(duration).toEqual({ numerator: 1, denominator: 8 });
  });

  it('should parse 1/16', () => {
    const duration = parseDuration('1/16');
    expect(duration).toEqual({ numerator: 1, denominator: 16 });
  });

  it('should parse 3/16', () => {
    const duration = parseDuration('3/16');
    expect(duration).toEqual({ numerator: 3, denominator: 16 });
  });

  it('should parse 1/1 (whole note)', () => {
    const duration = parseDuration('1/1');
    expect(duration).toEqual({ numerator: 1, denominator: 1 });
  });

  it('should parse 1/2 (half note)', () => {
    const duration = parseDuration('1/2');
    expect(duration).toEqual({ numerator: 1, denominator: 2 });
  });

  it('should parse 2/4', () => {
    const duration = parseDuration('2/4');
    expect(duration).toEqual({ numerator: 2, denominator: 4 });
  });

  it('should trim whitespace', () => {
    const duration = parseDuration('  1/4  ');
    expect(duration).toEqual({ numerator: 1, denominator: 4 });
  });

  it('should throw on empty string', () => {
    expect(() => parseDuration('')).toThrow('Invalid duration: empty string');
  });

  it('should throw on whitespace-only string', () => {
    expect(() => parseDuration('   ')).toThrow('Invalid duration: empty string');
  });

  it('should throw on missing slash', () => {
    expect(() => parseDuration('4')).toThrow('Invalid duration format');
  });

  it('should throw on multiple slashes', () => {
    expect(() => parseDuration('1/4/8')).toThrow('Invalid duration format');
  });

  it('should throw on invalid numerator', () => {
    expect(() => parseDuration('abc/4')).toThrow('Invalid duration: invalid numerator');
  });

  it('should throw on invalid denominator', () => {
    expect(() => parseDuration('1/xyz')).toThrow('Invalid duration: invalid denominator');
  });

  it('should throw on zero numerator', () => {
    expect(() => parseDuration('0/4')).toThrow('Invalid duration: numerator must be positive');
  });

  it('should throw on zero denominator', () => {
    expect(() => parseDuration('1/0')).toThrow('Invalid duration: denominator must be positive');
  });

  it('should throw on negative numerator', () => {
    expect(() => parseDuration('-1/4')).toThrow('Invalid duration: numerator must be positive');
  });

  it('should throw on negative denominator', () => {
    expect(() => parseDuration('1/-4')).toThrow('Invalid duration: denominator must be positive');
  });
});

describe('durationToSeconds', () => {
  describe('at 120 BPM', () => {
    const bpm = 120;
    // At 120 BPM: 1 beat = 0.5 seconds
    // 1/4 (quarter note) = 1 beat = 0.5s
    // 1/8 (eighth note) = 0.5 beats = 0.25s
    // 1/16 (sixteenth note) = 0.25 beats = 0.125s

    it('1/4 = 0.5s', () => {
      const duration: Duration = { numerator: 1, denominator: 4 };
      expect(durationToSeconds(duration, bpm)).toBe(0.5);
    });

    it('1/8 = 0.25s', () => {
      const duration: Duration = { numerator: 1, denominator: 8 };
      expect(durationToSeconds(duration, bpm)).toBe(0.25);
    });

    it('1/16 = 0.125s', () => {
      const duration: Duration = { numerator: 1, denominator: 16 };
      expect(durationToSeconds(duration, bpm)).toBe(0.125);
    });

    it('3/16 = 0.375s', () => {
      const duration: Duration = { numerator: 3, denominator: 16 };
      expect(durationToSeconds(duration, bpm)).toBe(0.375);
    });

    it('1/1 (whole note) = 2s', () => {
      const duration: Duration = { numerator: 1, denominator: 1 };
      expect(durationToSeconds(duration, bpm)).toBe(2);
    });

    it('1/2 (half note) = 1s', () => {
      const duration: Duration = { numerator: 1, denominator: 2 };
      expect(durationToSeconds(duration, bpm)).toBe(1);
    });

    it('2/4 = 1s', () => {
      const duration: Duration = { numerator: 2, denominator: 4 };
      expect(durationToSeconds(duration, bpm)).toBe(1);
    });
  });

  describe('at 60 BPM', () => {
    const bpm = 60;
    // At 60 BPM: 1 beat = 1 second
    // 1/4 (quarter note) = 1 beat = 1s
    // 1/8 (eighth note) = 0.5 beats = 0.5s

    it('1/4 = 1s', () => {
      const duration: Duration = { numerator: 1, denominator: 4 };
      expect(durationToSeconds(duration, bpm)).toBe(1);
    });

    it('1/8 = 0.5s', () => {
      const duration: Duration = { numerator: 1, denominator: 8 };
      expect(durationToSeconds(duration, bpm)).toBe(0.5);
    });

    it('1/1 (whole note) = 4s', () => {
      const duration: Duration = { numerator: 1, denominator: 1 };
      expect(durationToSeconds(duration, bpm)).toBe(4);
    });
  });

  describe('at 180 BPM', () => {
    const bpm = 180;
    // At 180 BPM: 1 beat = 0.333... seconds
    // 1/4 (quarter note) = 1 beat = 0.333...s

    it('1/4 = 0.333...s', () => {
      const duration: Duration = { numerator: 1, denominator: 4 };
      expect(durationToSeconds(duration, bpm)).toBeCloseTo(0.3333, 3);
    });

    it('1/8 = 0.166...s', () => {
      const duration: Duration = { numerator: 1, denominator: 8 };
      expect(durationToSeconds(duration, bpm)).toBeCloseTo(0.1667, 3);
    });
  });

  it('should throw on zero BPM', () => {
    const duration: Duration = { numerator: 1, denominator: 4 };
    expect(() => durationToSeconds(duration, 0)).toThrow('Invalid BPM: must be positive');
  });

  it('should throw on negative BPM', () => {
    const duration: Duration = { numerator: 1, denominator: 4 };
    expect(() => durationToSeconds(duration, -120)).toThrow('Invalid BPM: must be positive');
  });
});

describe('parseDurationToSeconds', () => {
  it('should parse and convert 1/4 at 120 BPM to 0.5s', () => {
    expect(parseDurationToSeconds('1/4', 120)).toBe(0.5);
  });

  it('should parse and convert 1/8 at 120 BPM to 0.25s', () => {
    expect(parseDurationToSeconds('1/8', 120)).toBe(0.25);
  });

  it('should parse and convert 3/16 at 120 BPM to 0.375s', () => {
    expect(parseDurationToSeconds('3/16', 120)).toBe(0.375);
  });

  it('should parse and convert 1/4 at 60 BPM to 1s', () => {
    expect(parseDurationToSeconds('1/4', 60)).toBe(1);
  });

  it('should handle whitespace in duration string', () => {
    expect(parseDurationToSeconds('  1/4  ', 120)).toBe(0.5);
  });

  it('should throw on invalid duration format', () => {
    expect(() => parseDurationToSeconds('invalid', 120)).toThrow('Invalid duration format');
  });

  it('should throw on invalid BPM', () => {
    expect(() => parseDurationToSeconds('1/4', 0)).toThrow('Invalid BPM');
  });
});
