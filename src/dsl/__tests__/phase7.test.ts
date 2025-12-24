/**
 * Phase 7 Tests - Extended DSL Features
 * Tests for: global settings, extended instruments, tracks, patterns, chords, repeat blocks, per-note velocity
 */

import { describe, it, expect } from 'vitest';
import { parse, ParseError } from '../parser';
import { tokenize, TokenType } from '../tokenizer';
import { compileFromSource } from '../compiler';

// Helper to parse DSL source
function parseDSL(source: string) {
  return parse(tokenize(source));
}

describe('Phase 7: Extended DSL Features', () => {
  describe('7.1 Global Settings', () => {
    describe('swing directive', () => {
      it('should parse swing with decimal value', () => {
        const ast = parseDSL('swing 0.5');
        expect(ast.globalSettings.swing).toBe(0.5);
      });

      it('should parse swing with integer value', () => {
        const ast = parseDSL('swing 0');
        expect(ast.globalSettings.swing).toBe(0);
      });

      it('should default swing to 0', () => {
        const ast = parseDSL('bpm 120');
        expect(ast.globalSettings.swing).toBe(0);
      });

      it('should throw on swing value above 0.75', () => {
        expect(() => parseDSL('swing 0.8')).toThrow(ParseError);
        expect(() => parseDSL('swing 0.8')).toThrow('Must be between 0 and 0.75');
      });

      it('should throw on negative swing value', () => {
        expect(() => parseDSL('swing -0.1')).toThrow();
      });

      it('should accept swing at max value 0.75', () => {
        const ast = parseDSL('swing 0.75');
        expect(ast.globalSettings.swing).toBe(0.75);
      });
    });

    describe('loop directive', () => {
      it('should parse loop directive', () => {
        const ast = parseDSL('loop 4');
        expect(ast.globalSettings.loop).toBe(4);
      });

      it('should default loop to 1', () => {
        const ast = parseDSL('bpm 120');
        expect(ast.globalSettings.loop).toBe(1);
      });

      it('should throw on zero loop value', () => {
        expect(() => parseDSL('loop 0')).toThrow(ParseError);
        expect(() => parseDSL('loop 0')).toThrow('Must be a positive integer');
      });
    });

    describe('grid directive', () => {
      it('should parse grid directive', () => {
        const ast = parseDSL('grid 8');
        expect(ast.globalSettings.grid).toBe(8);
      });

      it('should default grid to 16', () => {
        const ast = parseDSL('bpm 120');
        expect(ast.globalSettings.grid).toBe(16);
      });

      it('should accept valid grid values', () => {
        expect(parseDSL('grid 4').globalSettings.grid).toBe(4);
        expect(parseDSL('grid 8').globalSettings.grid).toBe(8);
        expect(parseDSL('grid 16').globalSettings.grid).toBe(16);
        expect(parseDSL('grid 32').globalSettings.grid).toBe(32);
      });

      it('should throw on invalid grid value', () => {
        expect(() => parseDSL('grid 5')).toThrow(ParseError);
        expect(() => parseDSL('grid 5')).toThrow('Must be one of');
      });
    });

    describe('tokenizer', () => {
      it('should tokenize swing keyword', () => {
        const tokens = tokenize('swing 0.5');
        expect(tokens[0].type).toBe(TokenType.SWING);
      });

      it('should tokenize loop keyword', () => {
        const tokens = tokenize('loop 4');
        expect(tokens[0].type).toBe(TokenType.LOOP);
      });

      it('should tokenize grid keyword', () => {
        const tokens = tokenize('grid 16');
        expect(tokens[0].type).toBe(TokenType.GRID);
      });

      it('should tokenize decimal numbers', () => {
        const tokens = tokenize('0.75');
        expect(tokens[0].type).toBe(TokenType.DECIMAL);
        expect(tokens[0].value).toBe('0.75');
      });
    });
  });

  describe('7.2 Extended Instrument Definitions', () => {
    it('should parse gain parameter', () => {
      const ast = parseDSL('inst lead sine gain=0.8');
      expect(ast.instrument.gain).toBe(0.8);
    });

    it('should parse ADSR parameters', () => {
      const ast = parseDSL('inst lead sine attack=0.01 decay=0.1 sustain=0.7 release=0.2');
      expect(ast.instrument.adsr).toBeDefined();
      expect(ast.instrument.adsr!.attack).toBe(0.01);
      expect(ast.instrument.adsr!.decay).toBe(0.1);
      expect(ast.instrument.adsr!.sustain).toBe(0.7);
      expect(ast.instrument.adsr!.release).toBe(0.2);
    });

    it('should parse partial ADSR parameters', () => {
      const ast = parseDSL('inst lead sine attack=0.02 release=0.3');
      expect(ast.instrument.adsr).toBeDefined();
      expect(ast.instrument.adsr!.attack).toBe(0.02);
      expect(ast.instrument.adsr!.release).toBe(0.3);
      expect(ast.instrument.adsr!.decay).toBeUndefined();
      expect(ast.instrument.adsr!.sustain).toBeUndefined();
    });

    it('should throw on invalid gain value', () => {
      expect(() => parseDSL('inst lead sine gain=1.5')).toThrow(ParseError);
      expect(() => parseDSL('inst lead sine gain=1.5')).toThrow('Must be between 0 and 1');
    });

    it('should throw on invalid sustain value', () => {
      expect(() => parseDSL('inst lead sine sustain=2')).toThrow(ParseError);
    });

    it('should throw on unknown parameter', () => {
      expect(() => parseDSL('inst lead sine unknown=0.5')).toThrow(ParseError);
      expect(() => parseDSL('inst lead sine unknown=0.5')).toThrow('Unknown instrument parameter');
    });

    it('should compile events with ADSR from instrument', () => {
      const result = compileFromSource('inst lead sine attack=0.02 decay=0.1 sustain=0.8 release=0.3\nseq: C4 1/4');
      const noteEvent = result.events.find(e => e.kind === 'note');
      expect(noteEvent?.adsr).toBeDefined();
      expect(noteEvent?.adsr?.attack).toBe(0.02);
      expect(noteEvent?.adsr?.decay).toBe(0.1);
      expect(noteEvent?.adsr?.sustain).toBe(0.8);
      expect(noteEvent?.adsr?.release).toBe(0.3);
    });

    it('should compile events with gain from instrument', () => {
      const result = compileFromSource('inst lead sine gain=0.6\nseq: C4 1/4');
      const noteEvent = result.events.find(e => e.kind === 'note');
      expect(noteEvent?.gain).toBe(0.6);
    });
  });

  describe('7.3 Track Support', () => {
    it('should parse track definition', () => {
      const ast = parseDSL('inst bass square\ntrack melody inst=bass: C4 1/4');
      expect(ast.tracks).toHaveLength(1);
      expect(ast.tracks[0].name).toBe('melody');
      expect(ast.tracks[0].instrumentName).toBe('bass');
      expect(ast.tracks[0].items).toHaveLength(1);
    });

    it('should parse multiple tracks', () => {
      const ast = parseDSL(`
        inst lead sine
        inst bass square
        track melody inst=lead: C4 1/4
        track bassline inst=bass: C2 1/4
      `);
      expect(ast.tracks).toHaveLength(2);
      expect(ast.tracks[0].name).toBe('melody');
      expect(ast.tracks[1].name).toBe('bassline');
    });

    it('should compile tracks with correct instrument', () => {
      const result = compileFromSource(`
        inst lead sine
        inst bass square
        track melody inst=lead: C4 1/4
        track bassline inst=bass: C2 1/4
      `);
      const melodyEvent = result.events.find(e => e.track === 'melody');
      const bassEvent = result.events.find(e => e.track === 'bassline');
      expect(melodyEvent?.inst).toBe('lead');
      expect(melodyEvent?.waveform).toBe('sine');
      expect(bassEvent?.inst).toBe('bass');
      expect(bassEvent?.waveform).toBe('square');
    });

    it('should throw on undefined instrument reference', () => {
      expect(() => compileFromSource('track melody inst=undefined: C4 1/4')).toThrow();
      expect(() => compileFromSource('track melody inst=undefined: C4 1/4')).toThrow('undefined instrument');
    });

    it('should include track name in compiled events', () => {
      const result = compileFromSource('inst lead sine\ntrack melody inst=lead: C4 1/4');
      expect(result.events[0].track).toBe('melody');
    });

    it('should play multiple tracks simultaneously (start at t=0)', () => {
      const result = compileFromSource(`
        inst lead sine
        inst bass square
        track melody inst=lead: C4 1/4
        track bassline inst=bass: C2 1/4
      `);
      const melodyEvent = result.events.find(e => e.track === 'melody');
      const bassEvent = result.events.find(e => e.track === 'bassline');
      expect(melodyEvent?.t).toBe(0);
      expect(bassEvent?.t).toBe(0);
    });
  });

  describe('7.4 Pattern Definition and Use', () => {
    it('should parse pattern definition', () => {
      const ast = parseDSL('pattern riff: C4 1/4, D4 1/4');
      expect(ast.patterns).toHaveLength(1);
      expect(ast.patterns[0].name).toBe('riff');
      expect(ast.patterns[0].items).toHaveLength(2);
    });

    it('should parse use directive', () => {
      const ast = parseDSL('pattern riff: C4 1/4\nseq: use riff');
      expect(ast.sequence?.items).toHaveLength(1);
      expect(ast.sequence?.items[0].type).toBe('patternUse');
    });

    it('should parse use with repetition modifier', () => {
      const ast = parseDSL('pattern riff: C4 1/4\nseq: use riff x4');
      const patternUse = ast.sequence?.items[0];
      expect(patternUse?.type).toBe('patternUse');
      expect((patternUse as any).repetitions).toBe(4);
    });

    it('should expand pattern at compile time', () => {
      const result = compileFromSource(`
        bpm 120
        inst lead sine
        pattern riff: C4 1/4, D4 1/4
        seq: use riff
      `);
      expect(result.events).toHaveLength(2);
      expect(result.events[0].midi).toBe(60); // C4
      expect(result.events[1].midi).toBe(62); // D4
    });

    it('should expand pattern with repetitions', () => {
      const result = compileFromSource(`
        bpm 120
        inst lead sine
        pattern riff: C4 1/4
        seq: use riff x3
      `);
      expect(result.events).toHaveLength(3);
    });

    it('should throw on undefined pattern', () => {
      expect(() => compileFromSource('seq: use undefined')).toThrow();
      expect(() => compileFromSource('seq: use undefined')).toThrow('not defined');
    });
  });

  describe('7.5 Chord Support', () => {
    it('should tokenize chord brackets', () => {
      const tokens = tokenize('[C4 E4 G4]');
      expect(tokens[0].type).toBe(TokenType.BRACKET_OPEN);
      expect(tokens[4].type).toBe(TokenType.BRACKET_CLOSE);
    });

    it('should parse chord', () => {
      const ast = parseDSL('seq: [C4 E4 G4] 1/4');
      expect(ast.sequence?.items).toHaveLength(1);
      expect(ast.sequence?.items[0].type).toBe('chord');
      const chord = ast.sequence?.items[0] as any;
      expect(chord.pitches).toEqual(['C4', 'E4', 'G4']);
      expect(chord.duration).toBe('1/4');
    });

    it('should parse chord with velocity', () => {
      const ast = parseDSL('seq: [C4 E4 G4] 1/4 vel=0.6');
      const chord = ast.sequence?.items[0] as any;
      expect(chord.velocity).toBe(0.6);
    });

    it('should expand chord to multiple events at same time', () => {
      const result = compileFromSource('bpm 120\ninst lead sine\nseq: [C4 E4 G4] 1/4');
      const noteEvents = result.events.filter(e => e.kind === 'note');
      expect(noteEvents).toHaveLength(3);
      // All notes at same time
      expect(noteEvents[0].t).toBe(0);
      expect(noteEvents[1].t).toBe(0);
      expect(noteEvents[2].t).toBe(0);
      // Different pitches
      expect(noteEvents[0].midi).toBe(60); // C4
      expect(noteEvents[1].midi).toBe(64); // E4
      expect(noteEvents[2].midi).toBe(67); // G4
    });

    it('should share duration and velocity across chord notes', () => {
      const result = compileFromSource('bpm 120\ninst lead sine\nseq: [C4 E4] 1/4 vel=0.5');
      const noteEvents = result.events.filter(e => e.kind === 'note');
      expect(noteEvents[0].dur).toBe(noteEvents[1].dur);
      expect(noteEvents[0].vel).toBe(0.5);
      expect(noteEvents[1].vel).toBe(0.5);
    });
  });

  describe('7.6 Repeat Blocks', () => {
    it('should tokenize repeat marker', () => {
      const tokens = tokenize('x4');
      expect(tokens[0].type).toBe(TokenType.REPEAT);
      expect(tokens[0].value).toBe('x4');
    });

    it('should tokenize braces', () => {
      const tokens = tokenize('{ }');
      expect(tokens[0].type).toBe(TokenType.BRACE_OPEN);
      expect(tokens[1].type).toBe(TokenType.BRACE_CLOSE);
    });

    it('should parse repeat block', () => {
      const ast = parseDSL('seq: x2 { C4 1/4 }');
      expect(ast.sequence?.items).toHaveLength(1);
      expect(ast.sequence?.items[0].type).toBe('repeat');
      const repeat = ast.sequence?.items[0] as any;
      expect(repeat.count).toBe(2);
      expect(repeat.items).toHaveLength(1);
    });

    it('should expand repeat block at compile time', () => {
      const result = compileFromSource('bpm 120\ninst lead sine\nseq: x3 { C4 1/4 }');
      expect(result.events).toHaveLength(3);
    });

    it('should handle nested repeat blocks', () => {
      const result = compileFromSource('bpm 120\ninst lead sine\nseq: x2 { x2 { C4 1/4 } }');
      expect(result.events).toHaveLength(4); // 2 * 2 = 4
    });

    it('should calculate correct timing for repeated events', () => {
      const result = compileFromSource('bpm 120\ninst lead sine\nseq: x2 { C4 1/4 }');
      expect(result.events[0].t).toBe(0);
      expect(result.events[1].t).toBe(0.5); // 1/4 at 120bpm = 0.5s
    });
  });

  describe('7.7 Per-Note Velocity', () => {
    it('should parse note with velocity', () => {
      const ast = parseDSL('seq: C4 1/4 vel=0.5');
      const note = ast.sequence?.items[0] as any;
      expect(note.velocity).toBe(0.5);
    });

    it('should use default velocity when not specified', () => {
      const result = compileFromSource('bpm 120\ninst lead sine\nseq: C4 1/4');
      expect(result.events[0].vel).toBe(0.8); // Default velocity
    });

    it('should use note-specific velocity when specified', () => {
      const result = compileFromSource('bpm 120\ninst lead sine\nseq: C4 1/4 vel=0.3');
      expect(result.events[0].vel).toBe(0.3);
    });

    it('should throw on velocity out of range', () => {
      expect(() => parseDSL('seq: C4 1/4 vel=1.5')).toThrow(ParseError);
      expect(() => parseDSL('seq: C4 1/4 vel=1.5')).toThrow('Must be between 0 and 1');
      // Negative numbers cause tokenizer error as '-' is not a valid token start
      expect(() => parseDSL('seq: C4 1/4 vel=-0.1')).toThrow();
    });

    it('should allow different velocities per note', () => {
      const result = compileFromSource('bpm 120\ninst lead sine\nseq: C4 1/4 vel=0.9, D4 1/4 vel=0.3');
      expect(result.events[0].vel).toBe(0.9);
      expect(result.events[1].vel).toBe(0.3);
    });
  });

  describe('Integration: Complex programs', () => {
    it('should parse and compile a complete Phase 7 program', () => {
      const source = `
        bpm 140
        swing 0.25
        loop 2
        grid 8
        
        inst lead sine gain=0.8 attack=0.01 release=0.2
        inst bass square gain=0.6
        
        pattern riff: C4 1/8, D4 1/8, E4 1/8, r 1/8
        
        track melody inst=lead:
          use riff x2
        
        track bassline inst=bass:
          x4 { C2 1/4 }
      `;
      
      const result = compileFromSource(source);
      
      expect(result.bpm).toBe(140);
      expect(result.globalSettings.swing).toBe(0.25);
      expect(result.globalSettings.loop).toBe(2);
      expect(result.globalSettings.grid).toBe(8);
      
      // Should have events from both tracks
      const melodyEvents = result.events.filter(e => e.track === 'melody');
      const bassEvents = result.events.filter(e => e.track === 'bassline');
      
      expect(melodyEvents.length).toBeGreaterThan(0);
      expect(bassEvents.length).toBeGreaterThan(0);
      
      // Check instrument settings applied
      const melodyNote = melodyEvents.find(e => e.kind === 'note');
      expect(melodyNote?.gain).toBe(0.8);
      expect(melodyNote?.adsr?.attack).toBe(0.01);
      
      const bassNote = bassEvents.find(e => e.kind === 'note');
      expect(bassNote?.gain).toBe(0.6);
    });

    it('should handle program with chords and repeats', () => {
      const source = `
        bpm 120
        inst piano sine
        seq:
          x2 {
            [C4 E4 G4] 1/4,
            [D4 F4 A4] 1/4
          }
      `;
      
      const result = compileFromSource(source);
      // 2 repetitions * 2 chords * 3 notes per chord = 12 note events
      const noteEvents = result.events.filter(e => e.kind === 'note');
      expect(noteEvents).toHaveLength(12);
    });
  });
});
