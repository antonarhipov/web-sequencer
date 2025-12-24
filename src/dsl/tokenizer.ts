/**
 * Tokenizer Module
 * Converts DSL source code into a sequence of tokens.
 */

export const TokenType = {
  BPM: 'BPM',           // 'bpm' keyword
  INST: 'INST',         // 'inst' keyword
  SEQ: 'SEQ',           // 'seq:' keyword
  NOTE: 'NOTE',         // Note like 'C4', 'D#3', 'Bb2'
  REST: 'REST',         // 'r' for rest
  DURATION: 'DURATION', // Duration like '1/4', '1/8'
  NUMBER: 'NUMBER',     // Numeric value (for BPM)
  IDENTIFIER: 'IDENTIFIER', // Identifier (instrument name, waveform)
  COMMA: 'COMMA',       // ','
  COLON: 'COLON',       // ':'
  EOF: 'EOF',           // End of file
  // Phase 7: Extended DSL Features
  SWING: 'SWING',       // 'swing' keyword
  LOOP: 'LOOP',         // 'loop' keyword
  GRID: 'GRID',         // 'grid' keyword
  TRACK: 'TRACK',       // 'track' keyword
  PATTERN: 'PATTERN',   // 'pattern' keyword
  USE: 'USE',           // 'use' keyword
  EQUALS: 'EQUALS',     // '='
  BRACKET_OPEN: 'BRACKET_OPEN',   // '['
  BRACKET_CLOSE: 'BRACKET_CLOSE', // ']'
  BRACE_OPEN: 'BRACE_OPEN',       // '{'
  BRACE_CLOSE: 'BRACE_CLOSE',     // '}'
  REPEAT: 'REPEAT',     // 'xN' repetition marker (e.g., x4)
  DECIMAL: 'DECIMAL',   // Decimal number (e.g., 0.5, 0.75)
} as const;

export type TokenType = typeof TokenType[keyof typeof TokenType];

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class TokenizerError extends Error {
  line: number;
  column: number;

  constructor(message: string, line: number, column: number) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = 'TokenizerError';
    this.line = line;
    this.column = column;
  }
}

// Pattern to match notes: letter + optional accidental + octave
const NOTE_PATTERN = /^[A-Ga-g][#b]?\d+$/;

// Pattern to match durations: numerator/denominator
const DURATION_PATTERN = /^\d+\/\d+$/;

// Pattern to match numbers
const NUMBER_PATTERN = /^\d+$/;

// Pattern for identifiers (instrument names, waveforms)
const IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// Pattern for decimal numbers (e.g., 0.5, 0.75)
const DECIMAL_PATTERN = /^\d+\.\d+$/;

// Pattern for repeat markers (e.g., x4, x16)
const REPEAT_PATTERN = /^x\d+$/i;

/**
 * Check if a string is a valid note token
 */
function isNote(str: string): boolean {
  return NOTE_PATTERN.test(str);
}

/**
 * Check if a string is a valid duration token
 */
function isDuration(str: string): boolean {
  return DURATION_PATTERN.test(str);
}

/**
 * Check if a string is a valid number
 */
function isNumber(str: string): boolean {
  return NUMBER_PATTERN.test(str);
}

/**
 * Check if a string is a valid identifier
 */
function isIdentifier(str: string): boolean {
  return IDENTIFIER_PATTERN.test(str);
}

/**
 * Check if a string is a valid decimal number
 */
function isDecimal(str: string): boolean {
  return DECIMAL_PATTERN.test(str);
}

/**
 * Check if a string is a valid repeat marker (xN)
 */
function isRepeat(str: string): boolean {
  return REPEAT_PATTERN.test(str);
}

/**
 * Tokenize DSL source code into tokens.
 * @param input - DSL source code
 * @returns Array of tokens
 * @throws TokenizerError on invalid input
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let line = 1;
  let column = 1;
  let pos = 0;

  function currentChar(): string | undefined {
    return input[pos];
  }

  function advance(): void {
    if (input[pos] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
    pos++;
  }

  function skipWhitespace(): void {
    while (pos < input.length) {
      const char = currentChar();
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        advance();
      } else if (char === '/' && input[pos + 1] === '/') {
        // Skip single-line comments
        while (pos < input.length && currentChar() !== '\n') {
          advance();
        }
      } else {
        break;
      }
    }
  }

  function readWord(): string {
    let word = '';
    while (pos < input.length) {
      const char = currentChar();
      // Word characters: alphanumeric, underscore, #, b (for accidentals), / (for durations), . (for decimals)
      if (char && /[a-zA-Z0-9_#/.]/.test(char)) {
        word += char;
        advance();
      } else {
        break;
      }
    }
    return word;
  }

  function createToken(type: TokenType, value: string, startLine: number, startColumn: number): Token {
    return { type, value, line: startLine, column: startColumn };
  }

  while (pos < input.length) {
    skipWhitespace();

    if (pos >= input.length) {
      break;
    }

    const startLine = line;
    const startColumn = column;
    const char = currentChar();

    // Handle single-character tokens
    if (char === ',') {
      tokens.push(createToken(TokenType.COMMA, ',', startLine, startColumn));
      advance();
      continue;
    }

    if (char === ':') {
      tokens.push(createToken(TokenType.COLON, ':', startLine, startColumn));
      advance();
      continue;
    }

    if (char === '=') {
      tokens.push(createToken(TokenType.EQUALS, '=', startLine, startColumn));
      advance();
      continue;
    }

    if (char === '[') {
      tokens.push(createToken(TokenType.BRACKET_OPEN, '[', startLine, startColumn));
      advance();
      continue;
    }

    if (char === ']') {
      tokens.push(createToken(TokenType.BRACKET_CLOSE, ']', startLine, startColumn));
      advance();
      continue;
    }

    if (char === '{') {
      tokens.push(createToken(TokenType.BRACE_OPEN, '{', startLine, startColumn));
      advance();
      continue;
    }

    if (char === '}') {
      tokens.push(createToken(TokenType.BRACE_CLOSE, '}', startLine, startColumn));
      advance();
      continue;
    }

    // Read a word token
    const word = readWord();
    if (word.length === 0) {
      throw new TokenizerError(`Unexpected character '${char}'`, startLine, startColumn);
    }

    // Classify the word
    const lowerWord = word.toLowerCase();

    if (lowerWord === 'bpm') {
      tokens.push(createToken(TokenType.BPM, word, startLine, startColumn));
    } else if (lowerWord === 'inst') {
      tokens.push(createToken(TokenType.INST, word, startLine, startColumn));
    } else if (lowerWord === 'seq') {
      tokens.push(createToken(TokenType.SEQ, word, startLine, startColumn));
    } else if (lowerWord === 'swing') {
      tokens.push(createToken(TokenType.SWING, word, startLine, startColumn));
    } else if (lowerWord === 'loop') {
      tokens.push(createToken(TokenType.LOOP, word, startLine, startColumn));
    } else if (lowerWord === 'grid') {
      tokens.push(createToken(TokenType.GRID, word, startLine, startColumn));
    } else if (lowerWord === 'track') {
      tokens.push(createToken(TokenType.TRACK, word, startLine, startColumn));
    } else if (lowerWord === 'pattern') {
      tokens.push(createToken(TokenType.PATTERN, word, startLine, startColumn));
    } else if (lowerWord === 'use') {
      tokens.push(createToken(TokenType.USE, word, startLine, startColumn));
    } else if (lowerWord === 'r') {
      tokens.push(createToken(TokenType.REST, word, startLine, startColumn));
    } else if (isRepeat(word)) {
      tokens.push(createToken(TokenType.REPEAT, word, startLine, startColumn));
    } else if (isNote(word)) {
      tokens.push(createToken(TokenType.NOTE, word, startLine, startColumn));
    } else if (isDuration(word)) {
      tokens.push(createToken(TokenType.DURATION, word, startLine, startColumn));
    } else if (isDecimal(word)) {
      tokens.push(createToken(TokenType.DECIMAL, word, startLine, startColumn));
    } else if (isNumber(word)) {
      tokens.push(createToken(TokenType.NUMBER, word, startLine, startColumn));
    } else if (isIdentifier(word)) {
      tokens.push(createToken(TokenType.IDENTIFIER, word, startLine, startColumn));
    } else {
      throw new TokenizerError(`Invalid token '${word}'`, startLine, startColumn);
    }
  }

  // Add EOF token
  tokens.push(createToken(TokenType.EOF, '', line, column));

  return tokens;
}
