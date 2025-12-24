/**
 * Duration Parsing Module
 * Handles parsing of duration fractions (e.g., "1/4", "3/16") and conversion to seconds.
 */

export interface Duration {
  numerator: number;
  denominator: number;
}

/**
 * Parse a duration string into a fraction.
 * @param str - Duration string like "1/4", "1/8", "3/16"
 * @returns Duration object with numerator and denominator
 * @throws Error if the duration format is invalid
 */
export function parseDuration(str: string): Duration {
  if (!str || str.length === 0) {
    throw new Error('Invalid duration: empty string');
  }

  const trimmed = str.trim();
  if (trimmed.length === 0) {
    throw new Error('Invalid duration: empty string');
  }

  const parts = trimmed.split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid duration format: expected "n/d", got "${str}"`);
  }

  const numerator = parseInt(parts[0], 10);
  const denominator = parseInt(parts[1], 10);

  if (isNaN(numerator)) {
    throw new Error(`Invalid duration: invalid numerator "${parts[0]}" in "${str}"`);
  }

  if (isNaN(denominator)) {
    throw new Error(`Invalid duration: invalid denominator "${parts[1]}" in "${str}"`);
  }

  if (numerator <= 0) {
    throw new Error(`Invalid duration: numerator must be positive, got ${numerator}`);
  }

  if (denominator <= 0) {
    throw new Error(`Invalid duration: denominator must be positive, got ${denominator}`);
  }

  return { numerator, denominator };
}

/**
 * Convert a duration fraction to seconds based on BPM.
 * 
 * In musical notation:
 * - A whole note (1/1) = 4 beats at the given BPM
 * - A quarter note (1/4) = 1 beat
 * - An eighth note (1/8) = 0.5 beats
 * 
 * Formula: seconds = (numerator / denominator) * 4 * (60 / bpm)
 *                  = (numerator / denominator) * (240 / bpm)
 * 
 * @param duration - Duration object with numerator and denominator
 * @param bpm - Beats per minute
 * @returns Duration in seconds
 */
export function durationToSeconds(duration: Duration, bpm: number): number {
  if (bpm <= 0) {
    throw new Error(`Invalid BPM: must be positive, got ${bpm}`);
  }

  // Whole note = 4 beats, so 1/4 = 1 beat = 60/bpm seconds
  // Duration in beats = (numerator / denominator) * 4
  // Duration in seconds = beats * (60 / bpm)
  const beats = (duration.numerator / duration.denominator) * 4;
  const seconds = beats * (60 / bpm);
  
  return seconds;
}

/**
 * Convenience function to parse a duration string and convert to seconds.
 * @param str - Duration string like "1/4", "1/8"
 * @param bpm - Beats per minute
 * @returns Duration in seconds
 */
export function parseDurationToSeconds(str: string, bpm: number): number {
  const duration = parseDuration(str);
  return durationToSeconds(duration, bpm);
}
