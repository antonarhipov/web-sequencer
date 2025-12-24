/**
 * Pitch Parsing Module
 * Handles parsing of pitch strings (e.g., "C4", "D#3", "Bb2") and conversion to MIDI and frequency.
 */

export interface Pitch {
  noteName: string;      // A-G
  accidental: string;    // '#', 'b', or ''
  octave: number;        // 0-9
}

// Semitone offsets from C for each note name
const NOTE_SEMITONES: Record<string, number> = {
  'C': 0,
  'D': 2,
  'E': 4,
  'F': 5,
  'G': 7,
  'A': 9,
  'B': 11,
};

const VALID_NOTES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const MIN_OCTAVE = 0;
const MAX_OCTAVE = 9;

/**
 * Parse a pitch string into its components.
 * @param str - Pitch string like "C4", "D#3", "Bb2"
 * @returns Pitch object with noteName, accidental, and octave
 * @throws Error if the pitch string is invalid
 */
export function parsePitch(str: string): Pitch {
  if (!str || str.length === 0) {
    throw new Error('Invalid pitch: empty string');
  }

  const trimmed = str.trim();
  if (trimmed.length === 0) {
    throw new Error('Invalid pitch: empty string');
  }

  // Extract note name (first character, case-insensitive)
  const noteName = trimmed[0].toUpperCase();
  if (!VALID_NOTES.includes(noteName)) {
    throw new Error(`Invalid pitch: unknown note name "${trimmed[0]}"`);
  }

  let index = 1;
  let accidental = '';

  // Check for accidental (# or b)
  if (index < trimmed.length) {
    const char = trimmed[index];
    if (char === '#' || char === 'b') {
      accidental = char;
      index++;
    }
  }

  // Extract octave (remaining characters should be a number)
  const octaveStr = trimmed.slice(index);
  if (octaveStr.length === 0) {
    throw new Error(`Invalid pitch: missing octave in "${str}"`);
  }

  const octave = parseInt(octaveStr, 10);
  if (isNaN(octave)) {
    throw new Error(`Invalid pitch: invalid octave "${octaveStr}" in "${str}"`);
  }

  if (octave < MIN_OCTAVE || octave > MAX_OCTAVE) {
    throw new Error(`Invalid pitch: octave ${octave} out of range (${MIN_OCTAVE}-${MAX_OCTAVE})`);
  }

  return { noteName, accidental, octave };
}

/**
 * Convert a Pitch object to MIDI note number.
 * A4 = 69 (MIDI standard)
 * C4 = 60 (middle C)
 * @param pitch - Pitch object
 * @returns MIDI note number
 */
export function pitchToMidi(pitch: Pitch): number {
  // MIDI note number formula:
  // MIDI = 12 * (octave + 1) + semitone offset from C + accidental adjustment
  // C4 = 12 * (4 + 1) + 0 = 60
  // A4 = 12 * (4 + 1) + 9 = 69
  
  const baseSemitone = NOTE_SEMITONES[pitch.noteName];
  let accidentalOffset = 0;
  
  if (pitch.accidental === '#') {
    accidentalOffset = 1;
  } else if (pitch.accidental === 'b') {
    accidentalOffset = -1;
  }

  const midi = 12 * (pitch.octave + 1) + baseSemitone + accidentalOffset;
  return midi;
}

/**
 * Convert MIDI note number to frequency in Hz.
 * A4 (MIDI 69) = 440 Hz
 * Formula: f = 440 * 2^((midi - 69) / 12)
 * @param midi - MIDI note number
 * @returns Frequency in Hz
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Convenience function to parse a pitch string and get its frequency.
 * @param str - Pitch string like "C4", "A4"
 * @returns Frequency in Hz
 */
export function pitchToFrequency(str: string): number {
  const pitch = parsePitch(str);
  const midi = pitchToMidi(pitch);
  return midiToFrequency(midi);
}
