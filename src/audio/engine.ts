/**
 * Audio Engine Module
 * Manages Web Audio API context, scheduling, and playback control.
 */

import type { SynthEvent } from '../dsl/compiler';

// ============================================================================
// Audio Context Management (5.1.x)
// ============================================================================

/**
 * Singleton AudioContext instance.
 * Created lazily on first call to getAudioContext().
 */
let audioContext: AudioContext | null = null;

/**
 * Singleton AnalyserNode for audio visualization.
 * Created lazily along with the AudioContext.
 */
let analyserNode: AnalyserNode | null = null;

/**
 * Get the singleton AudioContext, creating it lazily on first call.
 * This should be called in response to a user gesture to comply with
 * browser autoplay policies.
 * @returns The AudioContext instance
 */
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
    // Create analyser node for visualization (if available - may not exist in test environments)
    if (typeof audioContext.createAnalyser === 'function') {
      analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;
      // Connect analyser to destination
      analyserNode.connect(audioContext.destination);
    }
  }
  return audioContext;
}

/**
 * Get the singleton AnalyserNode for audio visualization.
 * Must be called after getAudioContext() to ensure the analyser exists.
 * @returns The AnalyserNode instance or null if not yet created
 */
export function getAnalyser(): AnalyserNode | null {
  return analyserNode;
}

/**
 * Resume the AudioContext if it's suspended.
 * Browsers may suspend AudioContext until a user gesture occurs.
 * @returns Promise that resolves when the context is running
 */
export async function ensureAudioContextResumed(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

// ============================================================================
// Active Node Tracking (5.3.x)
// ============================================================================

/**
 * Represents an active audio node pair (oscillator + gain).
 */
interface ActiveNode {
  oscillator: OscillatorNode;
  gain: GainNode;
}

/**
 * Array to track all active oscillator/gain nodes for cleanup.
 */
let activeNodes: ActiveNode[] = [];

/**
 * Playback token to invalidate stale schedules.
 * Incremented on each new playback, checked before node creation.
 */
let currentPlaybackToken = 0;

// ============================================================================
// ADSR Envelope Constants
// ============================================================================

/**
 * ADSR envelope timing constants (in seconds).
 * These create a quick attack with natural decay for musical sounds.
 */
const ENVELOPE = {
  /** Attack time: ramp from 0 to peak */
  ATTACK: 0.005,
  /** Decay time: ramp from peak to sustain level */
  DECAY: 0.05,
  /** Sustain level: fraction of peak volume (0-1) */
  SUSTAIN_LEVEL: 0.7,
  /** Release time: ramp from sustain to 0 after note ends */
  RELEASE: 0.08,
};

// ============================================================================
// Audio Scheduling Engine (5.2.x)
// ============================================================================

/**
 * Map waveform string to OscillatorType.
 * @param waveform - Waveform name from SynthEvent
 * @returns Valid OscillatorType
 */
function getOscillatorType(waveform: string): OscillatorType {
  const validTypes: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];
  if (validTypes.includes(waveform as OscillatorType)) {
    return waveform as OscillatorType;
  }
  return 'sine'; // Default fallback
}

/**
 * Schedule a single note event with ADSR envelope.
 * 
 * Audio graph: OscillatorNode → GainNode → destination
 * 
 * ADSR Envelope applied to GainNode:
 * - Attack: Quick ramp to peak (prevents clicks)
 * - Decay: Ramp down to sustain level
 * - Sustain: Hold level for note duration
 * - Release: Ramp to 0 after note ends
 * 
 * @param ctx - AudioContext
 * @param event - SynthEvent to schedule
 * @param startTime - Absolute start time in AudioContext time
 * @param playbackToken - Token to validate this schedule is still active
 */
export function scheduleNote(
  ctx: AudioContext,
  event: SynthEvent,
  startTime: number,
  playbackToken: number
): void {
  // Skip rests - they don't produce sound
  if (event.kind === 'rest' || event.freq === null) {
    return;
  }

  // Check if this playback session is still valid
  if (playbackToken !== currentPlaybackToken) {
    return;
  }

  // Create oscillator with correct frequency and waveform
  const oscillator = ctx.createOscillator();
  oscillator.type = getOscillatorType(event.waveform);
  oscillator.frequency.setValueAtTime(event.freq, startTime);

  // Create gain node for envelope and velocity control
  const gainNode = ctx.createGain();
  
  // Connect audio graph: Oscillator → Gain → Analyser → Destination
  oscillator.connect(gainNode);
  // Route through analyser for visualization, fall back to destination if analyser not ready
  const outputNode = analyserNode || ctx.destination;
  gainNode.connect(outputNode);

  // Calculate envelope timing
  const noteStart = startTime;
  const attackEnd = noteStart + ENVELOPE.ATTACK;
  const decayEnd = attackEnd + ENVELOPE.DECAY;
  const sustainEnd = noteStart + event.dur; // End of note duration
  const releaseEnd = sustainEnd + ENVELOPE.RELEASE;

  // Peak gain adjusted by velocity
  const peakGain = event.vel;
  const sustainGain = peakGain * ENVELOPE.SUSTAIN_LEVEL;

  // Apply ADSR envelope to gain
  // Start at 0 (silent)
  gainNode.gain.setValueAtTime(0, noteStart);
  
  // Attack: ramp to peak
  gainNode.gain.linearRampToValueAtTime(peakGain, attackEnd);
  
  // Decay: ramp to sustain level
  gainNode.gain.linearRampToValueAtTime(sustainGain, decayEnd);
  
  // Sustain: hold level (implicit - value stays until next change)
  // If note is shorter than attack+decay, the sustain phase is skipped
  
  // Release: ramp to 0
  // Schedule release from wherever we are at sustainEnd
  gainNode.gain.setValueAtTime(sustainGain, sustainEnd);
  gainNode.gain.linearRampToValueAtTime(0, releaseEnd);

  // Schedule oscillator start and stop
  oscillator.start(noteStart);
  oscillator.stop(releaseEnd);

  // Track active nodes for cleanup
  const activeNode: ActiveNode = { oscillator, gain: gainNode };
  activeNodes.push(activeNode);

  // Auto-cleanup when oscillator ends naturally
  oscillator.onended = () => {
    const index = activeNodes.indexOf(activeNode);
    if (index !== -1) {
      activeNodes.splice(index, 1);
    }
    // Disconnect nodes to free resources
    oscillator.disconnect();
    gainNode.disconnect();
  };
}

/**
 * Schedule multiple events for playback.
 * 
 * Scheduling strategy:
 * - Uses a base startTime of currentTime + 0.1s to allow for scheduling overhead
 * - All events are scheduled relative to this base time
 * - The startOffset parameter allows resuming playback from a specific point
 * 
 * @param events - Array of SynthEvents to schedule
 * @param startOffset - Time offset in seconds (for resuming playback)
 * @returns The playback token for this schedule
 */
export function scheduleEvents(events: SynthEvent[], startOffset: number = 0): number {
  const ctx = getAudioContext();
  
  // Increment playback token to invalidate any previous schedules
  currentPlaybackToken++;
  const token = currentPlaybackToken;
  
  // Base start time: current time + 100ms buffer for scheduling overhead
  // This prevents timing issues when scheduling many events
  const baseStartTime = ctx.currentTime + 0.1;

  // Schedule each event
  for (const event of events) {
    // Skip events that start before our offset
    if (event.t < startOffset) {
      continue;
    }
    
    // Calculate absolute start time for this event
    const eventStartTime = baseStartTime + (event.t - startOffset);
    
    scheduleNote(ctx, event, eventStartTime, token);
  }

  return token;
}

// ============================================================================
// Stop and Cleanup (5.3.x)
// ============================================================================

/**
 * Stop all playback immediately and clean up audio resources.
 * 
 * This function:
 * 1. Invalidates the current playback token (prevents new nodes from being created)
 * 2. Stops all active oscillators immediately
 * 3. Disconnects all nodes from the audio graph
 * 4. Clears the active nodes array
 */
export function stopPlayback(): void {
  // Increment token to invalidate any pending schedules
  currentPlaybackToken++;

  // Stop and disconnect all active nodes
  for (const node of activeNodes) {
    try {
      // Stop oscillator immediately
      node.oscillator.stop();
    } catch (e) {
      // Oscillator may have already stopped - ignore error
    }
    
    // Disconnect from audio graph
    node.oscillator.disconnect();
    node.gain.disconnect();
  }

  // Clear the active nodes array
  activeNodes = [];
}

/**
 * Get the current playback token.
 * Useful for checking if a playback session is still valid.
 * @returns Current playback token number
 */
export function getCurrentPlaybackToken(): number {
  return currentPlaybackToken;
}

/**
 * Check if there are any active nodes (i.e., sound is playing).
 * @returns True if there are active audio nodes
 */
export function isPlaying(): boolean {
  return activeNodes.length > 0;
}

/**
 * Get the number of currently active audio nodes.
 * Useful for debugging and monitoring.
 * @returns Number of active nodes
 */
export function getActiveNodeCount(): number {
  return activeNodes.length;
}
