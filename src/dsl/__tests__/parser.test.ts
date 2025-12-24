import { describe, it, expect } from 'vitest';
import { parse, ParseError } from '../parser';
import type { Program } from '../parser';
import { tokenize } from '../tokenizer';

// Helper function to parse DSL source
function parseDSL(source: string): Program {
  const tokens = tokenize(source);
  return parse(tokens);
}

describe('parse', () => {
  describe('default values', () => {
    it('should use default BPM of 120 when not specified', () => {
      const ast = parseDSL('');
      expect(ast.bpm.value).toBe(120);
    });

    it('should use default instrument "lead sine" when not specified', () => {
      const ast = parseDSL('');
      expect(ast.instrument.name).toBe('lead');
      expect(ast.instrument.waveform).toBe('sine');
    });

    it('should have null sequence when not specified', () => {
      const ast = parseDSL('');
      expect(ast.sequence).toBeNull();
    });
  });

  describe('bpm directive', () => {
    it('should parse bpm directive', () => {
      const ast = parseDSL('bpm 120');
      expect(ast.bpm.type).toBe('bpm');
      expect(ast.bpm.value).toBe(120);
    });

    it('should parse different BPM values', () => {
      expect(parseDSL('bpm 60').bpm.value).toBe(60);
      expect(parseDSL('bpm 90').bpm.value).toBe(90);
      expect(parseDSL('bpm 180').bpm.value).toBe(180);
    });

    it('should track line and column for bpm', () => {
      const ast = parseDSL('bpm 120');
      expect(ast.bpm.line).toBe(1);
      expect(ast.bpm.column).toBe(1);
    });

    it('should throw on missing number after bpm', () => {
      expect(() => parseDSL('bpm')).toThrow(ParseError);
      expect(() => parseDSL('bpm')).toThrow('Expected number after bpm');
    });

    it('should throw on duplicate bpm directive', () => {
      expect(() => parseDSL('bpm 120\nbpm 90')).toThrow(ParseError);
      expect(() => parseDSL('bpm 120\nbpm 90')).toThrow('Duplicate bpm directive');
    });
  });

  describe('inst directive', () => {
    it('should parse inst directive with sine', () => {
      const ast = parseDSL('inst lead sine');
      expect(ast.instrument.type).toBe('inst');
      expect(ast.instrument.name).toBe('lead');
      expect(ast.instrument.waveform).toBe('sine');
    });

    it('should parse inst directive with square', () => {
      const ast = parseDSL('inst bass square');
      expect(ast.instrument.name).toBe('bass');
      expect(ast.instrument.waveform).toBe('square');
    });

    it('should parse inst directive with sawtooth', () => {
      const ast = parseDSL('inst synth sawtooth');
      expect(ast.instrument.name).toBe('synth');
      expect(ast.instrument.waveform).toBe('sawtooth');
    });

    it('should parse inst directive with triangle', () => {
      const ast = parseDSL('inst pad triangle');
      expect(ast.instrument.name).toBe('pad');
      expect(ast.instrument.waveform).toBe('triangle');
    });

    it('should handle case-insensitive waveform', () => {
      const ast = parseDSL('inst lead SINE');
      expect(ast.instrument.waveform).toBe('sine');
    });

    it('should track line and column for inst', () => {
      const ast = parseDSL('inst lead sine');
      expect(ast.instrument.line).toBe(1);
      expect(ast.instrument.column).toBe(1);
    });

    it('should throw on missing instrument name', () => {
      expect(() => parseDSL('inst')).toThrow(ParseError);
      expect(() => parseDSL('inst')).toThrow('Expected instrument name');
    });

    it('should throw on missing waveform', () => {
      expect(() => parseDSL('inst lead')).toThrow(ParseError);
      expect(() => parseDSL('inst lead')).toThrow('Expected waveform');
    });

    it('should throw on invalid waveform', () => {
      expect(() => parseDSL('inst lead invalid')).toThrow(ParseError);
      expect(() => parseDSL('inst lead invalid')).toThrow('Invalid waveform');
    });

    it('should allow multiple inst directives (Phase 7)', () => {
      const ast = parseDSL('inst lead sine\ninst bass square');
      expect(ast.instruments).toHaveLength(2);
      expect(ast.instruments[0].name).toBe('lead');
      expect(ast.instruments[0].waveform).toBe('sine');
      expect(ast.instruments[1].name).toBe('bass');
      expect(ast.instruments[1].waveform).toBe('square');
      // First instrument becomes the default
      expect(ast.instrument.name).toBe('lead');
    });
  });

  describe('seq block', () => {
    it('should parse empty seq block', () => {
      const ast = parseDSL('seq:');
      expect(ast.sequence).not.toBeNull();
      expect(ast.sequence!.type).toBe('sequence');
      expect(ast.sequence!.items).toHaveLength(0);
    });

    it('should parse seq with single note', () => {
      const ast = parseDSL('seq: C4 1/4');
      expect(ast.sequence!.items).toHaveLength(1);
      expect(ast.sequence!.items[0]).toEqual({
        type: 'note',
        pitch: 'C4',
        duration: '1/4',
        line: 1,
        column: 6,
      });
    });

    it('should parse seq with multiple notes', () => {
      const ast = parseDSL('seq: C4 1/4, D4 1/4, E4 1/4');
      expect(ast.sequence!.items).toHaveLength(3);
      expect(ast.sequence!.items[0].type).toBe('note');
      expect((ast.sequence!.items[0] as any).pitch).toBe('C4');
      expect(ast.sequence!.items[1].type).toBe('note');
      expect((ast.sequence!.items[1] as any).pitch).toBe('D4');
      expect(ast.sequence!.items[2].type).toBe('note');
      expect((ast.sequence!.items[2] as any).pitch).toBe('E4');
    });

    it('should parse seq with rest', () => {
      const ast = parseDSL('seq: r 1/4');
      expect(ast.sequence!.items).toHaveLength(1);
      expect(ast.sequence!.items[0]).toEqual({
        type: 'rest',
        duration: '1/4',
        line: 1,
        column: 6,
      });
    });

    it('should parse seq with notes and rests', () => {
      const ast = parseDSL('seq: C4 1/4, r 1/8, D4 1/4');
      expect(ast.sequence!.items).toHaveLength(3);
      expect(ast.sequence!.items[0].type).toBe('note');
      expect(ast.sequence!.items[1].type).toBe('rest');
      expect(ast.sequence!.items[2].type).toBe('note');
    });

    it('should parse seq with accidentals', () => {
      const ast = parseDSL('seq: D#3 1/4, Bb2 1/8');
      expect(ast.sequence!.items).toHaveLength(2);
      expect((ast.sequence!.items[0] as any).pitch).toBe('D#3');
      expect((ast.sequence!.items[1] as any).pitch).toBe('Bb2');
    });

    it('should parse seq spanning multiple lines', () => {
      const ast = parseDSL(`seq:
        C4 1/4,
        D4 1/4,
        E4 1/4`);
      expect(ast.sequence!.items).toHaveLength(3);
    });

    it('should handle seq without commas between items', () => {
      const ast = parseDSL('seq: C4 1/4 D4 1/4');
      expect(ast.sequence!.items).toHaveLength(2);
    });

    it('should track line and column for seq', () => {
      const ast = parseDSL('seq: C4 1/4');
      expect(ast.sequence!.line).toBe(1);
      expect(ast.sequence!.column).toBe(1);
    });

    it('should throw on missing colon after seq', () => {
      expect(() => parseDSL('seq C4 1/4')).toThrow(ParseError);
      expect(() => parseDSL('seq C4 1/4')).toThrow('Expected : after seq');
    });

    it('should throw on missing duration after note', () => {
      expect(() => parseDSL('seq: C4')).toThrow(ParseError);
      expect(() => parseDSL('seq: C4')).toThrow('Expected duration after note');
    });

    it('should throw on missing duration after rest', () => {
      expect(() => parseDSL('seq: r')).toThrow(ParseError);
      expect(() => parseDSL('seq: r')).toThrow('Expected duration after rest');
    });

    it('should throw on duplicate seq block', () => {
      expect(() => parseDSL('seq: C4 1/4\nseq: D4 1/4')).toThrow(ParseError);
      expect(() => parseDSL('seq: C4 1/4\nseq: D4 1/4')).toThrow('Duplicate seq block');
    });
  });

  describe('complete programs', () => {
    it('should parse complete MVP program', () => {
      const source = `
bpm 120
inst lead sine
seq: C4 1/4, D4 1/4, E4 1/4, r 1/8
`;
      const ast = parseDSL(source);
      
      expect(ast.type).toBe('program');
      expect(ast.bpm.value).toBe(120);
      expect(ast.instrument.name).toBe('lead');
      expect(ast.instrument.waveform).toBe('sine');
      expect(ast.sequence!.items).toHaveLength(4);
    });

    it('should parse program with only bpm', () => {
      const ast = parseDSL('bpm 90');
      expect(ast.bpm.value).toBe(90);
      expect(ast.instrument.name).toBe('lead'); // default
      expect(ast.instrument.waveform).toBe('sine'); // default
    });

    it('should parse program with only inst', () => {
      const ast = parseDSL('inst bass square');
      expect(ast.bpm.value).toBe(120); // default
      expect(ast.instrument.name).toBe('bass');
      expect(ast.instrument.waveform).toBe('square');
    });

    it('should parse program with only seq', () => {
      const ast = parseDSL('seq: C4 1/4');
      expect(ast.bpm.value).toBe(120); // default
      expect(ast.instrument.name).toBe('lead'); // default
      expect(ast.sequence!.items).toHaveLength(1);
    });

    it('should handle directives in any order', () => {
      const source1 = `
seq: C4 1/4
inst lead sine
bpm 100
`;
      const ast1 = parseDSL(source1);
      expect(ast1.bpm.value).toBe(100);
      expect(ast1.instrument.name).toBe('lead');
      expect(ast1.sequence!.items).toHaveLength(1);
    });

    it('should parse program with comments', () => {
      const source = `
// Set tempo
bpm 120
// Define instrument
inst lead sine
// Melody
seq: C4 1/4, D4 1/4 // inline comment
`;
      const ast = parseDSL(source);
      expect(ast.bpm.value).toBe(120);
      expect(ast.instrument.name).toBe('lead');
    });
  });

  describe('error handling', () => {
    it('should throw ParseError with line and column', () => {
      try {
        parseDSL('bpm\ninst');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        expect((e as ParseError).line).toBe(2);
        expect((e as ParseError).column).toBe(1);
      }
    });

    it('should throw on unexpected token', () => {
      expect(() => parseDSL('120')).toThrow(ParseError);
      expect(() => parseDSL('120')).toThrow('Unexpected token');
    });

    it('should provide helpful error message for invalid waveform', () => {
      try {
        parseDSL('inst lead noise');
      } catch (e) {
        expect(e).toBeInstanceOf(ParseError);
        expect((e as ParseError).message).toContain('sine');
        expect((e as ParseError).message).toContain('square');
        expect((e as ParseError).message).toContain('sawtooth');
        expect((e as ParseError).message).toContain('triangle');
      }
    });
  });

  describe('AST structure', () => {
    it('should have correct program type', () => {
      const ast = parseDSL('bpm 120');
      expect(ast.type).toBe('program');
    });

    it('should have correct bpm structure', () => {
      const ast = parseDSL('bpm 120');
      expect(ast.bpm).toHaveProperty('type', 'bpm');
      expect(ast.bpm).toHaveProperty('value');
      expect(ast.bpm).toHaveProperty('line');
      expect(ast.bpm).toHaveProperty('column');
    });

    it('should have correct instrument structure', () => {
      const ast = parseDSL('inst lead sine');
      expect(ast.instrument).toHaveProperty('type', 'inst');
      expect(ast.instrument).toHaveProperty('name');
      expect(ast.instrument).toHaveProperty('waveform');
      expect(ast.instrument).toHaveProperty('line');
      expect(ast.instrument).toHaveProperty('column');
    });

    it('should have correct sequence structure', () => {
      const ast = parseDSL('seq: C4 1/4');
      expect(ast.sequence).toHaveProperty('type', 'sequence');
      expect(ast.sequence).toHaveProperty('items');
      expect(ast.sequence).toHaveProperty('line');
      expect(ast.sequence).toHaveProperty('column');
    });

    it('should have correct note structure', () => {
      const ast = parseDSL('seq: C4 1/4');
      const note = ast.sequence!.items[0];
      expect(note).toHaveProperty('type', 'note');
      expect(note).toHaveProperty('pitch');
      expect(note).toHaveProperty('duration');
      expect(note).toHaveProperty('line');
      expect(note).toHaveProperty('column');
    });

    it('should have correct rest structure', () => {
      const ast = parseDSL('seq: r 1/4');
      const rest = ast.sequence!.items[0];
      expect(rest).toHaveProperty('type', 'rest');
      expect(rest).toHaveProperty('duration');
      expect(rest).toHaveProperty('line');
      expect(rest).toHaveProperty('column');
    });
  });
});
