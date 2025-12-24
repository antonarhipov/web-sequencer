/**
 * Error Handling Module
 * Provides unified error types and formatting for the DSL.
 */

/**
 * DSLError represents any error that occurs during DSL processing
 * (tokenization, parsing, or compilation).
 */
export class DSLError extends Error {
  line: number;
  column: number;

  constructor(message: string, line: number, column: number) {
    super(message);
    this.name = 'DSLError';
    this.line = line;
    this.column = column;
  }
}

/**
 * ErrorInfo contains structured error information for display.
 */
export interface ErrorInfo {
  message: string;
  line: number;
  column: number;
  formattedMessage: string;
}

/**
 * Format a DSLError for display in the UI.
 * @param error - The DSLError to format
 * @returns ErrorInfo with formatted message
 */
export function formatError(error: DSLError): ErrorInfo {
  const formattedMessage = `Error at line ${error.line}, column ${error.column}: ${error.message}`;
  
  return {
    message: error.message,
    line: error.line,
    column: error.column,
    formattedMessage,
  };
}

/**
 * Convert any error to a DSLError.
 * Useful for wrapping TokenizerError or ParseError into a unified DSLError.
 * @param error - Any error object
 * @returns DSLError instance
 */
export function toDSLError(error: unknown): DSLError {
  if (error instanceof DSLError) {
    return error;
  }
  
  // Handle errors with line and column properties (TokenizerError, ParseError)
  if (error instanceof Error && 'line' in error && 'column' in error) {
    const errorWithLocation = error as Error & { line: number; column: number };
    return new DSLError(
      error.message,
      errorWithLocation.line,
      errorWithLocation.column
    );
  }
  
  // Handle generic errors
  if (error instanceof Error) {
    return new DSLError(error.message, 1, 1);
  }
  
  // Handle non-Error types
  return new DSLError(String(error), 1, 1);
}

/**
 * Generate CSS class name for highlighting an error line in the editor.
 * @param line - The line number with the error (1-based)
 * @returns CSS class name string
 */
export function getErrorLineClass(line: number): string {
  return `error-line error-line-${line}`;
}

/**
 * Generate inline style for highlighting an error line in the editor.
 * @returns CSS style object for error highlighting
 */
export function getErrorLineStyle(): Record<string, string> {
  return {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderLeft: '3px solid #ff4444',
  };
}

/**
 * Create a line highlighting marker for the editor.
 * This can be used to visually indicate which line has an error.
 * @param line - The line number with the error (1-based)
 * @param totalLines - Total number of lines in the editor
 * @returns Array of boolean values indicating which lines should be highlighted
 */
export function createLineHighlightMarkers(line: number, totalLines: number): boolean[] {
  const markers: boolean[] = new Array(totalLines).fill(false);
  if (line >= 1 && line <= totalLines) {
    markers[line - 1] = true; // Convert to 0-based index
  }
  return markers;
}

/**
 * Clear all error highlighting markers.
 * @param totalLines - Total number of lines in the editor
 * @returns Array of false values (no lines highlighted)
 */
export function clearLineHighlightMarkers(totalLines: number): boolean[] {
  return new Array(totalLines).fill(false);
}
