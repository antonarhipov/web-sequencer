import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  safeCompile,
  updateStateAfterCompilation,
  getLineClass,
  hasError,
  getErrorMessage,
  clearError,
} from '../app';
import type { AppState, SafeCompilationResult } from '../app';

describe('UI App Error Handling', () => {
  describe('createInitialState', () => {
    it('should create state with no errors', () => {
      const state = createInitialState();

      expect(state.lastError).toBeNull();
      expect(state.compilationResult).toBeNull();
      expect(state.errorLineMarkers).toEqual([]);
    });
  });

  describe('safeCompile', () => {
    it('should return success result for valid DSL', () => {
      const source = `bpm 120
inst lead sine
seq: C4 1/4, D4 1/4`;
      
      const result = safeCompile(source);

      expect(result.success).toBe(true);
      expect(result.result).not.toBeNull();
      expect(result.error).toBeNull();
      expect(result.result?.bpm).toBe(120);
      expect(result.result?.events.length).toBe(2);
    });

    it('should return error result for invalid DSL (tokenizer error)', () => {
      const source = `bpm 120
inst lead sine
seq: @invalid 1/4`;
      
      const result = safeCompile(source);

      expect(result.success).toBe(false);
      expect(result.result).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.line).toBeGreaterThan(0);
      expect(result.error?.formattedMessage).toContain('Error at line');
    });

    it('should return error result for invalid DSL (parser error)', () => {
      const source = `bpm
inst lead sine
seq: C4 1/4`;
      
      const result = safeCompile(source);

      expect(result.success).toBe(false);
      expect(result.result).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it('should return error result for missing sequence keyword', () => {
      const source = `bpm 120
inst lead sine
C4 1/4`;
      
      const result = safeCompile(source);

      expect(result.success).toBe(false);
      expect(result.error).not.toBeNull();
    });
  });

  describe('updateStateAfterCompilation', () => {
    it('should clear errors on successful compilation', () => {
      const initialState: AppState = {
        lastError: {
          message: 'Previous error',
          line: 2,
          column: 5,
          formattedMessage: 'Error at line 2, column 5: Previous error',
        },
        compilationResult: null,
        errorLineMarkers: [false, true, false],
      };

      const successResult: SafeCompilationResult = {
        success: true,
        result: {
          bpm: 120,
          totalDuration: 1.0,
          eventCount: 2,
          events: [],
          globalSettings: { swing: 0, loop: 1, grid: 16 },
        },
        error: null,
      };

      const newState = updateStateAfterCompilation(initialState, successResult, 5);

      expect(newState.lastError).toBeNull();
      expect(newState.compilationResult).toBe(successResult.result);
      expect(newState.errorLineMarkers.every(m => m === false)).toBe(true);
    });

    it('should set error state on failed compilation', () => {
      const initialState = createInitialState();

      const errorResult: SafeCompilationResult = {
        success: false,
        result: null,
        error: {
          message: 'Invalid token',
          line: 3,
          column: 10,
          formattedMessage: 'Error at line 3, column 10: Invalid token',
        },
      };

      const newState = updateStateAfterCompilation(initialState, errorResult, 5);

      expect(newState.lastError).toBe(errorResult.error);
      expect(newState.compilationResult).toBeNull();
      expect(newState.errorLineMarkers[2]).toBe(true); // Line 3 (0-indexed)
    });

    it('should handle error line out of range', () => {
      const initialState = createInitialState();

      const errorResult: SafeCompilationResult = {
        success: false,
        result: null,
        error: {
          message: 'Error',
          line: 10, // Out of range for 5 lines
          column: 1,
          formattedMessage: 'Error at line 10, column 1: Error',
        },
      };

      const newState = updateStateAfterCompilation(initialState, errorResult, 5);

      expect(newState.lastError).toBe(errorResult.error);
      expect(newState.errorLineMarkers.every(m => m === false)).toBe(true);
    });
  });

  describe('getLineClass', () => {
    it('should return error class for error line', () => {
      const state: AppState = {
        lastError: {
          message: 'Error',
          line: 3,
          column: 1,
          formattedMessage: 'Error at line 3, column 1: Error',
        },
        compilationResult: null,
        errorLineMarkers: [],
      };

      const result = getLineClass(3, state);
      expect(result).toContain('error-line');
      expect(result).toContain('error-line-3');
    });

    it('should return empty string for non-error line', () => {
      const state: AppState = {
        lastError: {
          message: 'Error',
          line: 3,
          column: 1,
          formattedMessage: 'Error at line 3, column 1: Error',
        },
        compilationResult: null,
        errorLineMarkers: [],
      };

      const result = getLineClass(1, state);
      expect(result).toBe('');
    });

    it('should return empty string when no error', () => {
      const state = createInitialState();

      const result = getLineClass(1, state);
      expect(result).toBe('');
    });
  });

  describe('hasError', () => {
    it('should return true when there is an error', () => {
      const state: AppState = {
        lastError: {
          message: 'Error',
          line: 1,
          column: 1,
          formattedMessage: 'Error',
        },
        compilationResult: null,
        errorLineMarkers: [],
      };

      expect(hasError(state)).toBe(true);
    });

    it('should return false when there is no error', () => {
      const state = createInitialState();
      expect(hasError(state)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return formatted message when there is an error', () => {
      const state: AppState = {
        lastError: {
          message: 'Invalid token',
          line: 2,
          column: 5,
          formattedMessage: 'Error at line 2, column 5: Invalid token',
        },
        compilationResult: null,
        errorLineMarkers: [],
      };

      expect(getErrorMessage(state)).toBe('Error at line 2, column 5: Invalid token');
    });

    it('should return empty string when there is no error', () => {
      const state = createInitialState();
      expect(getErrorMessage(state)).toBe('');
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const state: AppState = {
        lastError: {
          message: 'Error',
          line: 2,
          column: 1,
          formattedMessage: 'Error',
        },
        compilationResult: null,
        errorLineMarkers: [false, true, false],
      };

      const newState = clearError(state, 5);

      expect(newState.lastError).toBeNull();
      expect(newState.errorLineMarkers.length).toBe(5);
      expect(newState.errorLineMarkers.every(m => m === false)).toBe(true);
    });

    it('should preserve compilation result when clearing error', () => {
      const compilationResult = {
        bpm: 120,
        totalDuration: 1.0,
        eventCount: 2,
        events: [],
        globalSettings: { swing: 0, loop: 1, grid: 16 },
      };

      const state: AppState = {
        lastError: {
          message: 'Error',
          line: 1,
          column: 1,
          formattedMessage: 'Error',
        },
        compilationResult,
        errorLineMarkers: [true],
      };

      const newState = clearError(state, 3);

      expect(newState.compilationResult).toBe(compilationResult);
    });
  });

  describe('Integration: compile and update state flow', () => {
    it('should handle full success flow', () => {
      let state = createInitialState();
      
      const source = `bpm 120
inst lead sine
seq: C4 1/4, D4 1/4`;
      
      const result = safeCompile(source);
      state = updateStateAfterCompilation(state, result, 3);

      expect(hasError(state)).toBe(false);
      expect(state.compilationResult?.bpm).toBe(120);
      expect(state.compilationResult?.events.length).toBe(2);
    });

    it('should handle error then success flow (error clearing)', () => {
      let state = createInitialState();
      
      // First: invalid code
      const invalidSource = `bpm`;
      let result = safeCompile(invalidSource);
      state = updateStateAfterCompilation(state, result, 3);
      
      expect(hasError(state)).toBe(true);
      expect(getErrorMessage(state)).toContain('Error at line');

      // Then: valid code
      const validSource = `bpm 120
inst lead sine
seq: C4 1/4`;
      result = safeCompile(validSource);
      state = updateStateAfterCompilation(state, result, 3);

      // Error should be cleared
      expect(hasError(state)).toBe(false);
      expect(state.lastError).toBeNull();
      expect(state.compilationResult).not.toBeNull();
    });
  });
});
