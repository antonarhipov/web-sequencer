/**
 * Swing Timing Transform Module
 * Applies swing timing to compiled events by delaying off-beat subdivisions.
 */

import type { SynthEvent } from './compiler';

/**
 * Apply swing timing transform to a list of events.
 * 
 * Swing works by delaying "off-beat" subdivisions. For example, with a grid of 16
 * (16th notes), every other 16th note (the "off-beats") gets delayed.
 * 
 * The delay amount is: swing * subdivisionDuration
 * Where subdivisionDuration = 60 / bpm / (grid / 4)
 * 
 * @param events - Array of SynthEvents to transform
 * @param swing - Swing amount (0 to 0.75, where 0 = no swing)
 * @param grid - Grid subdivision (e.g., 16 for 16th notes)
 * @param bpm - Beats per minute
 * @returns New array of SynthEvents with swing applied
 */
export function applySwing(
  events: SynthEvent[],
  swing: number,
  grid: number,
  bpm: number
): SynthEvent[] {
  // No swing to apply
  if (swing === 0) {
    return events;
  }

  // Calculate the duration of one grid subdivision in seconds
  // grid is the denominator (e.g., 16 means 16th notes)
  // A quarter note (1/4) at the given BPM = 60 / bpm seconds
  // A grid subdivision = quarterNoteDuration * (4 / grid)
  const quarterNoteDuration = 60 / bpm;
  const subdivisionDuration = quarterNoteDuration * (4 / grid);

  // The delay to apply to off-beats
  const swingDelay = swing * subdivisionDuration;

  // Transform events
  const transformedEvents = events.map(event => {
    // Determine which subdivision this event falls on
    // Use a small epsilon for floating point comparison
    const epsilon = subdivisionDuration * 0.001;
    const subdivisionIndex = Math.round(event.t / subdivisionDuration);
    
    // Check if this event is close enough to a grid line
    const gridAlignedTime = subdivisionIndex * subdivisionDuration;
    const isOnGrid = Math.abs(event.t - gridAlignedTime) < epsilon;

    // Off-beats are odd subdivision indices (1, 3, 5, 7, ...)
    const isOffBeat = subdivisionIndex % 2 === 1;

    if (isOnGrid && isOffBeat) {
      // Apply swing delay to off-beats
      const newTime = Math.max(0, event.t + swingDelay);
      return {
        ...event,
        t: newTime,
      };
    }

    return event;
  });

  // Re-sort events by time after transform
  transformedEvents.sort((a, b) => a.t - b.t);

  return transformedEvents;
}
