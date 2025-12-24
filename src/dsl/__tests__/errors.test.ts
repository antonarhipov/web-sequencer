import { describe, it, expect } from 'vitest';
import {
  DSLError,
  formatError,
  toDSLError,
  getErrorLineClass,
  getErrorLineStyle,
  createLineHighlightMarkers,
  clearLineHighlightMarkers,
} from '../errors';
import type { ErrorInfo } from '../errors';
import { TokenizerError } from '../tokenizer';
import { ParseError } from '../parser';

describe('DSL Error Handling', () => {
  describe('DSLError class', () => {
    it('should create error with message, line, and column', () => {
      const error = new DSLError('Test error message', 5, 10);
      
      expect(error.message).toBe('Test error message');
      expect(error.line).toBe(5);
      expect(error.column).toBe(10);
      expect(error.name).toBe('DSLError');
    });

    it('should extend Error class', () => {
      const error = new DSLError('Test', 1, 1);
      expect(error instanceof Error).toBe(true);
      expect(error instanceof DSLError).toBe(true);
    });

    it('should have stack trace', () => {
      const error = new DSLError('Test', 1, 1);
      expect(error.stack).toBeDefined();
    });
  });

  describe('formatError', () => {
    it('should format error with line and column information', () => {
      const error = new DSLError('Unexpected token', 3, 7);
      const result = formatError(error);

      expect(result.message).toBe('Unexpected token');
      expect(result.line).toBe(3);
      expect(result.column).toBe(7);
      expect(result.formattedMessage).toBe('Error at line 3, column 7: Unexpected token');
    });

    it('should format error at first position', () => {
      const error = new DSLError('Missing BPM directive', 1, 1);
      const result = formatError(error);

      expect(result.formattedMessage).toBe('Error at line 1, column 1: Missing BPM directive');
    });

    it('should return ErrorInfo interface', () => {
      const error = new DSLError('Test', 2, 5);
      const result: ErrorInfo = formatError(error);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('line');
      expect(result).toHaveProperty('column');
      expect(result).toHaveProperty('formattedMessage');
    });
  });

  describe('toDSLError', () => {
    it('should return same DSLError if already DSLError', () => {
      const original = new DSLError('Original', 5, 10);
      const result = toDSLError(original);

      expect(result).toBe(original);
      expect(result.message).toBe('Original');
      expect(result.line).toBe(5);
      expect(result.column).toBe(10);
    });

    it('should convert TokenizerError to DSLError', () => {
      const tokenizerError = new TokenizerError('Invalid character', 2, 15);
      const result = toDSLError(tokenizerError);

      expect(result instanceof DSLError).toBe(true);
      expect(result.line).toBe(2);
      expect(result.column).toBe(15);
    });

    it('should convert ParseError to DSLError', () => {
      const parseError = new ParseError('Expected note', 4, 8);
      const result = toDSLError(parseError);

      expect(result instanceof DSLError).toBe(true);
      expect(result.line).toBe(4);
      expect(result.column).toBe(8);
    });

    it('should convert generic Error to DSLError with default position', () => {
      const genericError = new Error('Something went wrong');
      const result = toDSLError(genericError);

      expect(result instanceof DSLError).toBe(true);
      expect(result.message).toBe('Something went wrong');
      expect(result.line).toBe(1);
      expect(result.column).toBe(1);
    });

    it('should convert string to DSLError', () => {
      const result = toDSLError('String error message');

      expect(result instanceof DSLError).toBe(true);
      expect(result.message).toBe('String error message');
      expect(result.line).toBe(1);
      expect(result.column).toBe(1);
    });

    it('should convert other types to DSLError', () => {
      const result = toDSLError(42);

      expect(result instanceof DSLError).toBe(true);
      expect(result.message).toBe('42');
      expect(result.line).toBe(1);
      expect(result.column).toBe(1);
    });
  });

  describe('getErrorLineClass', () => {
    it('should return CSS class for error line', () => {
      const result = getErrorLineClass(5);
      expect(result).toBe('error-line error-line-5');
    });

    it('should handle line 1', () => {
      const result = getErrorLineClass(1);
      expect(result).toBe('error-line error-line-1');
    });
  });

  describe('getErrorLineStyle', () => {
    it('should return style object with error highlighting', () => {
      const result = getErrorLineStyle();

      expect(result).toHaveProperty('backgroundColor');
      expect(result).toHaveProperty('borderLeft');
      expect(result.backgroundColor).toContain('rgba');
      expect(result.borderLeft).toContain('solid');
    });
  });

  describe('createLineHighlightMarkers', () => {
    it('should create marker array with error line marked', () => {
      const result = createLineHighlightMarkers(3, 5);

      expect(result).toHaveLength(5);
      expect(result[0]).toBe(false);
      expect(result[1]).toBe(false);
      expect(result[2]).toBe(true); // Line 3 (0-indexed as 2)
      expect(result[3]).toBe(false);
      expect(result[4]).toBe(false);
    });

    it('should handle first line', () => {
      const result = createLineHighlightMarkers(1, 3);

      expect(result[0]).toBe(true);
      expect(result[1]).toBe(false);
      expect(result[2]).toBe(false);
    });

    it('should handle last line', () => {
      const result = createLineHighlightMarkers(5, 5);

      expect(result[4]).toBe(true);
    });

    it('should handle line out of range (too high)', () => {
      const result = createLineHighlightMarkers(10, 5);

      expect(result.every(m => m === false)).toBe(true);
    });

    it('should handle line out of range (zero)', () => {
      const result = createLineHighlightMarkers(0, 5);

      expect(result.every(m => m === false)).toBe(true);
    });

    it('should handle negative line', () => {
      const result = createLineHighlightMarkers(-1, 5);

      expect(result.every(m => m === false)).toBe(true);
    });
  });

  describe('clearLineHighlightMarkers', () => {
    it('should return array of false values', () => {
      const result = clearLineHighlightMarkers(5);

      expect(result).toHaveLength(5);
      expect(result.every(m => m === false)).toBe(true);
    });

    it('should handle empty array', () => {
      const result = clearLineHighlightMarkers(0);

      expect(result).toHaveLength(0);
    });
  });
});
