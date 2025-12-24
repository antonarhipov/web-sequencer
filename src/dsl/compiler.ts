/**
 * Compiler Module
 * Converts AST into a list of SynthEvents for audio playback.
 */

import { parse } from './parser';
import type { 
  AST, 
  NoteNode, 
  RestNode, 
  ChordNode, 
  RepeatBlock, 
  PatternUse, 
  SequenceItem,
  PatternDefinition,
  InstDirective,
  GlobalSettings
} from './parser';
import { tokenize } from './tokenizer';
import { parsePitch, pitchToMidi, midiToFrequency } from './pitch';
import { parseDurationToSeconds } from './duration';
import { applySwing } from './swing';

/**
 * ADSR envelope settings for SynthEvent
 */
export interface SynthEventADSR {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

/**
 * SynthEvent represents a single audio event to be scheduled.
 */
export interface SynthEvent {
  t: number;           // Start time in seconds
  dur: number;         // Duration in seconds
  kind: 'note' | 'rest';
  midi: number | null; // MIDI note number (null for rests)
  freq: number | null; // Frequency in Hz (null for rests)
  vel: number;         // Velocity (0-1)
  inst: string;        // Instrument name
  waveform: string;    // Waveform type (sine, square, sawtooth, triangle)
  track?: string;      // Track name (optional)
  gain?: number;       // Instrument gain (optional)
  adsr?: SynthEventADSR; // ADSR envelope (optional)
}

/**
 * CompilationResult contains the compiled events and metadata.
 */
export interface CompilationResult {
  bpm: number;
  totalDuration: number;
  eventCount: number;
  events: SynthEvent[];
  globalSettings: GlobalSettings;
}

// Default values
const DEFAULT_VELOCITY = 0.8;
const DEFAULT_ADSR: SynthEventADSR = {
  attack: 0.005,
  decay: 0.05,
  sustain: 0.7,
  release: 0.08,
};

/**
 * Compiler context for tracking state during compilation
 */
interface CompilerContext {
  bpm: number;
  patterns: Map<string, PatternDefinition>;
  instruments: Map<string, InstDirective>;
  defaultInstrument: InstDirective;
}

/**
 * Compile an AST into a list of SynthEvents.
 * @param ast - The AST from the parser
 * @returns Array of SynthEvents sorted by start time
 */
export function compile(ast: AST): SynthEvent[] {
  const events: SynthEvent[] = [];
  const bpm = ast.bpm.value;

  // Build context
  const context: CompilerContext = {
    bpm,
    patterns: new Map(),
    instruments: new Map(),
    defaultInstrument: ast.instrument,
  };

  // Index patterns by name
  for (const pattern of ast.patterns) {
    context.patterns.set(pattern.name, pattern);
  }

  // Index instruments by name
  for (const inst of ast.instruments) {
    context.instruments.set(inst.name, inst);
  }

  // Compile main sequence if present
  if (ast.sequence) {
    const inst = ast.instrument;
    compileSequenceItems(
      ast.sequence.items,
      0,
      inst,
      undefined,
      context,
      events
    );
  }

  // Compile tracks
  for (const track of ast.tracks) {
    const inst = context.instruments.get(track.instrumentName);
    if (!inst) {
      const availableInstruments = Array.from(context.instruments.keys());
      const suggestion = availableInstruments.length > 0
        ? `Available instruments: ${availableInstruments.join(', ')}`
        : 'No instruments defined. Add an instrument with: inst <name> <waveform>';
      throw new Error(
        `Track '${track.name}' references undefined instrument '${track.instrumentName}'. ${suggestion}`
      );
    }
    compileSequenceItems(
      track.items,
      0, // Tracks start at time 0 (play simultaneously)
      inst,
      track.name,
      context,
      events
    );
  }

  // Sort events by start time
  events.sort((a, b) => a.t - b.t);

  return events;
}

/**
 * Compile sequence items into events
 * @returns The end time after all items
 */
function compileSequenceItems(
  items: SequenceItem[],
  startTime: number,
  instrument: InstDirective,
  trackName: string | undefined,
  context: CompilerContext,
  events: SynthEvent[]
): number {
  let currentTime = startTime;

  for (const item of items) {
    currentTime = compileSequenceItem(item, currentTime, instrument, trackName, context, events);
  }

  return currentTime;
}

/**
 * Compile a single sequence item
 * @returns The end time after this item
 */
function compileSequenceItem(
  item: SequenceItem,
  currentTime: number,
  instrument: InstDirective,
  trackName: string | undefined,
  context: CompilerContext,
  events: SynthEvent[]
): number {
  switch (item.type) {
    case 'note':
      return compileNote(item, currentTime, instrument, trackName, events, context);
    case 'rest':
      return compileRest(item, currentTime, instrument, trackName, events, context);
    case 'chord':
      return compileChord(item, currentTime, instrument, trackName, events, context);
    case 'repeat':
      return compileRepeatBlock(item, currentTime, instrument, trackName, context, events);
    case 'patternUse':
      return compilePatternUse(item, currentTime, instrument, trackName, context, events);
    default:
      throw new Error(`Unknown sequence item type: ${(item as SequenceItem).type}`);
  }
}

/**
 * Build ADSR settings from instrument definition
 */
function buildADSR(instrument: InstDirective): SynthEventADSR {
  const adsr = instrument.adsr || {};
  return {
    attack: adsr.attack ?? DEFAULT_ADSR.attack,
    decay: adsr.decay ?? DEFAULT_ADSR.decay,
    sustain: adsr.sustain ?? DEFAULT_ADSR.sustain,
    release: adsr.release ?? DEFAULT_ADSR.release,
  };
}

/**
 * Compile a note into an event
 */
function compileNote(
  note: NoteNode,
  currentTime: number,
  instrument: InstDirective,
  trackName: string | undefined,
  events: SynthEvent[],
  context: CompilerContext
): number {
  const duration = parseDurationToSeconds(note.duration, context.bpm);
  const pitch = parsePitch(note.pitch);
  const midi = pitchToMidi(pitch);
  const freq = midiToFrequency(midi);
  const velocity = note.velocity ?? DEFAULT_VELOCITY;

  const event: SynthEvent = {
    t: currentTime,
    dur: duration,
    kind: 'note',
    midi,
    freq,
    vel: velocity,
    inst: instrument.name,
    waveform: instrument.waveform,
  };

  if (trackName) {
    event.track = trackName;
  }

  if (instrument.gain !== undefined) {
    event.gain = instrument.gain;
  }

  if (instrument.adsr) {
    event.adsr = buildADSR(instrument);
  }

  events.push(event);
  return currentTime + duration;
}

/**
 * Compile a rest into an event
 */
function compileRest(
  rest: RestNode,
  currentTime: number,
  instrument: InstDirective,
  trackName: string | undefined,
  events: SynthEvent[],
  context: CompilerContext
): number {
  const duration = parseDurationToSeconds(rest.duration, context.bpm);

  const event: SynthEvent = {
    t: currentTime,
    dur: duration,
    kind: 'rest',
    midi: null,
    freq: null,
    vel: 0,
    inst: instrument.name,
    waveform: instrument.waveform,
  };

  if (trackName) {
    event.track = trackName;
  }

  events.push(event);
  return currentTime + duration;
}

/**
 * Compile a chord into multiple events at the same time
 */
function compileChord(
  chord: ChordNode,
  currentTime: number,
  instrument: InstDirective,
  trackName: string | undefined,
  events: SynthEvent[],
  context: CompilerContext
): number {
  const duration = parseDurationToSeconds(chord.duration, context.bpm);
  const velocity = chord.velocity ?? DEFAULT_VELOCITY;

  for (const pitchStr of chord.pitches) {
    const pitch = parsePitch(pitchStr);
    const midi = pitchToMidi(pitch);
    const freq = midiToFrequency(midi);

    const event: SynthEvent = {
      t: currentTime,
      dur: duration,
      kind: 'note',
      midi,
      freq,
      vel: velocity,
      inst: instrument.name,
      waveform: instrument.waveform,
    };

    if (trackName) {
      event.track = trackName;
    }

    if (instrument.gain !== undefined) {
      event.gain = instrument.gain;
    }

    if (instrument.adsr) {
      event.adsr = buildADSR(instrument);
    }

    events.push(event);
  }

  return currentTime + duration;
}

/**
 * Compile a repeat block by expanding it N times
 */
function compileRepeatBlock(
  repeat: RepeatBlock,
  currentTime: number,
  instrument: InstDirective,
  trackName: string | undefined,
  context: CompilerContext,
  events: SynthEvent[]
): number {
  let time = currentTime;

  for (let i = 0; i < repeat.count; i++) {
    time = compileSequenceItems(repeat.items, time, instrument, trackName, context, events);
  }

  return time;
}

/**
 * Compile a pattern use by looking up and expanding the pattern
 */
function compilePatternUse(
  patternUse: PatternUse,
  currentTime: number,
  instrument: InstDirective,
  trackName: string | undefined,
  context: CompilerContext,
  events: SynthEvent[]
): number {
  const pattern = context.patterns.get(patternUse.name);
  if (!pattern) {
    const availablePatterns = Array.from(context.patterns.keys());
    const suggestion = availablePatterns.length > 0
      ? `Available patterns: ${availablePatterns.join(', ')}`
      : 'No patterns defined. Define a pattern with: pattern <name>: <notes>';
    throw new Error(
      `Pattern '${patternUse.name}' is not defined. ${suggestion}`
    );
  }

  let time = currentTime;

  for (let i = 0; i < patternUse.repetitions; i++) {
    time = compileSequenceItems(pattern.items, time, instrument, trackName, context, events);
  }

  return time;
}

/**
 * Calculate the total duration of all events.
 * @param events - Array of SynthEvents
 * @returns Total duration in seconds
 */
function calculateTotalDuration(events: SynthEvent[]): number {
  if (events.length === 0) {
    return 0;
  }

  let maxEndTime = 0;
  for (const event of events) {
    const endTime = event.t + event.dur;
    if (endTime > maxEndTime) {
      maxEndTime = endTime;
    }
  }
  return maxEndTime;
}

/**
 * Generate a compilation summary.
 * @param result - CompilationResult
 * @returns Summary string
 */
export function generateSummary(result: CompilationResult): string {
  const noteCount = result.events.filter(e => e.kind === 'note').length;
  const restCount = result.events.filter(e => e.kind === 'rest').length;

  const lines = [
    `BPM: ${result.bpm}`,
    `Total Duration: ${result.totalDuration.toFixed(3)}s`,
    `Events: ${result.eventCount} (${noteCount} notes, ${restCount} rests)`,
  ];

  // Add global settings info if available
  if (result.globalSettings) {
    if (result.globalSettings.swing > 0) {
      lines.push(`Swing: ${result.globalSettings.swing}`);
    }
    if (result.globalSettings.loop > 1) {
      lines.push(`Loop: ${result.globalSettings.loop} bars`);
    }
    lines.push(`Grid: 1/${result.globalSettings.grid}`);
  }

  return lines.join('\n');
}

/**
 * Format events as JSON for display.
 * @param events - Array of SynthEvents
 * @returns Formatted JSON string
 */
export function formatEventsAsJson(events: SynthEvent[]): string {
  return JSON.stringify(events, null, 2);
}

/**
 * Compile DSL source code into a CompilationResult.
 * This is the main pipeline function that combines tokenize, parse, and compile.
 * @param source - DSL source code string
 * @returns CompilationResult with events and metadata
 */
export function compileFromSource(source: string): CompilationResult {
  const tokens = tokenize(source);
  const ast = parse(tokens);
  let events = compile(ast);

  // Apply swing transform if swing is enabled
  const { swing, grid } = ast.globalSettings;
  if (swing > 0) {
    events = applySwing(events, swing, grid, ast.bpm.value);
  }

  return {
    bpm: ast.bpm.value,
    totalDuration: calculateTotalDuration(events),
    eventCount: events.length,
    events,
    globalSettings: ast.globalSettings,
  };
}
