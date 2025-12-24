/**
 * Unit tests for the Audio Engine module.
 * 
 * Since Web Audio API is not available in Node.js test environment,
 * we mock the AudioContext and related classes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SynthEvent } from '../../dsl/compiler';

// Mock Web Audio API classes
class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockOscillatorNode {
  type: OscillatorType = 'sine';
  frequency = {
    value: 440,
    setValueAtTime: vi.fn(),
  };
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockAudioContext {
  currentTime = 0;
  state: AudioContextState = 'running';
  destination = {};
  
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createGain = vi.fn(() => new MockGainNode());
  resume = vi.fn(() => Promise.resolve());
}

describe('Audio Engine', () => {
  // Import engine after mocking AudioContext
  let engine: typeof import('../engine');

  beforeEach(async () => {
    // Reset modules to get fresh state
    vi.resetModules();
    
    // Re-stub AudioContext after module reset - must use class directly
    vi.stubGlobal('AudioContext', MockAudioContext);
    
    // Re-import to get fresh singleton state
    engine = await import('../engine');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAudioContext', () => {
    it('should create AudioContext on first call', () => {
      const ctx = engine.getAudioContext();
      expect(ctx).toBeDefined();
      expect(ctx).toBeInstanceOf(MockAudioContext);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const ctx1 = engine.getAudioContext();
      const ctx2 = engine.getAudioContext();
      expect(ctx1).toBe(ctx2);
    });
  });

  describe('ensureAudioContextResumed', () => {
    it('should resume suspended context', async () => {
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;
      ctx.state = 'suspended';
      
      await engine.ensureAudioContextResumed();
      
      expect(ctx.resume).toHaveBeenCalled();
    });

    it('should not call resume if context is running', async () => {
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;
      ctx.state = 'running';
      
      await engine.ensureAudioContextResumed();
      
      expect(ctx.resume).not.toHaveBeenCalled();
    });
  });

  describe('scheduleEvents', () => {
    it('should schedule note events with oscillator and gain', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sine',
        },
      ];

      engine.scheduleEvents(events);
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;

      expect(ctx.createOscillator).toHaveBeenCalled();
      expect(ctx.createGain).toHaveBeenCalled();
    });

    it('should skip rest events', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'rest',
          midi: null,
          freq: null,
          vel: 0,
          inst: 'synth',
          waveform: 'sine',
        },
      ];

      engine.scheduleEvents(events);
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;

      expect(ctx.createOscillator).not.toHaveBeenCalled();
    });

    it('should return a playback token', () => {
      const events: SynthEvent[] = [];
      const token = engine.scheduleEvents(events);
      
      expect(typeof token).toBe('number');
      expect(token).toBeGreaterThan(0);
    });

    it('should increment token on each call', () => {
      const token1 = engine.scheduleEvents([]);
      const token2 = engine.scheduleEvents([]);
      
      expect(token2).toBe(token1 + 1);
    });

    it('should set correct waveform type', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'square',
        },
      ];

      engine.scheduleEvents(events);
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;
      
      // Get the created oscillator
      const oscillator = ctx.createOscillator.mock.results[0].value;
      expect(oscillator.type).toBe('square');
    });

    it('should apply ADSR envelope to gain node', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sine',
        },
      ];

      engine.scheduleEvents(events);
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;
      
      // Get the created gain node
      const gainNode = ctx.createGain.mock.results[0].value;
      
      // Verify envelope was applied
      expect(gainNode.gain.setValueAtTime).toHaveBeenCalled();
      expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenCalled();
    });

    it('should schedule oscillator start and stop', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sine',
        },
      ];

      engine.scheduleEvents(events);
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;
      
      // Get the created oscillator
      const oscillator = ctx.createOscillator.mock.results[0].value;
      
      expect(oscillator.start).toHaveBeenCalled();
      expect(oscillator.stop).toHaveBeenCalled();
    });

    it('should skip events before startOffset', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sine',
        },
        {
          t: 1,
          dur: 0.5,
          kind: 'note',
          midi: 62,
          freq: 293.66,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sine',
        },
      ];

      engine.scheduleEvents(events, 0.5);
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;

      // Only the second event should be scheduled
      expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopPlayback', () => {
    it('should stop all active oscillators', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sine',
        },
      ];

      engine.scheduleEvents(events);
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;
      const oscillator = ctx.createOscillator.mock.results[0].value;

      engine.stopPlayback();

      // stop() is called twice: once during scheduling, once during stopPlayback
      expect(oscillator.stop).toHaveBeenCalled();
      expect(oscillator.disconnect).toHaveBeenCalled();
    });

    it('should clear active nodes', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sine',
        },
      ];

      engine.scheduleEvents(events);
      expect(engine.getActiveNodeCount()).toBe(1);

      engine.stopPlayback();
      expect(engine.getActiveNodeCount()).toBe(0);
    });

    it('should increment playback token to invalidate pending schedules', () => {
      const tokenBefore = engine.getCurrentPlaybackToken();
      engine.stopPlayback();
      const tokenAfter = engine.getCurrentPlaybackToken();

      expect(tokenAfter).toBe(tokenBefore + 1);
    });
  });

  describe('isPlaying', () => {
    it('should return false when no nodes are active', () => {
      expect(engine.isPlaying()).toBe(false);
    });

    it('should return true when nodes are active', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sine',
        },
      ];

      engine.scheduleEvents(events);
      expect(engine.isPlaying()).toBe(true);
    });

    it('should return false after stopPlayback', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sine',
        },
      ];

      engine.scheduleEvents(events);
      engine.stopPlayback();
      expect(engine.isPlaying()).toBe(false);
    });
  });

  describe('getActiveNodeCount', () => {
    it('should return 0 initially', () => {
      expect(engine.getActiveNodeCount()).toBe(0);
    });

    it('should return correct count after scheduling', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sine',
        },
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 64,
          freq: 329.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sine',
        },
      ];

      engine.scheduleEvents(events);
      expect(engine.getActiveNodeCount()).toBe(2);
    });
  });

  describe('waveform handling', () => {
    it('should default to sine for invalid waveform', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'invalid_waveform',
        },
      ];

      engine.scheduleEvents(events);
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;
      const oscillator = ctx.createOscillator.mock.results[0].value;
      
      expect(oscillator.type).toBe('sine');
    });

    it('should accept triangle waveform', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'triangle',
        },
      ];

      engine.scheduleEvents(events);
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;
      const oscillator = ctx.createOscillator.mock.results[0].value;
      
      expect(oscillator.type).toBe('triangle');
    });

    it('should accept sawtooth waveform', () => {
      const events: SynthEvent[] = [
        {
          t: 0,
          dur: 0.5,
          kind: 'note',
          midi: 60,
          freq: 261.63,
          vel: 0.8,
          inst: 'synth',
          waveform: 'sawtooth',
        },
      ];

      engine.scheduleEvents(events);
      const ctx = engine.getAudioContext() as unknown as MockAudioContext;
      const oscillator = ctx.createOscillator.mock.results[0].value;
      
      expect(oscillator.type).toBe('sawtooth');
    });
  });
});
