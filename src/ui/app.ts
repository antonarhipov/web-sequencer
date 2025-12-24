/**
 * UI Application Module
 * Handles UI logic and integrates DSL compilation with error handling.
 */

import { compileFromSource } from '../dsl/compiler';
import type { CompilationResult } from '../dsl/compiler';
import {
  formatError,
  toDSLError,
  getErrorLineClass,
  clearLineHighlightMarkers,
} from '../dsl/errors';
import type { ErrorInfo } from '../dsl/errors';

/**
 * State for tracking current error status.
 */
export interface AppState {
  lastError: ErrorInfo | null;
  compilationResult: CompilationResult | null;
  errorLineMarkers: boolean[];
}

/**
 * Result of a safe compilation attempt.
 */
export interface SafeCompilationResult {
  success: boolean;
  result: CompilationResult | null;
  error: ErrorInfo | null;
}

/**
 * Create initial app state.
 */
export function createInitialState(): AppState {
  return {
    lastError: null,
    compilationResult: null,
    errorLineMarkers: [],
  };
}

/**
 * Safely compile DSL source code with try-catch error handling.
 * This wraps tokenize/parse/compile pipeline and catches any errors.
 * 
 * @param source - DSL source code string
 * @returns SafeCompilationResult with either result or error
 */
export function safeCompile(source: string): SafeCompilationResult {
  try {
    const result = compileFromSource(source);
    return {
      success: true,
      result,
      error: null,
    };
  } catch (err) {
    const dslError = toDSLError(err);
    const errorInfo = formatError(dslError);
    return {
      success: false,
      result: null,
      error: errorInfo,
    };
  }
}

/**
 * Update app state after a compilation attempt.
 * Clears errors on successful recompilation.
 * 
 * @param state - Current app state
 * @param compilationResult - Result from safeCompile
 * @param totalLines - Total number of lines in the editor
 * @returns Updated app state
 */
export function updateStateAfterCompilation(
  _state: AppState,
  compilationResult: SafeCompilationResult,
  totalLines: number
): AppState {
  if (compilationResult.success) {
    // Clear errors on successful recompilation (task 4.1.6)
    return {
      lastError: null,
      compilationResult: compilationResult.result,
      errorLineMarkers: clearLineHighlightMarkers(totalLines),
    };
  } else {
    // Set error state
    const errorLine = compilationResult.error?.line ?? 1;
    const markers = new Array(totalLines).fill(false);
    if (errorLine >= 1 && errorLine <= totalLines) {
      markers[errorLine - 1] = true;
    }
    
    return {
      lastError: compilationResult.error,
      compilationResult: null,
      errorLineMarkers: markers,
    };
  }
}

/**
 * Get CSS class for a specific line based on error state.
 * 
 * @param lineNumber - Line number (1-based)
 * @param state - Current app state
 * @returns CSS class string or empty string
 */
export function getLineClass(lineNumber: number, state: AppState): string {
  if (state.lastError && state.lastError.line === lineNumber) {
    return getErrorLineClass(lineNumber);
  }
  return '';
}

/**
 * Check if there is an active error.
 * 
 * @param state - Current app state
 * @returns True if there is an error
 */
export function hasError(state: AppState): boolean {
  return state.lastError !== null;
}

/**
 * Get the formatted error message for display.
 * 
 * @param state - Current app state
 * @returns Formatted error message or empty string
 */
export function getErrorMessage(state: AppState): string {
  return state.lastError?.formattedMessage ?? '';
}

/**
 * Clear the current error state.
 * 
 * @param state - Current app state
 * @param totalLines - Total number of lines in the editor
 * @returns Updated app state with cleared error
 */
export function clearError(state: AppState, totalLines: number): AppState {
  return {
    ...state,
    lastError: null,
    errorLineMarkers: clearLineHighlightMarkers(totalLines),
  };
}
