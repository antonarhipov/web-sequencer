import { describe, it, expect } from 'vitest';
import { parsePitch, pitchToMidi, midiToFrequency, pitchToFrequency } from '../pitch';
import type { Pitch } from '../pitch';

describe('parsePitch', () => {
  it('should parse simple pitch C4', () => {
    const pitch = parsePitch('C4');
    expect(pitch).toEqual({ noteName: 'C', accidental: '', octave: 4 });
  });

  it('should parse pitch A4', () => {
    const pitch = parsePitch('A4');
    expect(pitch).toEqual({ noteName: 'A', accidental: '', octave: 4 });
  });

  it('should parse sharp accidental D#3', () => {
    const pitch = parsePitch('D#3');
    expect(pitch).toEqual({ noteName: 'D', accidental: '#', octave: 3 });
  });

  it('should parse flat accidental Bb2', () => {
    const pitch = parsePitch('Bb2');
    expect(pitch).toEqual({ noteName: 'B', accidental: 'b', octave: 2 });
  });

  it('should parse lowercase note names', () => {
    const pitch = parsePitch('c4');
    expect(pitch).toEqual({ noteName: 'C', accidental: '', octave: 4 });
  });

  it('should parse F#5', () => {
    const pitch = parsePitch('F#5');
    expect(pitch).toEqual({ noteName: 'F', accidental: '#', octave: 5 });
  });

  it('should parse Eb3', () => {
    const pitch = parsePitch('Eb3');
    expect(pitch).toEqual({ noteName: 'E', accidental: 'b', octave: 3 });
  });

  it('should handle octave 0', () => {
    const pitch = parsePitch('C0');
    expect(pitch).toEqual({ noteName: 'C', accidental: '', octave: 0 });
  });

  it('should handle octave 9', () => {
    const pitch = parsePitch('G9');
    expect(pitch).toEqual({ noteName: 'G', accidental: '', octave: 9 });
  });

  it('should trim whitespace', () => {
    const pitch = parsePitch('  A4  ');
    expect(pitch).toEqual({ noteName: 'A', accidental: '', octave: 4 });
  });

  it('should throw on empty string', () => {
    expect(() => parsePitch('')).toThrow('Invalid pitch: empty string');
  });

  it('should throw on whitespace-only string', () => {
    expect(() => parsePitch('   ')).toThrow('Invalid pitch: empty string');
  });

  it('should throw on invalid note name', () => {
    expect(() => parsePitch('X4')).toThrow('Invalid pitch: unknown note name');
  });

  it('should throw on missing octave', () => {
    expect(() => parsePitch('C')).toThrow('Invalid pitch: missing octave');
  });

  it('should throw on missing octave with accidental', () => {
    expect(() => parsePitch('C#')).toThrow('Invalid pitch: missing octave');
  });

  it('should throw on invalid octave', () => {
    expect(() => parsePitch('Cxyz')).toThrow('Invalid pitch: invalid octave');
  });

  it('should throw on octave out of range (negative)', () => {
    expect(() => parsePitch('C-1')).toThrow('Invalid pitch: octave -1 out of range');
  });

  it('should throw on octave out of range (too high)', () => {
    expect(() => parsePitch('C10')).toThrow('Invalid pitch: octave 10 out of range');
  });
});

describe('pitchToMidi', () => {
  it('should convert C4 to MIDI 60', () => {
    const pitch: Pitch = { noteName: 'C', accidental: '', octave: 4 };
    expect(pitchToMidi(pitch)).toBe(60);
  });

  it('should convert A4 to MIDI 69', () => {
    const pitch: Pitch = { noteName: 'A', accidental: '', octave: 4 };
    expect(pitchToMidi(pitch)).toBe(69);
  });

  it('should convert C#4 to MIDI 61', () => {
    const pitch: Pitch = { noteName: 'C', accidental: '#', octave: 4 };
    expect(pitchToMidi(pitch)).toBe(61);
  });

  it('should convert Db4 to MIDI 61', () => {
    const pitch: Pitch = { noteName: 'D', accidental: 'b', octave: 4 };
    expect(pitchToMidi(pitch)).toBe(61);
  });

  it('should convert D#3 to MIDI 51', () => {
    const pitch: Pitch = { noteName: 'D', accidental: '#', octave: 3 };
    expect(pitchToMidi(pitch)).toBe(51);
  });

  it('should convert Bb2 to MIDI 46', () => {
    const pitch: Pitch = { noteName: 'B', accidental: 'b', octave: 2 };
    expect(pitchToMidi(pitch)).toBe(46);
  });

  it('should convert C0 to MIDI 12', () => {
    const pitch: Pitch = { noteName: 'C', accidental: '', octave: 0 };
    expect(pitchToMidi(pitch)).toBe(12);
  });

  it('should convert G9 to MIDI 127', () => {
    const pitch: Pitch = { noteName: 'G', accidental: '', octave: 9 };
    expect(pitchToMidi(pitch)).toBe(127);
  });

  it('should convert E4 to MIDI 64', () => {
    const pitch: Pitch = { noteName: 'E', accidental: '', octave: 4 };
    expect(pitchToMidi(pitch)).toBe(64);
  });

  it('should convert F4 to MIDI 65', () => {
    const pitch: Pitch = { noteName: 'F', accidental: '', octave: 4 };
    expect(pitchToMidi(pitch)).toBe(65);
  });

  it('should convert B4 to MIDI 71', () => {
    const pitch: Pitch = { noteName: 'B', accidental: '', octave: 4 };
    expect(pitchToMidi(pitch)).toBe(71);
  });
});

describe('midiToFrequency', () => {
  it('should convert MIDI 69 (A4) to 440 Hz', () => {
    expect(midiToFrequency(69)).toBe(440);
  });

  it('should convert MIDI 60 (C4) to ~261.63 Hz', () => {
    const freq = midiToFrequency(60);
    expect(freq).toBeCloseTo(261.63, 1);
  });

  it('should convert MIDI 57 (A3) to 220 Hz', () => {
    expect(midiToFrequency(57)).toBeCloseTo(220, 2);
  });

  it('should convert MIDI 81 (A5) to 880 Hz', () => {
    expect(midiToFrequency(81)).toBeCloseTo(880, 2);
  });

  it('should convert MIDI 48 (C3) to ~130.81 Hz', () => {
    const freq = midiToFrequency(48);
    expect(freq).toBeCloseTo(130.81, 1);
  });

  it('should convert MIDI 72 (C5) to ~523.25 Hz', () => {
    const freq = midiToFrequency(72);
    expect(freq).toBeCloseTo(523.25, 1);
  });
});

describe('pitchToFrequency', () => {
  it('should convert A4 to 440 Hz', () => {
    expect(pitchToFrequency('A4')).toBe(440);
  });

  it('should convert C4 to ~261.63 Hz', () => {
    expect(pitchToFrequency('C4')).toBeCloseTo(261.63, 1);
  });

  it('should convert D#3 to correct frequency', () => {
    // D#3 = MIDI 51, frequency should be ~155.56 Hz
    expect(pitchToFrequency('D#3')).toBeCloseTo(155.56, 1);
  });

  it('should convert Bb2 to correct frequency', () => {
    // Bb2 = MIDI 46, frequency should be ~116.54 Hz
    expect(pitchToFrequency('Bb2')).toBeCloseTo(116.54, 1);
  });
});

describe('integration: parsePitch -> pitchToMidi', () => {
  it('C4 -> 60', () => {
    expect(pitchToMidi(parsePitch('C4'))).toBe(60);
  });

  it('A4 -> 69', () => {
    expect(pitchToMidi(parsePitch('A4'))).toBe(69);
  });

  it('D#3 -> 51', () => {
    expect(pitchToMidi(parsePitch('D#3'))).toBe(51);
  });

  it('Bb2 -> 46', () => {
    expect(pitchToMidi(parsePitch('Bb2'))).toBe(46);
  });

  it('F#5 -> 78', () => {
    expect(pitchToMidi(parsePitch('F#5'))).toBe(78);
  });

  it('Eb3 -> 51', () => {
    expect(pitchToMidi(parsePitch('Eb3'))).toBe(51);
  });
});
