/**
 * Parser Module
 * Converts tokens into an Abstract Syntax Tree (AST).
 */

import { TokenType } from './tokenizer';
import type { Token } from './tokenizer';

// AST Node Types

export interface NoteNode {
  type: 'note';
  pitch: string;       // e.g., 'C4', 'D#3'
  duration: string;    // e.g., '1/4', '1/8'
  velocity?: number;   // Optional per-note velocity (0-1)
  line: number;
  column: number;
}

export interface RestNode {
  type: 'rest';
  duration: string;    // e.g., '1/4', '1/8'
  line: number;
  column: number;
}

// Chord: multiple notes played simultaneously
export interface ChordNode {
  type: 'chord';
  pitches: string[];   // e.g., ['C4', 'E4', 'G4']
  duration: string;    // e.g., '1/4'
  velocity?: number;   // Optional velocity (0-1)
  line: number;
  column: number;
}

// Repeat block: repeat a sequence N times
export interface RepeatBlock {
  type: 'repeat';
  count: number;       // Number of repetitions
  items: SequenceItem[];
  line: number;
  column: number;
}

// Pattern use: reference to a defined pattern
export interface PatternUse {
  type: 'patternUse';
  name: string;        // Pattern name
  repetitions: number; // Number of times to use (default 1)
  line: number;
  column: number;
}

export type SequenceItem = NoteNode | RestNode | ChordNode | RepeatBlock | PatternUse;

export interface BpmDirective {
  type: 'bpm';
  value: number;
  line: number;
  column: number;
}

// Global settings directives
export interface SwingDirective {
  type: 'swing';
  value: number;       // 0 to 0.75
  line: number;
  column: number;
}

export interface LoopDirective {
  type: 'loop';
  bars: number;        // Number of bars to loop
  line: number;
  column: number;
}

export interface GridDirective {
  type: 'grid';
  denominator: number; // Grid subdivision (e.g., 16 for 16th notes)
  line: number;
  column: number;
}

// ADSR envelope parameters for instruments
export interface ADSRParams {
  attack?: number;     // Attack time in seconds
  decay?: number;      // Decay time in seconds
  sustain?: number;    // Sustain level (0-1)
  release?: number;    // Release time in seconds
}

export interface InstDirective {
  type: 'inst';
  name: string;
  waveform: string;
  gain?: number;       // Optional gain (0-1)
  adsr?: ADSRParams;   // Optional ADSR envelope
  line: number;
  column: number;
}

// Pattern definition
export interface PatternDefinition {
  type: 'pattern';
  name: string;
  items: SequenceItem[];
  line: number;
  column: number;
}

// Track definition
export interface TrackDefinition {
  type: 'track';
  name: string;
  instrumentName: string;
  items: SequenceItem[];
  line: number;
  column: number;
}

export interface Sequence {
  type: 'sequence';
  items: SequenceItem[];
  line: number;
  column: number;
}

// Global settings container
export interface GlobalSettings {
  swing: number;       // Default 0
  loop: number;        // Default 1
  grid: number;        // Default 16
}

export interface Program {
  type: 'program';
  bpm: BpmDirective;
  instrument: InstDirective;
  instruments: InstDirective[];     // Multiple instrument definitions
  patterns: PatternDefinition[];    // Pattern definitions
  tracks: TrackDefinition[];        // Track definitions
  sequence: Sequence | null;
  globalSettings: GlobalSettings;
}

export type AST = Program;

// Valid waveform types
const VALID_WAVEFORMS = ['sine', 'square', 'sawtooth', 'triangle'];

export class ParseError extends Error {
  line: number;
  column: number;

  constructor(message: string, line: number, column: number) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = 'ParseError';
    this.line = line;
    this.column = column;
  }
}

/**
 * Parser class for DSL parsing
 */
class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const token = this.current();
    if (token.type !== TokenType.EOF) {
      this.pos++;
    }
    return token;
  }

  private expect(type: TokenType, message?: string): Token {
    const token = this.current();
    if (token.type !== type) {
      const msg = message || `Expected ${type}, got ${token.type}`;
      throw new ParseError(msg, token.line, token.column);
    }
    return this.advance();
  }

  private isAtEnd(): boolean {
    return this.current().type === TokenType.EOF;
  }

  /**
   * Parse the complete program
   */
  parse(): Program {
    let bpm: BpmDirective | null = null;
    let sequence: Sequence | null = null;
    const instruments: InstDirective[] = [];
    const patterns: PatternDefinition[] = [];
    const tracks: TrackDefinition[] = [];
    const globalSettings: GlobalSettings = {
      swing: 0,
      loop: 1,
      grid: 16,
    };

    while (!this.isAtEnd()) {
      const token = this.current();

      switch (token.type) {
        case TokenType.BPM:
          if (bpm !== null) {
            throw new ParseError('Duplicate bpm directive', token.line, token.column);
          }
          bpm = this.parseBpmDirective();
          break;

        case TokenType.INST:
          instruments.push(this.parseInstDirective());
          break;

        case TokenType.SEQ:
          if (sequence !== null) {
            throw new ParseError('Duplicate seq block', token.line, token.column);
          }
          sequence = this.parseSequence();
          break;

        case TokenType.SWING:
          this.parseSwingDirective(globalSettings, token);
          break;

        case TokenType.LOOP:
          this.parseLoopDirective(globalSettings, token);
          break;

        case TokenType.GRID:
          this.parseGridDirective(globalSettings, token);
          break;

        case TokenType.PATTERN:
          patterns.push(this.parsePatternDefinition());
          break;

        case TokenType.TRACK:
          tracks.push(this.parseTrackDefinition());
          break;

        default:
          throw new ParseError(
            `Unexpected token '${token.value || token.type}'`,
            token.line,
            token.column
          );
      }
    }

    // Apply defaults if not specified
    if (bpm === null) {
      bpm = {
        type: 'bpm',
        value: 120,
        line: 0,
        column: 0,
      };
    }

    // Default instrument if none specified
    const defaultInstrument: InstDirective = instruments.length > 0
      ? instruments[0]
      : {
          type: 'inst',
          name: 'lead',
          waveform: 'sine',
          line: 0,
          column: 0,
        };

    return {
      type: 'program',
      bpm,
      instrument: defaultInstrument,
      instruments: instruments.length > 0 ? instruments : [defaultInstrument],
      patterns,
      tracks,
      sequence,
      globalSettings,
    };
  }

  /**
   * Parse bpm directive: bpm <number>
   */
  private parseBpmDirective(): BpmDirective {
    const bpmToken = this.expect(TokenType.BPM);
    const numberToken = this.expect(TokenType.NUMBER, 'Expected number after bpm');

    const value = parseInt(numberToken.value, 10);
    if (isNaN(value) || value <= 0) {
      throw new ParseError(
        `Invalid BPM value: ${numberToken.value}`,
        numberToken.line,
        numberToken.column
      );
    }

    return {
      type: 'bpm',
      value,
      line: bpmToken.line,
      column: bpmToken.column,
    };
  }

  /**
   * Parse swing directive: swing <0..0.75>
   */
  private parseSwingDirective(globalSettings: GlobalSettings, startToken: Token): void {
    this.expect(TokenType.SWING);
    const valueToken = this.current();
    
    let value: number;
    if (valueToken.type === TokenType.DECIMAL) {
      value = parseFloat(this.advance().value);
    } else if (valueToken.type === TokenType.NUMBER) {
      value = parseFloat(this.advance().value);
    } else {
      throw new ParseError('Expected number after swing', valueToken.line, valueToken.column);
    }

    if (isNaN(value) || value < 0 || value > 0.75) {
      throw new ParseError(
        `Invalid swing value: ${value}. Must be between 0 and 0.75`,
        startToken.line,
        startToken.column
      );
    }

    globalSettings.swing = value;
  }

  /**
   * Parse loop directive: loop <bars>
   */
  private parseLoopDirective(globalSettings: GlobalSettings, startToken: Token): void {
    this.expect(TokenType.LOOP);
    const numberToken = this.expect(TokenType.NUMBER, 'Expected number after loop');
    
    const bars = parseInt(numberToken.value, 10);
    if (isNaN(bars) || bars <= 0) {
      throw new ParseError(
        `Invalid loop value: ${numberToken.value}. Must be a positive integer`,
        startToken.line,
        startToken.column
      );
    }

    globalSettings.loop = bars;
  }

  /**
   * Parse grid directive: grid <denominator>
   */
  private parseGridDirective(globalSettings: GlobalSettings, startToken: Token): void {
    this.expect(TokenType.GRID);
    const numberToken = this.expect(TokenType.NUMBER, 'Expected number after grid');
    
    const denominator = parseInt(numberToken.value, 10);
    const validGridValues = [2, 4, 8, 16, 32, 64];
    if (isNaN(denominator) || !validGridValues.includes(denominator)) {
      throw new ParseError(
        `Invalid grid value: ${numberToken.value}. Must be one of: ${validGridValues.join(', ')}`,
        startToken.line,
        startToken.column
      );
    }

    globalSettings.grid = denominator;
  }

  /**
   * Parse inst directive: inst <name> <waveform> [key=value ...]
   * Supports: gain=<0..1>, attack=<s>, decay=<s>, sustain=<0..1>, release=<s>
   */
  private parseInstDirective(): InstDirective {
    const instToken = this.expect(TokenType.INST);
    const nameToken = this.expect(TokenType.IDENTIFIER, 'Expected instrument name after inst');
    const waveformToken = this.expect(TokenType.IDENTIFIER, 'Expected waveform after instrument name');

    const waveform = waveformToken.value.toLowerCase();
    if (!VALID_WAVEFORMS.includes(waveform)) {
      throw new ParseError(
        `Invalid waveform '${waveformToken.value}'. Valid options: ${VALID_WAVEFORMS.join(', ')}`,
        waveformToken.line,
        waveformToken.column
      );
    }

    const result: InstDirective = {
      type: 'inst',
      name: nameToken.value,
      waveform,
      line: instToken.line,
      column: instToken.column,
    };

    // Parse optional key=value parameters
    const adsr: ADSRParams = {};
    let hasAdsr = false;

    while (this.current().type === TokenType.IDENTIFIER) {
      const keyToken = this.current();
      const key = keyToken.value.toLowerCase();
      
      // Check if this looks like a key=value pair
      const nextPos = this.pos + 1;
      if (nextPos >= this.tokens.length || this.tokens[nextPos].type !== TokenType.EQUALS) {
        break; // Not a key=value pair, stop parsing instrument params
      }

      this.advance(); // consume key
      this.expect(TokenType.EQUALS, 'Expected = after parameter name');
      
      const valueToken = this.current();
      let value: number;
      
      if (valueToken.type === TokenType.DECIMAL) {
        value = parseFloat(this.advance().value);
      } else if (valueToken.type === TokenType.NUMBER) {
        value = parseFloat(this.advance().value);
      } else {
        throw new ParseError(
          `Expected number value for ${key}`,
          valueToken.line,
          valueToken.column
        );
      }

      switch (key) {
        case 'gain':
          if (value < 0 || value > 1) {
            throw new ParseError(
              `Invalid gain value: ${value}. Must be between 0 and 1`,
              keyToken.line,
              keyToken.column
            );
          }
          result.gain = value;
          break;
        case 'attack':
          if (value < 0) {
            throw new ParseError(
              `Invalid attack value: ${value}. Must be >= 0`,
              keyToken.line,
              keyToken.column
            );
          }
          adsr.attack = value;
          hasAdsr = true;
          break;
        case 'decay':
          if (value < 0) {
            throw new ParseError(
              `Invalid decay value: ${value}. Must be >= 0`,
              keyToken.line,
              keyToken.column
            );
          }
          adsr.decay = value;
          hasAdsr = true;
          break;
        case 'sustain':
          if (value < 0 || value > 1) {
            throw new ParseError(
              `Invalid sustain value: ${value}. Must be between 0 and 1`,
              keyToken.line,
              keyToken.column
            );
          }
          adsr.sustain = value;
          hasAdsr = true;
          break;
        case 'release':
          if (value < 0) {
            throw new ParseError(
              `Invalid release value: ${value}. Must be >= 0`,
              keyToken.line,
              keyToken.column
            );
          }
          adsr.release = value;
          hasAdsr = true;
          break;
        default:
          throw new ParseError(
            `Unknown instrument parameter: ${key}`,
            keyToken.line,
            keyToken.column
          );
      }
    }

    if (hasAdsr) {
      result.adsr = adsr;
    }

    return result;
  }

  /**
   * Parse pattern definition: pattern <name>: <sequence items>
   */
  private parsePatternDefinition(): PatternDefinition {
    const patternToken = this.expect(TokenType.PATTERN);
    const nameToken = this.expect(TokenType.IDENTIFIER, 'Expected pattern name after pattern');
    this.expect(TokenType.COLON, 'Expected : after pattern name');

    const items = this.parseSequenceItems();

    return {
      type: 'pattern',
      name: nameToken.value,
      items,
      line: patternToken.line,
      column: patternToken.column,
    };
  }

  /**
   * Parse track definition: track <name> inst=<instName>: <sequence items>
   */
  private parseTrackDefinition(): TrackDefinition {
    const trackToken = this.expect(TokenType.TRACK);
    const nameToken = this.expect(TokenType.IDENTIFIER, 'Expected track name after track');
    
    // Parse inst=<instName> - 'inst' is tokenized as INST keyword
    const instKeyToken = this.current();
    if (instKeyToken.type !== TokenType.INST) {
      throw new ParseError(
        `Expected 'inst' keyword after track name`,
        instKeyToken.line,
        instKeyToken.column
      );
    }
    this.advance(); // consume 'inst'
    this.expect(TokenType.EQUALS, 'Expected = after inst');
    const instNameToken = this.expect(TokenType.IDENTIFIER, 'Expected instrument name after inst=');
    this.expect(TokenType.COLON, 'Expected : after track definition');

    const items = this.parseSequenceItems();

    return {
      type: 'track',
      name: nameToken.value,
      instrumentName: instNameToken.value,
      items,
      line: trackToken.line,
      column: trackToken.column,
    };
  }

  /**
   * Parse seq block: seq: <note|rest> [, <note|rest>]*
   */
  private parseSequence(): Sequence {
    const seqToken = this.expect(TokenType.SEQ);
    this.expect(TokenType.COLON, 'Expected : after seq');

    const items = this.parseSequenceItems();

    return {
      type: 'sequence',
      items,
      line: seqToken.line,
      column: seqToken.column,
    };
  }

  /**
   * Check if a token type indicates the start of a new top-level directive
   */
  private isDirectiveToken(type: TokenType): boolean {
    return type === TokenType.BPM || 
           type === TokenType.INST || 
           type === TokenType.SEQ ||
           type === TokenType.SWING ||
           type === TokenType.LOOP ||
           type === TokenType.GRID ||
           type === TokenType.PATTERN ||
           type === TokenType.TRACK;
  }

  /**
   * Parse sequence items (notes, rests, chords, repeat blocks, pattern uses)
   */
  private parseSequenceItems(): SequenceItem[] {
    const items: SequenceItem[] = [];

    while (!this.isAtEnd()) {
      const token = this.current();

      // Check if we've reached another directive
      if (this.isDirectiveToken(token.type)) {
        break;
      }

      // Also stop at closing brace (end of repeat block)
      if (token.type === TokenType.BRACE_CLOSE) {
        break;
      }

      if (token.type === TokenType.NOTE) {
        items.push(this.parseNote());
      } else if (token.type === TokenType.REST) {
        items.push(this.parseRest());
      } else if (token.type === TokenType.BRACKET_OPEN) {
        items.push(this.parseChord());
      } else if (token.type === TokenType.REPEAT) {
        items.push(this.parseRepeatBlock());
      } else if (token.type === TokenType.USE) {
        items.push(this.parsePatternUse());
      } else if (token.type === TokenType.COMMA) {
        // Skip commas between items
        this.advance();
      } else {
        throw new ParseError(
          `Expected note, rest, chord, repeat, or use in sequence, got '${token.value || token.type}'`,
          token.line,
          token.column
        );
      }
    }

    return items;
  }

  /**
   * Parse a chord: [<pitch> <pitch> ...] <duration> [vel=<0..1>]
   */
  private parseChord(): ChordNode {
    const startToken = this.expect(TokenType.BRACKET_OPEN);
    const pitches: string[] = [];

    // Parse pitches inside brackets
    while (this.current().type !== TokenType.BRACKET_CLOSE) {
      if (this.isAtEnd()) {
        throw new ParseError('Unclosed chord bracket', startToken.line, startToken.column);
      }
      
      if (this.current().type === TokenType.NOTE) {
        pitches.push(this.advance().value);
      } else {
        throw new ParseError(
          `Expected note in chord, got '${this.current().value || this.current().type}'`,
          this.current().line,
          this.current().column
        );
      }
    }

    this.expect(TokenType.BRACKET_CLOSE, 'Expected ] to close chord');
    const durationToken = this.expect(TokenType.DURATION, 'Expected duration after chord');

    const result: ChordNode = {
      type: 'chord',
      pitches,
      duration: durationToken.value,
      line: startToken.line,
      column: startToken.column,
    };

    // Check for optional velocity
    if (this.current().type === TokenType.IDENTIFIER && this.current().value.toLowerCase() === 'vel') {
      this.advance();
      this.expect(TokenType.EQUALS, 'Expected = after vel');
      
      const velToken = this.current();
      let velocity: number;
      if (velToken.type === TokenType.DECIMAL) {
        velocity = parseFloat(this.advance().value);
      } else if (velToken.type === TokenType.NUMBER) {
        velocity = parseFloat(this.advance().value);
      } else {
        throw new ParseError('Expected number for velocity', velToken.line, velToken.column);
      }

      if (velocity < 0 || velocity > 1) {
        throw new ParseError(
          `Invalid velocity: ${velocity}. Must be between 0 and 1`,
          velToken.line,
          velToken.column
        );
      }
      result.velocity = velocity;
    }

    return result;
  }

  /**
   * Parse a repeat block: xN { ... }
   */
  private parseRepeatBlock(): RepeatBlock {
    const repeatToken = this.expect(TokenType.REPEAT);
    const count = parseInt(repeatToken.value.substring(1), 10); // Remove 'x' prefix

    if (isNaN(count) || count <= 0) {
      throw new ParseError(
        `Invalid repeat count: ${repeatToken.value}`,
        repeatToken.line,
        repeatToken.column
      );
    }

    this.expect(TokenType.BRACE_OPEN, 'Expected { after repeat count');
    const items = this.parseSequenceItems();
    this.expect(TokenType.BRACE_CLOSE, 'Expected } to close repeat block');

    return {
      type: 'repeat',
      count,
      items,
      line: repeatToken.line,
      column: repeatToken.column,
    };
  }

  /**
   * Parse pattern use: use <patternName> [xN]
   */
  private parsePatternUse(): PatternUse {
    const useToken = this.expect(TokenType.USE);
    const nameToken = this.expect(TokenType.IDENTIFIER, 'Expected pattern name after use');

    let repetitions = 1;
    if (this.current().type === TokenType.REPEAT) {
      const repeatToken = this.advance();
      repetitions = parseInt(repeatToken.value.substring(1), 10);
      if (isNaN(repetitions) || repetitions <= 0) {
        throw new ParseError(
          `Invalid repetition count: ${repeatToken.value}`,
          repeatToken.line,
          repeatToken.column
        );
      }
    }

    return {
      type: 'patternUse',
      name: nameToken.value,
      repetitions,
      line: useToken.line,
      column: useToken.column,
    };
  }

  /**
   * Parse a note: <pitch> <duration> [vel=<0..1>]
   */
  private parseNote(): NoteNode {
    const pitchToken = this.expect(TokenType.NOTE);
    const durationToken = this.expect(TokenType.DURATION, 'Expected duration after note');

    const result: NoteNode = {
      type: 'note',
      pitch: pitchToken.value,
      duration: durationToken.value,
      line: pitchToken.line,
      column: pitchToken.column,
    };

    // Check for optional velocity
    if (this.current().type === TokenType.IDENTIFIER && this.current().value.toLowerCase() === 'vel') {
      this.advance();
      this.expect(TokenType.EQUALS, 'Expected = after vel');
      
      const velToken = this.current();
      let velocity: number;
      if (velToken.type === TokenType.DECIMAL) {
        velocity = parseFloat(this.advance().value);
      } else if (velToken.type === TokenType.NUMBER) {
        velocity = parseFloat(this.advance().value);
      } else {
        throw new ParseError('Expected number for velocity', velToken.line, velToken.column);
      }

      if (velocity < 0 || velocity > 1) {
        throw new ParseError(
          `Invalid velocity: ${velocity}. Must be between 0 and 1`,
          velToken.line,
          velToken.column
        );
      }
      result.velocity = velocity;
    }

    return result;
  }

  /**
   * Parse a rest: r <duration>
   */
  private parseRest(): RestNode {
    const restToken = this.expect(TokenType.REST);
    const durationToken = this.expect(TokenType.DURATION, 'Expected duration after rest');

    return {
      type: 'rest',
      duration: durationToken.value,
      line: restToken.line,
      column: restToken.column,
    };
  }
}

/**
 * Parse tokens into an AST.
 * @param tokens - Array of tokens from the tokenizer
 * @returns AST (Program node)
 * @throws ParseError on syntax errors
 */
export function parse(tokens: Token[]): AST {
  const parser = new Parser(tokens);
  return parser.parse();
}
