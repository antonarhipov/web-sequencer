/**
 * Lookahead Scheduler Module
 * Implements precise audio scheduling with lookahead window and looping support.
 * 
 * Architecture:
 * - Uses a timer-based lookahead approach for precise Web Audio timing
 * - Schedules events slightly ahead of when they need to play
 * - Supports looping transport with configurable loop length
 * - Handles track mute/solo state filtering
 */

import type { SynthEvent } from '../dsl/compiler';
import { getAudioContext, ensureAudioContextResumed } from './engine';

// ============================================================================
// Configuration Constants (9.1.2, 9.1.3)
// ============================================================================

/** How far ahead to schedule audio (in seconds) */
const SCHEDULE_AHEAD_SEC = 0.2;

/** How often to call the scheduling function (in milliseconds) */
const LOOKAHEAD_MS = 25;

// ============================================================================
// Scheduler State
// ============================================================================

/** Current events to schedule */
let scheduledEvents: SynthEvent[] = [];

/** Index of the next event to schedule */
let nextNoteIndex = 0;

/** Timer ID for the lookahead scheduler */
let timerID: number | null = null;

/** AudioContext time when playback started */
let startTime = 0;

/** Current transport state */
let playing = false;

/** Loop configuration */
let loopEnabled = false;
let loopDurationSec = 0;
let loopBars = 0;
let currentBpm = 120;

/** Set of events already scheduled in current loop iteration (for preventing double-scheduling) */
let scheduledInCurrentLoop: Set<number> = new Set();

/** Current loop iteration (for tracking absolute time) */
let currentLoopIteration = 0;

/** Track mute/solo state */
let mutedTracks: Set<string> = new Set();
let soloedTracks: Set<string> = new Set();

/** Callback for transport state changes */
let onTransportStateChange: ((state: TransportState) => void) | null = null;

/** Callback for playhead position updates */
let onPlayheadUpdate: ((position: number) => void) | null = null;

// ============================================================================
// Types
// ============================================================================

/**
 * Transport state information
 */
export interface TransportState {
  playing: boolean;
  currentTime: number;
  loopEnabled: boolean;
  loopBars: number;
  bpm: number;
}

/**
 * Scheduler configuration options
 */
export interface SchedulerConfig {
  events: SynthEvent[];
  bpm: number;
  loopBars?: number;
  loopEnabled?: boolean;
  onTransportStateChange?: (state: TransportState) => void;
  onPlayheadUpdate?: (position: number) => void;
}

/**
 * Track state for mute/solo
 */
export interface TrackState {
  name: string;
  muted: boolean;
  soloed: boolean;
}

// ============================================================================
// Note Scheduling (using engine's scheduleNote internally)
// ============================================================================

// Import the note scheduling function from engine
import { scheduleNote, getCurrentPlaybackToken, stopPlayback as engineStopPlayback } from './engine';

/**
 * Schedule a single event if it falls within the lookahead window.
 * @param event - The event to potentially schedule
 * @param eventTime - Absolute audio context time for this event
 * @param currentTime - Current audio context time
 */
function scheduleEventIfInWindow(
  event: SynthEvent,
  eventTime: number,
  currentTime: number
): boolean {
  // Check if event falls within the lookahead window
  if (eventTime >= currentTime && eventTime < currentTime + SCHEDULE_AHEAD_SEC) {
    const ctx = getAudioContext();
    scheduleNote(ctx, event, eventTime, getCurrentPlaybackToken());
    return true;
  }
  return false;
}

// ============================================================================
// Track Filtering (9.4.4, 9.4.5, 9.4.6)
// ============================================================================

/**
 * Check if an event should be played based on mute/solo state.
 * Solo takes precedence: if any track is soloed, only soloed tracks play.
 * @param event - The event to check
 * @returns True if the event should be played
 */
function shouldPlayEvent(event: SynthEvent): boolean {
  const trackName = event.track ?? 'default';
  
  // If any track is soloed, only play soloed tracks
  if (soloedTracks.size > 0) {
    return soloedTracks.has(trackName);
  }
  
  // Otherwise, play if not muted
  return !mutedTracks.has(trackName);
}

// ============================================================================
// Lookahead Scheduler Core (9.1.x)
// ============================================================================

/**
 * The main scheduler function called at regular intervals.
 * Schedules events that fall within the lookahead window.
 */
function scheduler(): void {
  if (!playing) return;
  
  const ctx = getAudioContext();
  const currentTime = ctx.currentTime;
  
  // Calculate elapsed time since playback started
  const elapsed = currentTime - startTime;
  
  // Update playhead position
  if (onPlayheadUpdate) {
    const playheadPosition = loopEnabled && loopDurationSec > 0
      ? elapsed % loopDurationSec
      : elapsed;
    onPlayheadUpdate(playheadPosition);
  }
  
  // If looping, check if we need to handle loop wrap
  if (loopEnabled && loopDurationSec > 0) {
    scheduleWithLooping(currentTime, elapsed);
  } else {
    scheduleWithoutLooping(currentTime, elapsed);
  }
}

/**
 * Schedule events without looping (9.2.6 - stop at end if loop disabled)
 */
function scheduleWithoutLooping(currentTime: number, _elapsed: number): void {
  // Schedule events that fall within the lookahead window
  while (nextNoteIndex < scheduledEvents.length) {
    const event = scheduledEvents[nextNoteIndex];
    const eventTime = startTime + event.t;
    
    // If event is past the lookahead window, stop checking
    if (eventTime >= currentTime + SCHEDULE_AHEAD_SEC) {
      break;
    }
    
    // Skip events that are already in the past
    if (eventTime < currentTime) {
      nextNoteIndex++;
      continue;
    }
    
    // Check mute/solo state
    if (shouldPlayEvent(event)) {
      scheduleEventIfInWindow(event, eventTime, currentTime);
    }
    
    nextNoteIndex++;
  }
  
  // Check if we've finished all events
  if (nextNoteIndex >= scheduledEvents.length) {
    const lastEvent = scheduledEvents[scheduledEvents.length - 1];
    const endTime = lastEvent ? startTime + lastEvent.t + lastEvent.dur : startTime;
    
    // Stop when all events have finished playing
    if (currentTime > endTime) {
      stop();
    }
  }
}

/**
 * Schedule events with looping (9.2.x)
 */
function scheduleWithLooping(currentTime: number, elapsed: number): void {
  // Calculate current position in loop
  const loopPosition = elapsed % loopDurationSec;
  const newLoopIteration = Math.floor(elapsed / loopDurationSec);
  
  // Check if we've entered a new loop iteration
  if (newLoopIteration > currentLoopIteration) {
    currentLoopIteration = newLoopIteration;
    scheduledInCurrentLoop.clear();
    nextNoteIndex = 0;
  }
  
  // Calculate the time at the start of the current loop
  const loopStartTime = startTime + (currentLoopIteration * loopDurationSec);
  
  // Schedule events for the current loop iteration
  while (nextNoteIndex < scheduledEvents.length) {
    const event = scheduledEvents[nextNoteIndex];
    
    // Skip events past the loop boundary
    if (event.t >= loopDurationSec) {
      nextNoteIndex++;
      continue;
    }
    
    // Calculate absolute event time in this loop iteration
    const eventTime = loopStartTime + event.t;
    
    // If event is past the lookahead window, stop checking
    if (eventTime >= currentTime + SCHEDULE_AHEAD_SEC) {
      break;
    }
    
    // Skip events that are already in the past
    if (eventTime < currentTime) {
      nextNoteIndex++;
      continue;
    }
    
    // Prevent double-scheduling (9.2.4)
    if (scheduledInCurrentLoop.has(nextNoteIndex)) {
      nextNoteIndex++;
      continue;
    }
    
    // Check mute/solo state
    if (shouldPlayEvent(event)) {
      if (scheduleEventIfInWindow(event, eventTime, currentTime)) {
        scheduledInCurrentLoop.add(nextNoteIndex);
      }
    }
    
    nextNoteIndex++;
  }
  
  // Also check for upcoming events in the next loop iteration (for seamless looping)
  if (loopPosition + SCHEDULE_AHEAD_SEC >= loopDurationSec) {
    const nextLoopStartTime = loopStartTime + loopDurationSec;
    
    for (let i = 0; i < scheduledEvents.length; i++) {
      const event = scheduledEvents[i];
      
      // Skip events past the loop boundary
      if (event.t >= loopDurationSec) continue;
      
      const eventTime = nextLoopStartTime + event.t;
      
      // Only schedule events in the next loop that fall within lookahead
      if (eventTime >= currentTime && eventTime < currentTime + SCHEDULE_AHEAD_SEC) {
        // Check mute/solo state
        if (shouldPlayEvent(event)) {
          scheduleEventIfInWindow(event, eventTime, currentTime);
        }
      }
    }
  }
}

// ============================================================================
// Transport Controls
// ============================================================================

/**
 * Calculate loop duration in seconds from bars and BPM (9.2.1)
 * @param bars - Number of bars
 * @param bpm - Beats per minute
 * @returns Duration in seconds
 */
export function calculateLoopDuration(bars: number, bpm: number): number {
  // Assuming 4/4 time signature (4 beats per bar)
  const beatsPerBar = 4;
  const totalBeats = bars * beatsPerBar;
  const secondsPerBeat = 60 / bpm;
  return totalBeats * secondsPerBeat;
}

/**
 * Initialize the scheduler with events and configuration.
 * @param config - Scheduler configuration
 */
export function initScheduler(config: SchedulerConfig): void {
  scheduledEvents = [...config.events].sort((a, b) => a.t - b.t);
  currentBpm = config.bpm;
  loopBars = config.loopBars ?? 0;
  loopEnabled = config.loopEnabled ?? (loopBars > 0);
  loopDurationSec = loopBars > 0 ? calculateLoopDuration(loopBars, currentBpm) : 0;
  onTransportStateChange = config.onTransportStateChange ?? null;
  onPlayheadUpdate = config.onPlayheadUpdate ?? null;
  
  // Reset state
  nextNoteIndex = 0;
  scheduledInCurrentLoop.clear();
  currentLoopIteration = 0;
  mutedTracks.clear();
  soloedTracks.clear();
}

/**
 * Start playback from the beginning or current position.
 */
export async function play(): Promise<void> {
  if (playing) return;
  
  await ensureAudioContextResumed();
  
  const ctx = getAudioContext();
  startTime = ctx.currentTime;
  playing = true;
  nextNoteIndex = 0;
  scheduledInCurrentLoop.clear();
  currentLoopIteration = 0;
  
  // Start the lookahead scheduler timer (9.1.3)
  timerID = window.setInterval(scheduler, LOOKAHEAD_MS);
  
  // Notify state change
  notifyTransportStateChange();
}

/**
 * Stop playback and cleanup (9.1.7)
 */
export function stop(): void {
  if (!playing && timerID === null) return;
  
  playing = false;
  
  // Clear the scheduler timer
  if (timerID !== null) {
    clearInterval(timerID);
    timerID = null;
  }
  
  // Stop all audio
  engineStopPlayback();
  
  // Reset state
  nextNoteIndex = 0;
  scheduledInCurrentLoop.clear();
  currentLoopIteration = 0;
  
  // Notify state change
  notifyTransportStateChange();
}

/**
 * Restart playback from the beginning (9.3.2)
 */
export async function restart(): Promise<void> {
  stop();
  await play();
}

/**
 * Toggle loop mode (9.2.5)
 * @param enabled - Whether looping should be enabled
 */
export function setLoopEnabled(enabled: boolean): void {
  loopEnabled = enabled;
  notifyTransportStateChange();
}

/**
 * Get current loop enabled state
 */
export function isLoopEnabled(): boolean {
  return loopEnabled;
}

/**
 * Check if scheduler is currently playing
 */
export function isSchedulerPlaying(): boolean {
  return playing;
}

/**
 * Get current BPM
 */
export function getCurrentBpm(): number {
  return currentBpm;
}

/**
 * Get current loop bars setting
 */
export function getLoopBars(): number {
  return loopBars;
}

/**
 * Get current playhead position in seconds
 */
export function getPlayheadPosition(): number {
  if (!playing) return 0;
  
  const ctx = getAudioContext();
  const elapsed = ctx.currentTime - startTime;
  
  if (loopEnabled && loopDurationSec > 0) {
    return elapsed % loopDurationSec;
  }
  
  return elapsed;
}

/**
 * Get current transport state
 */
export function getTransportState(): TransportState {
  return {
    playing,
    currentTime: getPlayheadPosition(),
    loopEnabled,
    loopBars,
    bpm: currentBpm,
  };
}

// ============================================================================
// Track Mute/Solo (9.4.x)
// ============================================================================

/**
 * Set mute state for a track (9.4.1, 9.4.3)
 * @param trackName - Name of the track
 * @param muted - Whether the track should be muted
 */
export function setTrackMuted(trackName: string, muted: boolean): void {
  if (muted) {
    mutedTracks.add(trackName);
  } else {
    mutedTracks.delete(trackName);
  }
}

/**
 * Set solo state for a track (9.4.2, 9.4.3)
 * @param trackName - Name of the track
 * @param soloed - Whether the track should be soloed
 */
export function setTrackSoloed(trackName: string, soloed: boolean): void {
  if (soloed) {
    soloedTracks.add(trackName);
  } else {
    soloedTracks.delete(trackName);
  }
}

/**
 * Check if a track is muted
 * @param trackName - Name of the track
 * @returns True if the track is muted
 */
export function isTrackMuted(trackName: string): boolean {
  return mutedTracks.has(trackName);
}

/**
 * Check if a track is soloed
 * @param trackName - Name of the track
 * @returns True if the track is soloed
 */
export function isTrackSoloed(trackName: string): boolean {
  return soloedTracks.has(trackName);
}

/**
 * Get list of all muted tracks
 */
export function getMutedTracks(): string[] {
  return Array.from(mutedTracks);
}

/**
 * Get list of all soloed tracks
 */
export function getSoloedTracks(): string[] {
  return Array.from(soloedTracks);
}

/**
 * Clear all mute/solo states
 */
export function clearMuteSoloState(): void {
  mutedTracks.clear();
  soloedTracks.clear();
}

/**
 * Get track names from events
 * @param events - Array of synth events
 * @returns Array of unique track names
 */
export function getTrackNames(events: SynthEvent[]): string[] {
  const trackNames = new Set<string>();
  for (const event of events) {
    trackNames.add(event.track ?? 'default');
  }
  return Array.from(trackNames);
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Notify transport state change callback
 */
function notifyTransportStateChange(): void {
  if (onTransportStateChange) {
    onTransportStateChange(getTransportState());
  }
}

// ============================================================================
// Exports for Testing
// ============================================================================

export const _testExports = {
  SCHEDULE_AHEAD_SEC,
  LOOKAHEAD_MS,
  shouldPlayEvent,
  calculateLoopDuration,
};
