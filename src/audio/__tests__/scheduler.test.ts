/**
 * Tests for the Lookahead Scheduler Module
 * Tests cover:
 * - Loop duration calculation (9.2.1)
 * - Track mute/solo filtering (9.4.x)
 * - Scheduler configuration (9.1.x)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateLoopDuration,
  initScheduler,
  isLoopEnabled,
  setLoopEnabled,
  isSchedulerPlaying,
  getCurrentBpm,
  getLoopBars,
  setTrackMuted,
  setTrackSoloed,
  isTrackMuted,
  isTrackSoloed,
  getMutedTracks,
  getSoloedTracks,
  clearMuteSoloState,
  getTrackNames,
  getTransportState,
  _testExports,
} from '../scheduler';
import type { SynthEvent } from '../../dsl/compiler';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock SynthEvent for testing
 */
function createMockEvent(overrides: Partial<SynthEvent> = {}): SynthEvent {
  return {
    t: 0,
    dur: 0.5,
    kind: 'note',
    midi: 60,
    freq: 261.63,
    vel: 0.8,
    inst: 'test',
    waveform: 'sine',
    track: 'default',
    ...overrides,
  };
}

// ============================================================================
// Loop Duration Calculation Tests (9.2.1)
// ============================================================================

describe('calculateLoopDuration', () => {
  it('should calculate loop duration for 1 bar at 120 BPM', () => {
    // 1 bar = 4 beats at 120 BPM = 4 * (60/120) = 2 seconds
    const duration = calculateLoopDuration(1, 120);
    expect(duration).toBe(2);
  });

  it('should calculate loop duration for 4 bars at 120 BPM', () => {
    // 4 bars = 16 beats at 120 BPM = 16 * (60/120) = 8 seconds
    const duration = calculateLoopDuration(4, 120);
    expect(duration).toBe(8);
  });

  it('should calculate loop duration for 2 bars at 60 BPM', () => {
    // 2 bars = 8 beats at 60 BPM = 8 * (60/60) = 8 seconds
    const duration = calculateLoopDuration(2, 60);
    expect(duration).toBe(8);
  });

  it('should calculate loop duration for 1 bar at 180 BPM', () => {
    // 1 bar = 4 beats at 180 BPM = 4 * (60/180) = 1.333... seconds
    const duration = calculateLoopDuration(1, 180);
    expect(duration).toBeCloseTo(1.333, 2);
  });

  it('should handle fractional results correctly', () => {
    // 3 bars at 90 BPM = 12 beats * (60/90) = 8 seconds
    const duration = calculateLoopDuration(3, 90);
    expect(duration).toBe(8);
  });
});

// ============================================================================
// Scheduler Initialization Tests (9.1.x)
// ============================================================================

describe('initScheduler', () => {
  const mockEvents: SynthEvent[] = [
    createMockEvent({ t: 0, track: 'drums' }),
    createMockEvent({ t: 0.5, track: 'bass' }),
    createMockEvent({ t: 1, track: 'drums' }),
  ];

  beforeEach(() => {
    clearMuteSoloState();
  });

  it('should initialize with provided BPM', () => {
    initScheduler({
      events: mockEvents,
      bpm: 140,
    });
    expect(getCurrentBpm()).toBe(140);
  });

  it('should initialize with loop bars', () => {
    initScheduler({
      events: mockEvents,
      bpm: 120,
      loopBars: 4,
    });
    expect(getLoopBars()).toBe(4);
  });

  it('should enable loop by default when loopBars is set', () => {
    initScheduler({
      events: mockEvents,
      bpm: 120,
      loopBars: 2,
    });
    expect(isLoopEnabled()).toBe(true);
  });

  it('should not enable loop when loopBars is 0', () => {
    initScheduler({
      events: mockEvents,
      bpm: 120,
      loopBars: 0,
    });
    expect(isLoopEnabled()).toBe(false);
  });

  it('should respect explicit loopEnabled setting', () => {
    initScheduler({
      events: mockEvents,
      bpm: 120,
      loopBars: 4,
      loopEnabled: false,
    });
    expect(isLoopEnabled()).toBe(false);
  });

  it('should not be playing after initialization', () => {
    initScheduler({
      events: mockEvents,
      bpm: 120,
    });
    expect(isSchedulerPlaying()).toBe(false);
  });

  it('should clear mute/solo state on initialization', () => {
    setTrackMuted('drums', true);
    setTrackSoloed('bass', true);
    
    initScheduler({
      events: mockEvents,
      bpm: 120,
    });
    
    expect(getMutedTracks()).toHaveLength(0);
    expect(getSoloedTracks()).toHaveLength(0);
  });
});

// ============================================================================
// Loop Toggle Tests (9.2.5)
// ============================================================================

describe('setLoopEnabled', () => {
  beforeEach(() => {
    initScheduler({
      events: [createMockEvent()],
      bpm: 120,
      loopBars: 4,
      loopEnabled: false,
    });
  });

  it('should enable loop mode', () => {
    setLoopEnabled(true);
    expect(isLoopEnabled()).toBe(true);
  });

  it('should disable loop mode', () => {
    setLoopEnabled(true);
    setLoopEnabled(false);
    expect(isLoopEnabled()).toBe(false);
  });
});

// ============================================================================
// Track Mute Tests (9.4.1, 9.4.3)
// ============================================================================

describe('Track Mute', () => {
  beforeEach(() => {
    clearMuteSoloState();
  });

  it('should mute a track', () => {
    setTrackMuted('drums', true);
    expect(isTrackMuted('drums')).toBe(true);
  });

  it('should unmute a track', () => {
    setTrackMuted('drums', true);
    setTrackMuted('drums', false);
    expect(isTrackMuted('drums')).toBe(false);
  });

  it('should return false for non-muted tracks', () => {
    expect(isTrackMuted('bass')).toBe(false);
  });

  it('should track multiple muted tracks', () => {
    setTrackMuted('drums', true);
    setTrackMuted('bass', true);
    
    expect(getMutedTracks()).toContain('drums');
    expect(getMutedTracks()).toContain('bass');
    expect(getMutedTracks()).toHaveLength(2);
  });

  it('should clear mute state', () => {
    setTrackMuted('drums', true);
    setTrackMuted('bass', true);
    clearMuteSoloState();
    
    expect(getMutedTracks()).toHaveLength(0);
  });
});

// ============================================================================
// Track Solo Tests (9.4.2, 9.4.3)
// ============================================================================

describe('Track Solo', () => {
  beforeEach(() => {
    clearMuteSoloState();
  });

  it('should solo a track', () => {
    setTrackSoloed('drums', true);
    expect(isTrackSoloed('drums')).toBe(true);
  });

  it('should unsolo a track', () => {
    setTrackSoloed('drums', true);
    setTrackSoloed('drums', false);
    expect(isTrackSoloed('drums')).toBe(false);
  });

  it('should return false for non-soloed tracks', () => {
    expect(isTrackSoloed('bass')).toBe(false);
  });

  it('should track multiple soloed tracks (9.4.6)', () => {
    setTrackSoloed('drums', true);
    setTrackSoloed('bass', true);
    
    expect(getSoloedTracks()).toContain('drums');
    expect(getSoloedTracks()).toContain('bass');
    expect(getSoloedTracks()).toHaveLength(2);
  });

  it('should clear solo state', () => {
    setTrackSoloed('drums', true);
    setTrackSoloed('bass', true);
    clearMuteSoloState();
    
    expect(getSoloedTracks()).toHaveLength(0);
  });
});

// ============================================================================
// Mute/Solo Interaction Tests (9.4.5)
// ============================================================================

describe('shouldPlayEvent (Mute/Solo Logic)', () => {
  const { shouldPlayEvent } = _testExports;

  beforeEach(() => {
    clearMuteSoloState();
  });

  it('should play event when no mute/solo is set', () => {
    const event = createMockEvent({ track: 'drums' });
    expect(shouldPlayEvent(event)).toBe(true);
  });

  it('should not play muted track', () => {
    setTrackMuted('drums', true);
    const event = createMockEvent({ track: 'drums' });
    expect(shouldPlayEvent(event)).toBe(false);
  });

  it('should play non-muted track when another is muted', () => {
    setTrackMuted('drums', true);
    const event = createMockEvent({ track: 'bass' });
    expect(shouldPlayEvent(event)).toBe(true);
  });

  it('should play soloed track', () => {
    setTrackSoloed('drums', true);
    const event = createMockEvent({ track: 'drums' });
    expect(shouldPlayEvent(event)).toBe(true);
  });

  it('should not play non-soloed track when another is soloed', () => {
    setTrackSoloed('drums', true);
    const event = createMockEvent({ track: 'bass' });
    expect(shouldPlayEvent(event)).toBe(false);
  });

  it('should play multiple soloed tracks (9.4.6)', () => {
    setTrackSoloed('drums', true);
    setTrackSoloed('bass', true);
    
    expect(shouldPlayEvent(createMockEvent({ track: 'drums' }))).toBe(true);
    expect(shouldPlayEvent(createMockEvent({ track: 'bass' }))).toBe(true);
    expect(shouldPlayEvent(createMockEvent({ track: 'lead' }))).toBe(false);
  });

  it('should give solo precedence over mute (9.4.5)', () => {
    // When a track is both muted and soloed, solo wins
    setTrackMuted('drums', true);
    setTrackSoloed('drums', true);
    
    const event = createMockEvent({ track: 'drums' });
    expect(shouldPlayEvent(event)).toBe(true);
  });

  it('should handle default track name for events without track', () => {
    const event = createMockEvent();
    delete event.track;
    
    setTrackMuted('default', true);
    expect(shouldPlayEvent(event)).toBe(false);
  });
});

// ============================================================================
// Track Names Extraction Tests
// ============================================================================

describe('getTrackNames', () => {
  it('should extract unique track names from events', () => {
    const events: SynthEvent[] = [
      createMockEvent({ track: 'drums' }),
      createMockEvent({ track: 'bass' }),
      createMockEvent({ track: 'drums' }),
      createMockEvent({ track: 'lead' }),
    ];
    
    const names = getTrackNames(events);
    expect(names).toContain('drums');
    expect(names).toContain('bass');
    expect(names).toContain('lead');
    expect(names).toHaveLength(3);
  });

  it('should use "default" for events without track', () => {
    const events: SynthEvent[] = [
      createMockEvent({ track: undefined }),
      createMockEvent({ track: 'bass' }),
    ];
    
    const names = getTrackNames(events);
    expect(names).toContain('default');
    expect(names).toContain('bass');
  });

  it('should return empty array for no events', () => {
    const names = getTrackNames([]);
    expect(names).toHaveLength(0);
  });
});

// ============================================================================
// Transport State Tests
// ============================================================================

describe('getTransportState', () => {
  beforeEach(() => {
    initScheduler({
      events: [createMockEvent()],
      bpm: 140,
      loopBars: 2,
      loopEnabled: true,
    });
  });

  it('should return current transport state', () => {
    const state = getTransportState();
    
    expect(state.playing).toBe(false);
    expect(state.bpm).toBe(140);
    expect(state.loopBars).toBe(2);
    expect(state.loopEnabled).toBe(true);
    expect(state.currentTime).toBe(0);
  });

  it('should reflect loop toggle changes', () => {
    setLoopEnabled(false);
    const state = getTransportState();
    expect(state.loopEnabled).toBe(false);
  });
});

// ============================================================================
// Configuration Constants Tests
// ============================================================================

describe('Scheduler Constants', () => {
  it('should have correct SCHEDULE_AHEAD_SEC value (9.1.2)', () => {
    expect(_testExports.SCHEDULE_AHEAD_SEC).toBe(0.2);
  });

  it('should have correct LOOKAHEAD_MS value (9.1.3)', () => {
    expect(_testExports.LOOKAHEAD_MS).toBe(25);
  });
});
