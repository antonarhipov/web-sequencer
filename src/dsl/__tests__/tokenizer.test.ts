import { describe, it, expect } from 'vitest';
import { tokenize, TokenType, TokenizerError } from '../tokenizer';

describe('tokenize', () => {
  describe('keywords', () => {
    it('should tokenize bpm keyword', () => {
      const tokens = tokenize('bpm');
      expect(tokens).toHaveLength(2); // BPM + EOF
      expect(tokens[0]).toEqual({ type: TokenType.BPM, value: 'bpm', line: 1, column: 1 });
      expect(tokens[1].type).toBe(TokenType.EOF);
    });

    it('should tokenize inst keyword', () => {
      const tokens = tokenize('inst');
      expect(tokens[0]).toEqual({ type: TokenType.INST, value: 'inst', line: 1, column: 1 });
    });

    it('should tokenize seq keyword', () => {
      const tokens = tokenize('seq');
      expect(tokens[0]).toEqual({ type: TokenType.SEQ, value: 'seq', line: 1, column: 1 });
    });

    it('should tokenize keywords case-insensitively', () => {
      const tokens = tokenize('BPM INST SEQ');
      expect(tokens[0].type).toBe(TokenType.BPM);
      expect(tokens[1].type).toBe(TokenType.INST);
      expect(tokens[2].type).toBe(TokenType.SEQ);
    });
  });

  describe('notes', () => {
    it('should tokenize simple note C4', () => {
      const tokens = tokenize('C4');
      expect(tokens[0]).toEqual({ type: TokenType.NOTE, value: 'C4', line: 1, column: 1 });
    });

    it('should tokenize note with sharp D#3', () => {
      const tokens = tokenize('D#3');
      expect(tokens[0]).toEqual({ type: TokenType.NOTE, value: 'D#3', line: 1, column: 1 });
    });

    it('should tokenize note with flat Bb2', () => {
      const tokens = tokenize('Bb2');
      expect(tokens[0]).toEqual({ type: TokenType.NOTE, value: 'Bb2', line: 1, column: 1 });
    });

    it('should tokenize lowercase note', () => {
      const tokens = tokenize('c4');
      expect(tokens[0]).toEqual({ type: TokenType.NOTE, value: 'c4', line: 1, column: 1 });
    });

    it('should tokenize various notes', () => {
      const tokens = tokenize('A4 F#5 Eb3 G0 B9');
      expect(tokens[0].type).toBe(TokenType.NOTE);
      expect(tokens[0].value).toBe('A4');
      expect(tokens[1].value).toBe('F#5');
      expect(tokens[2].value).toBe('Eb3');
      expect(tokens[3].value).toBe('G0');
      expect(tokens[4].value).toBe('B9');
    });
  });

  describe('rests', () => {
    it('should tokenize rest', () => {
      const tokens = tokenize('r');
      expect(tokens[0]).toEqual({ type: TokenType.REST, value: 'r', line: 1, column: 1 });
    });

    it('should tokenize uppercase rest', () => {
      const tokens = tokenize('R');
      expect(tokens[0]).toEqual({ type: TokenType.REST, value: 'R', line: 1, column: 1 });
    });
  });

  describe('durations', () => {
    it('should tokenize 1/4 duration', () => {
      const tokens = tokenize('1/4');
      expect(tokens[0]).toEqual({ type: TokenType.DURATION, value: '1/4', line: 1, column: 1 });
    });

    it('should tokenize 1/8 duration', () => {
      const tokens = tokenize('1/8');
      expect(tokens[0]).toEqual({ type: TokenType.DURATION, value: '1/8', line: 1, column: 1 });
    });

    it('should tokenize 3/16 duration', () => {
      const tokens = tokenize('3/16');
      expect(tokens[0]).toEqual({ type: TokenType.DURATION, value: '3/16', line: 1, column: 1 });
    });

    it('should tokenize 1/1 (whole note)', () => {
      const tokens = tokenize('1/1');
      expect(tokens[0]).toEqual({ type: TokenType.DURATION, value: '1/1', line: 1, column: 1 });
    });
  });

  describe('numbers', () => {
    it('should tokenize number', () => {
      const tokens = tokenize('120');
      expect(tokens[0]).toEqual({ type: TokenType.NUMBER, value: '120', line: 1, column: 1 });
    });

    it('should tokenize various numbers', () => {
      const tokens = tokenize('60 90 180');
      expect(tokens[0].value).toBe('60');
      expect(tokens[1].value).toBe('90');
      expect(tokens[2].value).toBe('180');
    });
  });

  describe('identifiers', () => {
    it('should tokenize identifier', () => {
      const tokens = tokenize('lead');
      expect(tokens[0]).toEqual({ type: TokenType.IDENTIFIER, value: 'lead', line: 1, column: 1 });
    });

    it('should tokenize waveform identifiers', () => {
      const tokens = tokenize('sine square sawtooth triangle');
      expect(tokens[0]).toEqual({ type: TokenType.IDENTIFIER, value: 'sine', line: 1, column: 1 });
      expect(tokens[1].value).toBe('square');
      expect(tokens[2].value).toBe('sawtooth');
      expect(tokens[3].value).toBe('triangle');
    });

    it('should tokenize identifier with underscore', () => {
      const tokens = tokenize('my_instrument');
      expect(tokens[0]).toEqual({ type: TokenType.IDENTIFIER, value: 'my_instrument', line: 1, column: 1 });
    });
  });

  describe('punctuation', () => {
    it('should tokenize comma', () => {
      const tokens = tokenize(',');
      expect(tokens[0]).toEqual({ type: TokenType.COMMA, value: ',', line: 1, column: 1 });
    });

    it('should tokenize colon', () => {
      const tokens = tokenize(':');
      expect(tokens[0]).toEqual({ type: TokenType.COLON, value: ':', line: 1, column: 1 });
    });

    it('should tokenize seq:', () => {
      const tokens = tokenize('seq:');
      expect(tokens[0]).toEqual({ type: TokenType.SEQ, value: 'seq', line: 1, column: 1 });
      expect(tokens[1]).toEqual({ type: TokenType.COLON, value: ':', line: 1, column: 4 });
    });
  });

  describe('whitespace handling', () => {
    it('should handle spaces', () => {
      const tokens = tokenize('bpm 120');
      expect(tokens[0].type).toBe(TokenType.BPM);
      expect(tokens[1].type).toBe(TokenType.NUMBER);
    });

    it('should handle tabs', () => {
      const tokens = tokenize('bpm\t120');
      expect(tokens[0].type).toBe(TokenType.BPM);
      expect(tokens[1].type).toBe(TokenType.NUMBER);
    });

    it('should handle newlines', () => {
      const tokens = tokenize('bpm\n120');
      expect(tokens[0].type).toBe(TokenType.BPM);
      expect(tokens[1]).toEqual({ type: TokenType.NUMBER, value: '120', line: 2, column: 1 });
    });

    it('should handle multiple newlines', () => {
      const tokens = tokenize('bpm\n\n\n120');
      expect(tokens[1]).toEqual({ type: TokenType.NUMBER, value: '120', line: 4, column: 1 });
    });

    it('should handle carriage returns', () => {
      const tokens = tokenize('bpm\r\n120');
      expect(tokens[0].type).toBe(TokenType.BPM);
      expect(tokens[1].type).toBe(TokenType.NUMBER);
    });
  });

  describe('line and column tracking', () => {
    it('should track column correctly', () => {
      const tokens = tokenize('bpm 120');
      expect(tokens[0].column).toBe(1);
      expect(tokens[1].column).toBe(5);
    });

    it('should track line correctly', () => {
      const tokens = tokenize('bpm 120\ninst lead sine');
      expect(tokens[0].line).toBe(1);
      expect(tokens[1].line).toBe(1);
      expect(tokens[2].line).toBe(2);
      expect(tokens[3].line).toBe(2);
      expect(tokens[4].line).toBe(2);
    });

    it('should reset column after newline', () => {
      const tokens = tokenize('bpm 120\ninst');
      expect(tokens[2].column).toBe(1);
    });
  });

  describe('comments', () => {
    it('should skip single-line comments', () => {
      const tokens = tokenize('bpm 120 // this is a comment\ninst lead sine');
      expect(tokens[0].type).toBe(TokenType.BPM);
      expect(tokens[1].type).toBe(TokenType.NUMBER);
      expect(tokens[2].type).toBe(TokenType.INST);
    });

    it('should handle comment at end of file', () => {
      const tokens = tokenize('bpm 120 // comment');
      expect(tokens).toHaveLength(3); // BPM, NUMBER, EOF
    });
  });

  describe('complete DSL examples', () => {
    it('should tokenize bpm directive', () => {
      const tokens = tokenize('bpm 120');
      expect(tokens[0].type).toBe(TokenType.BPM);
      expect(tokens[1].type).toBe(TokenType.NUMBER);
      expect(tokens[2].type).toBe(TokenType.EOF);
    });

    it('should tokenize inst directive', () => {
      const tokens = tokenize('inst lead sine');
      expect(tokens[0].type).toBe(TokenType.INST);
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[2].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[3].type).toBe(TokenType.EOF);
    });

    it('should tokenize seq block', () => {
      const tokens = tokenize('seq: C4 1/4, D4 1/4, r 1/8');
      expect(tokens[0].type).toBe(TokenType.SEQ);
      expect(tokens[1].type).toBe(TokenType.COLON);
      expect(tokens[2]).toEqual({ type: TokenType.NOTE, value: 'C4', line: 1, column: 6 });
      expect(tokens[3]).toEqual({ type: TokenType.DURATION, value: '1/4', line: 1, column: 9 });
      expect(tokens[4].type).toBe(TokenType.COMMA);
      expect(tokens[5].type).toBe(TokenType.NOTE);
      expect(tokens[6].type).toBe(TokenType.DURATION);
      expect(tokens[7].type).toBe(TokenType.COMMA);
      expect(tokens[8].type).toBe(TokenType.REST);
      expect(tokens[9].type).toBe(TokenType.DURATION);
    });

    it('should tokenize complete program', () => {
      const input = `
bpm 120
inst lead sine
seq:
  C4 1/4, D4 1/4,
  E4 1/4, r 1/8
`;
      const tokens = tokenize(input);
      
      // Check structure without checking exact positions
      const types = tokens.map(t => t.type);
      expect(types).toContain(TokenType.BPM);
      expect(types).toContain(TokenType.NUMBER);
      expect(types).toContain(TokenType.INST);
      expect(types).toContain(TokenType.SEQ);
      expect(types).toContain(TokenType.COLON);
      expect(types).toContain(TokenType.NOTE);
      expect(types).toContain(TokenType.DURATION);
      expect(types).toContain(TokenType.COMMA);
      expect(types).toContain(TokenType.REST);
      expect(types[types.length - 1]).toBe(TokenType.EOF);
    });
  });

  describe('EOF token', () => {
    it('should always end with EOF', () => {
      const tokens = tokenize('');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it('should have correct position for EOF', () => {
      const tokens = tokenize('bpm');
      const eof = tokens[tokens.length - 1];
      expect(eof.type).toBe(TokenType.EOF);
      expect(eof.line).toBe(1);
      expect(eof.column).toBe(4);
    });
  });

  describe('error handling', () => {
    it('should throw on unexpected character', () => {
      expect(() => tokenize('@')).toThrow(TokenizerError);
      expect(() => tokenize('@')).toThrow('Unexpected character');
    });

    it('should include line and column in error', () => {
      try {
        tokenize('bpm 120\n@invalid');
      } catch (e) {
        expect(e).toBeInstanceOf(TokenizerError);
        expect((e as TokenizerError).line).toBe(2);
        expect((e as TokenizerError).column).toBe(1);
      }
    });
  });
});
