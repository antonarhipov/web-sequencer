/**
 * Phase 11 Tests - Error Handling and Testing (v0.2)
 * Tests for: enhanced error messages, backward compatibility, MVP syntax support
 */

import { describe, it, expect } from 'vitest';
import { parse, ParseError } from '../parser';
import { tokenize } from '../tokenizer';
import { compileFromSource } from '../compiler';

// Helper to parse DSL source
function parseDSL(source: string) {
  return parse(tokenize(source));
}

describe('Phase 11: Error Handling and Testing', () => {
  describe('11.1 Enhanced Error Messages', () => {
    describe('11.1.1 Undefined instrument in track', () => {
      it('should throw error with helpful message when instrument is undefined', () => {
        expect(() => compileFromSource('track melody inst=undefined: C4 1/4'))
          .toThrow('undefined instrument');
      });

      it('should list available instruments in error message', () => {
        const source = `
          inst lead sine
          inst bass square
          track melody inst=unknown: C4 1/4
        `;
        expect(() => compileFromSource(source))
          .toThrow('Available instruments: lead, bass');
      });

      it('should show available instruments when referencing non-existent one', () => {
        // Default instrument 'lead' is always available, so test with custom instrument
        const source = `
          inst custom sine
          track melody inst=nonexistent: C4 1/4
        `;
        expect(() => compileFromSource(source))
          .toThrow('Available instruments: custom');
      });
    });

    describe('11.1.2 Undefined pattern in use', () => {
      it('should throw error with helpful message when pattern is undefined', () => {
        expect(() => compileFromSource('seq: use undefined'))
          .toThrow('not defined');
      });

      it('should list available patterns in error message', () => {
        const source = `
          pattern riff: C4 1/4
          pattern melody: D4 1/4
          seq: use unknown
        `;
        expect(() => compileFromSource(source))
          .toThrow('Available patterns: riff, melody');
      });

      it('should suggest defining pattern when none exist', () => {
        expect(() => compileFromSource('seq: use riff'))
          .toThrow('No patterns defined');
      });
    });

    describe('11.1.3 Swing value validation', () => {
      it('should throw error for swing value above 0.75', () => {
        expect(() => parseDSL('swing 0.8')).toThrow(ParseError);
        expect(() => parseDSL('swing 0.8')).toThrow('Must be between 0 and 0.75');
      });

      it('should throw error for swing value of 1', () => {
        expect(() => parseDSL('swing 1')).toThrow('Must be between 0 and 0.75');
      });

      it('should accept swing at boundary values', () => {
        expect(parseDSL('swing 0').globalSettings.swing).toBe(0);
        expect(parseDSL('swing 0.75').globalSettings.swing).toBe(0.75);
      });
    });

    describe('11.1.4 Grid value validation', () => {
      it('should throw error for invalid grid value', () => {
        expect(() => parseDSL('grid 5')).toThrow(ParseError);
        expect(() => parseDSL('grid 5')).toThrow('Must be one of');
      });

      it('should throw error for grid value 3', () => {
        expect(() => parseDSL('grid 3')).toThrow('Must be one of: 2, 4, 8, 16, 32, 64');
      });

      it('should accept all valid grid values', () => {
        expect(parseDSL('grid 2').globalSettings.grid).toBe(2);
        expect(parseDSL('grid 4').globalSettings.grid).toBe(4);
        expect(parseDSL('grid 8').globalSettings.grid).toBe(8);
        expect(parseDSL('grid 16').globalSettings.grid).toBe(16);
        expect(parseDSL('grid 32').globalSettings.grid).toBe(32);
        expect(parseDSL('grid 64').globalSettings.grid).toBe(64);
      });
    });

    describe('11.1.5 Helpful error explanations', () => {
      it('should include context in waveform error', () => {
        expect(() => parseDSL('inst lead invalid')).toThrow('Valid options');
      });

      it('should include context in velocity error', () => {
        expect(() => parseDSL('seq: C4 1/4 vel=1.5')).toThrow('Must be between 0 and 1');
      });

      it('should include context in gain error', () => {
        expect(() => parseDSL('inst lead sine gain=2')).toThrow('Must be between 0 and 1');
      });

      it('should include context in loop error', () => {
        expect(() => parseDSL('loop 0')).toThrow('Must be a positive integer');
      });
    });
  });

  describe('11.2 v0.2 Test Suite', () => {
    describe('11.2.1 Pattern expansion tests', () => {
      it('should expand single pattern use', () => {
        const result = compileFromSource(`
          pattern riff: C4 1/4, D4 1/4
          seq: use riff
        `);
        expect(result.events).toHaveLength(2);
        expect(result.events[0].midi).toBe(60); // C4
        expect(result.events[1].midi).toBe(62); // D4
      });

      it('should expand pattern with xN repetition', () => {
        const result = compileFromSource(`
          pattern riff: C4 1/4
          seq: use riff x4
        `);
        expect(result.events).toHaveLength(4);
      });

      it('should maintain timing across pattern expansions', () => {
        const result = compileFromSource(`
          bpm 120
          pattern riff: C4 1/4
          seq: use riff x2
        `);
        expect(result.events[0].t).toBeCloseTo(0, 5);
        expect(result.events[1].t).toBeCloseTo(0.5, 5);
      });
    });

    describe('11.2.2 Repeat block expansion tests', () => {
      it('should expand simple repeat block', () => {
        const result = compileFromSource(`
          bpm 120
          seq: x3 { C4 1/4 }
        `);
        expect(result.events).toHaveLength(3);
      });

      it('should expand nested repeat blocks', () => {
        const result = compileFromSource(`
          bpm 120
          seq: x2 { x2 { C4 1/4 } }
        `);
        expect(result.events).toHaveLength(4); // 2 * 2 = 4
      });

      it('should calculate correct timing for repeated events', () => {
        const result = compileFromSource(`
          bpm 120
          seq: x3 { C4 1/4 }
        `);
        expect(result.events[0].t).toBeCloseTo(0, 5);
        expect(result.events[1].t).toBeCloseTo(0.5, 5);
        expect(result.events[2].t).toBeCloseTo(1.0, 5);
      });
    });

    describe('11.2.3 Swing timing transform tests', () => {
      it('should apply swing to off-beat notes', () => {
        const result = compileFromSource(`
          bpm 120
          swing 0.5
          grid 16
          seq: C4 1/16, D4 1/16
        `);
        // First note (on-beat) should be at 0
        expect(result.events[0].t).toBeCloseTo(0, 5);
        // Second note (off-beat) should be delayed by swing
        expect(result.events[1].t).toBeGreaterThan(0.125);
      });

      it('should not affect on-beat notes', () => {
        const result = compileFromSource(`
          bpm 120
          swing 0.5
          grid 8
          seq: C4 1/8, r 1/8, D4 1/8
        `);
        // First note at 0
        expect(result.events[0].t).toBeCloseTo(0, 5);
        // Third note (on-beat at 0.5) should not be affected
        expect(result.events[2].t).toBeCloseTo(0.5, 5);
      });
    });

    describe('11.2.4 Chord expansion tests', () => {
      it('should expand chord to multiple events at same time', () => {
        const result = compileFromSource(`
          bpm 120
          seq: [C4 E4 G4] 1/4
        `);
        const noteEvents = result.events.filter(e => e.kind === 'note');
        expect(noteEvents).toHaveLength(3);
        // All notes at same time
        expect(noteEvents[0].t).toBe(0);
        expect(noteEvents[1].t).toBe(0);
        expect(noteEvents[2].t).toBe(0);
      });

      it('should set correct pitches for chord notes', () => {
        const result = compileFromSource(`
          seq: [C4 E4 G4] 1/4
        `);
        const noteEvents = result.events.filter(e => e.kind === 'note');
        expect(noteEvents[0].midi).toBe(60); // C4
        expect(noteEvents[1].midi).toBe(64); // E4
        expect(noteEvents[2].midi).toBe(67); // G4
      });

      it('should share duration across chord notes', () => {
        const result = compileFromSource(`
          bpm 120
          seq: [C4 E4] 1/4
        `);
        const noteEvents = result.events.filter(e => e.kind === 'note');
        expect(noteEvents[0].dur).toBeCloseTo(0.5, 5);
        expect(noteEvents[1].dur).toBeCloseTo(0.5, 5);
      });

      it('should apply velocity to all chord notes', () => {
        const result = compileFromSource(`
          seq: [C4 E4 G4] 1/4 vel=0.6
        `);
        const noteEvents = result.events.filter(e => e.kind === 'note');
        expect(noteEvents.every(e => e.vel === 0.6)).toBe(true);
      });
    });
  });

  describe('11.3 Backward Compatibility Verification', () => {
    describe('11.3.1 MVP example program', () => {
      it('should compile MVP example program correctly', () => {
        const source = `// Web DSL Music Sequencer - Example Program
// This is a simple melody demonstration

bpm 120

inst lead sine

seq:
  C4 1/4, D4 1/4, E4 1/4, F4 1/4,
  G4 1/2, E4 1/4, C4 1/4,
  D4 1/4, D4 1/4, E4 1/4, D4 1/4,
  C4 1/1
`;
        const result = compileFromSource(source);
        expect(result.bpm).toBe(120);
        expect(result.eventCount).toBe(12);
        expect(result.events.every(e => e.inst === 'lead')).toBe(true);
        expect(result.events.every(e => e.waveform === 'sine')).toBe(true);
      });
    });

    describe('11.3.2 v0.1 DSL syntax support', () => {
      it('should support bpm directive', () => {
        const result = compileFromSource('bpm 140\nseq: C4 1/4');
        expect(result.bpm).toBe(140);
      });

      it('should support inst directive with all waveforms', () => {
        const waveforms = ['sine', 'square', 'sawtooth', 'triangle'];
        for (const waveform of waveforms) {
          const result = compileFromSource(`inst test ${waveform}\nseq: C4 1/4`);
          expect(result.events[0].waveform).toBe(waveform);
        }
      });

      it('should support seq directive', () => {
        const result = compileFromSource('seq: C4 1/4, D4 1/4');
        expect(result.eventCount).toBe(2);
      });

      it('should support rest syntax', () => {
        const result = compileFromSource('seq: C4 1/4, r 1/4, D4 1/4');
        expect(result.events[1].kind).toBe('rest');
      });

      it('should support note accidentals', () => {
        const result = compileFromSource('seq: C#4 1/4, Bb3 1/4');
        expect(result.events[0].midi).toBe(61); // C#4
        expect(result.events[1].midi).toBe(58); // Bb3
      });

      it('should support all duration formats', () => {
        const result = compileFromSource('bpm 120\nseq: C4 1/1, C4 1/2, C4 1/4, C4 1/8, C4 1/16');
        expect(result.events[0].dur).toBeCloseTo(2.0, 5);   // whole
        expect(result.events[1].dur).toBeCloseTo(1.0, 5);   // half
        expect(result.events[2].dur).toBeCloseTo(0.5, 5);   // quarter
        expect(result.events[3].dur).toBeCloseTo(0.25, 5);  // eighth
        expect(result.events[4].dur).toBeCloseTo(0.125, 5); // sixteenth
      });

      it('should support comments', () => {
        const result = compileFromSource(`
          // This is a comment
          bpm 120
          // Another comment
          seq: C4 1/4
        `);
        expect(result.eventCount).toBe(1);
      });
    });

    describe('11.3.4 MVP test regression check', () => {
      it('should return empty events for empty source', () => {
        const result = compileFromSource('');
        expect(result.events).toHaveLength(0);
        expect(result.bpm).toBe(120); // Default
      });

      it('should use default BPM when not specified', () => {
        const result = compileFromSource('seq: C4 1/4');
        expect(result.bpm).toBe(120);
      });

      it('should use default instrument when not specified', () => {
        const result = compileFromSource('seq: C4 1/4');
        expect(result.events[0].inst).toBe('lead');
        expect(result.events[0].waveform).toBe('sine');
      });

      it('should calculate correct timing', () => {
        const result = compileFromSource('bpm 120\nseq: C4 1/4, D4 1/4, E4 1/4');
        expect(result.events[0].t).toBeCloseTo(0, 5);
        expect(result.events[1].t).toBeCloseTo(0.5, 5);
        expect(result.events[2].t).toBeCloseTo(1.0, 5);
      });

      it('should calculate correct MIDI values', () => {
        const result = compileFromSource('seq: A4 1/4, C4 1/4');
        expect(result.events[0].midi).toBe(69); // A4
        expect(result.events[1].midi).toBe(60); // C4
      });

      it('should set default velocity', () => {
        const result = compileFromSource('seq: C4 1/4');
        expect(result.events[0].vel).toBe(0.8);
      });
    });

    describe('11.3.5 Edge cases from MVP', () => {
      it('should handle very fast BPM', () => {
        const result = compileFromSource('bpm 300\nseq: C4 1/16');
        expect(result.events[0].dur).toBeCloseTo(0.05, 5);
      });

      it('should handle very slow BPM', () => {
        const result = compileFromSource('bpm 30\nseq: C4 1/1');
        expect(result.events[0].dur).toBeCloseTo(8.0, 5);
      });

      it('should handle program with only comments', () => {
        const result = compileFromSource('// Comment\n// Another');
        expect(result.events).toHaveLength(0);
      });

      it('should handle multiple consecutive rests', () => {
        const result = compileFromSource('bpm 120\nseq: C4 1/4, r 1/4, r 1/4, D4 1/4');
        expect(result.events).toHaveLength(4);
        expect(result.events[3].t).toBeCloseTo(1.5, 5);
      });

      it('should handle extreme octaves', () => {
        const result = compileFromSource('seq: C0 1/4, C9 1/4');
        expect(result.events[0].midi).toBe(12);  // C0
        expect(result.events[1].midi).toBe(120); // C9
      });
    });
  });
});
