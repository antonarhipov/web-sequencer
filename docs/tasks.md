# Technical Task List

This document contains the detailed enumerated task list for implementing the Web DSL Music Sequencer. Each task is linked to the corresponding plan item in `docs/plan.md` and related requirements in `docs/requirements.md`.

---

## Phase 1: Project Foundation

### Setup and Scaffolding
> Plan: P1.1 | Requirements: Req 1, Req 17

- [x] 1.1.1 Initialize new Vite project with TypeScript template (`npm create vite@latest`)
- [x] 1.1.2 Configure `tsconfig.json` with strict mode enabled
- [x] 1.1.3 Create directory structure: `src/dsl/`, `src/audio/`, `src/ui/`
- [x] 1.1.4 Install and configure Vitest for unit testing
- [x] 1.1.5 Create initial `README.md` with project description and setup commands
- [x] 1.1.6 Verify `npm install` and `npm run dev` work correctly

### Basic UI Layout
> Plan: P1.2 | Requirements: Req 2, Req 3

- [x] 1.2.1 Create `index.html` with main container structure
- [x] 1.2.2 Implement split layout CSS (editor left, output right/bottom)
- [x] 1.2.3 Add `<textarea>` element for DSL editor with appropriate sizing
- [x] 1.2.4 Add output panel `<div>` for compilation results and errors
- [x] 1.2.5 Create Play, Stop, and Compile buttons with basic styling
- [x] 1.2.6 Prefill editor textarea with example DSL program
- [x] 1.2.7 Apply basic responsive CSS styling

---

## Phase 2: DSL Core — Parsing

### Pitch Parsing Module
> Plan: P2.1 | Requirements: Req 6, Req 8

- [x] 2.1.1 Create `src/dsl/pitch.ts` module
- [x] 2.1.2 Implement `parsePitch(str: string)` function to extract note name, accidental, octave
- [x] 2.1.3 Implement `pitchToMidi(pitch)` function (A4 = 69)
- [x] 2.1.4 Implement `midiToFrequency(midi)` function (A4 = 440 Hz)
- [x] 2.1.5 Handle sharp (#) and flat (b) accidentals
- [x] 2.1.6 Add validation for invalid pitch names and out-of-range octaves
- [x] 2.1.7 Create `src/dsl/__tests__/pitch.test.ts` with unit tests
- [x] 2.1.8 Test cases: C4→60, A4→69→440Hz, D#3, Bb2, invalid inputs

### Duration Parsing Module
> Plan: P2.2 | Requirements: Req 7

- [x] 2.2.1 Create `src/dsl/duration.ts` module
- [x] 2.2.2 Implement `parseDuration(str: string)` to parse fractions (e.g., "1/4", "3/16")
- [x] 2.2.3 Implement `durationToSeconds(fraction, bpm)` function
- [x] 2.2.4 Handle edge cases: invalid format, zero denominator
- [x] 2.2.5 Create `src/dsl/__tests__/duration.test.ts` with unit tests
- [x] 2.2.6 Test cases: 1/4 at 120bpm = 0.5s, 1/8 at 120bpm = 0.25s, 3/16 at 120bpm

### Tokenizer Implementation
> Plan: P2.3 | Requirements: Req 6

- [x] 2.3.1 Create `src/dsl/tokenizer.ts` module
- [x] 2.3.2 Define token types enum: BPM, INST, SEQ, NOTE, REST, COMMA, EOF, etc.
- [x] 2.3.3 Define Token interface with type, value, line, column
- [x] 2.3.4 Implement `tokenize(input: string): Token[]` function
- [x] 2.3.5 Track line and column numbers during tokenization
- [x] 2.3.6 Handle flexible whitespace and newlines
- [x] 2.3.7 Create `src/dsl/__tests__/tokenizer.test.ts` with unit tests

### Parser Implementation
> Plan: P2.4 | Requirements: Req 4, Req 5, Req 6

- [x] 2.4.1 Create `src/dsl/parser.ts` module
- [x] 2.4.2 Define AST types: Program, BpmDirective, InstDirective, Sequence, NoteToken, RestToken
- [x] 2.4.3 Implement `parse(tokens: Token[]): AST` function
- [x] 2.4.4 Parse `bpm <number>` directive, default to 120 if missing
- [x] 2.4.5 Parse `inst <name> <waveform>` directive, default to "lead sine"
- [x] 2.4.6 Parse `seq:` block with comma-separated note/rest tokens
- [x] 2.4.7 Generate ParseError with line/column on syntax errors
- [x] 2.4.8 Create `src/dsl/__tests__/parser.test.ts` with unit tests

---

## Phase 3: DSL Core — Compilation

### Compiler Implementation
> Plan: P3.1 | Requirements: Req 9

- [x] 3.1.1 Create `src/dsl/compiler.ts` module
- [x] 3.1.2 Define `SynthEvent` type with t, dur, kind, midi, freq, vel, inst
- [x] 3.1.3 Implement `compile(ast: AST): SynthEvent[]` function
- [x] 3.1.4 Calculate event start times based on BPM and accumulated duration
- [x] 3.1.5 Convert pitch tokens to MIDI and frequency using pitch module
- [x] 3.1.6 Set constant velocity (0.8) for MVP
- [x] 3.1.7 Handle rests: advance time without creating sound event (or mark kind="rest")
- [x] 3.1.8 Sort events by start time `t`
- [x] 3.1.9 Create `src/dsl/__tests__/compiler.test.ts` with unit tests

### Compile Output and Summary
> Plan: P3.2 | Requirements: Req 9, Req 10

- [x] 3.2.1 Create `CompilationResult` type with bpm, totalDuration, eventCount, events
- [x] 3.2.2 Implement summary generation function
- [x] 3.2.3 Implement JSON formatting for event list display
- [x] 3.2.4 Create `compileFromSource(source: string): CompilationResult` pipeline function

---

## Phase 4: Error Handling

### Error Reporting System
> Plan: P4.1 | Requirements: Req 11, Req 16

- [x] 4.1.1 Create `src/dsl/errors.ts` module
- [x] 4.1.2 Define `DSLError` class with message, line, column properties
- [x] 4.1.3 Implement error formatting function for display
- [x] 4.1.4 Add simple line highlighting logic for editor (CSS class or inline style)
- [x] 4.1.5 Wrap tokenize/parse/compile in try-catch in UI layer
- [x] 4.1.6 Implement error clearing on successful recompilation

---

## Phase 5: Audio Engine

### Audio Context Management
> Plan: P5.1 | Requirements: Req 12

- [x] 5.1.1 Create `src/audio/engine.ts` module
- [x] 5.1.2 Implement `getAudioContext()` singleton function
- [x] 5.1.3 Create AudioContext lazily on first call (user gesture)
- [x] 5.1.4 Handle AudioContext resume if suspended (browser autoplay policy)

### Audio Scheduling Engine
> Plan: P5.2 | Requirements: Req 13, Req 14

- [x] 5.2.1 Implement `scheduleEvents(events: SynthEvent[], startOffset: number)` function
- [x] 5.2.2 Calculate base `startTime = ctx.currentTime + 0.1`
- [x] 5.2.3 For each note event, create OscillatorNode with correct frequency and waveform
- [x] 5.2.4 Create GainNode and connect: Oscillator → Gain → destination
- [x] 5.2.5 Implement ADSR envelope on GainNode:
  - [x] 5.2.5.1 Attack: ramp to peak in ~0.005s
  - [x] 5.2.5.2 Decay: ramp to sustain level (~0.7) in ~0.05s
  - [x] 5.2.5.3 Sustain: hold level for note duration
  - [x] 5.2.5.4 Release: ramp to 0 in ~0.08s
- [x] 5.2.6 Schedule oscillator.start(time) and oscillator.stop(time + dur + release)
- [x] 5.2.7 Add code comments explaining scheduling decisions

### Stop and Cleanup
> Plan: P5.3 | Requirements: Req 15

- [x] 5.3.1 Create array to track active oscillator/gain nodes
- [x] 5.3.2 Implement `stopPlayback()` function
- [x] 5.3.3 Call stop() on all active oscillators immediately
- [x] 5.3.4 Disconnect all nodes from audio graph
- [x] 5.3.5 Implement playback token/ID system to invalidate stale schedules
- [x] 5.3.6 Clear active nodes array on stop

---

## Phase 6: Integration and Testing (MVP)

### End-to-End Integration
> Plan: P6.1 | Requirements: Req 13, Req 10

- [x] 6.1.1 Create `src/ui/app.ts` (or `main.ts`) for UI logic
- [x] 6.1.2 Wire Compile button to call `compileFromSource()` and update output panel
- [x] 6.1.3 Wire Play button to compile (if needed) and call `scheduleEvents()`
- [x] 6.1.4 Wire Stop button to call `stopPlayback()`
- [x] 6.1.5 Display compilation summary and JSON in output panel
- [x] 6.1.6 Display errors in output panel on compile failure
- [x] 6.1.7 Test Play → Stop → Play cycle works correctly

### Unit Tests for MVP
> Plan: P6.2 | Requirements: Req 18

- [x] 6.2.1 Ensure all pitch parsing tests pass
- [x] 6.2.2 Ensure all duration parsing tests pass
- [x] 6.2.3 Ensure tokenizer tests pass
- [x] 6.2.4 Ensure parser tests pass
- [x] 6.2.5 Ensure compiler tests pass
- [x] 6.2.6 Add integration test: full source → compiled events
- [x] 6.2.7 Configure `npm test` script in package.json
- [x] 6.2.8 Run full test suite and fix any failures

### Documentation and Cleanup
> Plan: P6.3 | Requirements: Req 1

- [x] 6.3.1 Update README with complete setup and run instructions
- [x] 6.3.2 Document DSL syntax with examples in README
- [x] 6.3.3 Add code comments in audio engine explaining scheduling
- [x] 6.3.4 Remove any debug/console.log statements
- [x] 6.3.5 Review and organize imports across modules

---

## Phase 7: v0.2 — Extended DSL Features

### Global Settings Extension
> Plan: P7.1 | Requirements: Req 19

- [x] 7.1.1 Add SWING, LOOP, GRID token types to tokenizer
- [x] 7.1.2 Parse `swing <0..0.75>` directive (default 0)
- [x] 7.1.3 Parse `loop <bars>` directive (default 1)
- [x] 7.1.4 Parse `grid <denominator>` directive (default 16)
- [x] 7.1.5 Validate swing range (0 to 0.75), report error if invalid
- [x] 7.1.6 Add global settings to AST and compiled output
- [x] 7.1.7 Write tests for new global settings parsing

### Extended Instrument Definitions
> Plan: P7.2 | Requirements: Req 20

- [x] 7.2.1 Extend instrument token parsing for key=value parameters
- [x] 7.2.2 Parse `gain=<0..1>` parameter
- [x] 7.2.3 Parse `attack=<s>`, `decay=<s>`, `sustain=<0..1>`, `release=<s>` parameters
- [x] 7.2.4 Store full instrument definition with ADSR in AST
- [x] 7.2.5 Apply default values for omitted parameters
- [x] 7.2.6 Update compiler to use instrument ADSR settings
- [x] 7.2.7 Write tests for extended instrument parsing

### Track Support
> Plan: P7.3 | Requirements: Req 21

- [x] 7.3.1 Add TRACK token type to tokenizer
- [x] 7.3.2 Parse `track <trackName> inst=<instName>:` syntax
- [x] 7.3.3 Store track definitions in AST with instrument reference
- [x] 7.3.4 Validate that referenced instrument exists, error if not
- [x] 7.3.5 Include track name in compiled CompiledEvent type
- [x] 7.3.6 Support multiple tracks playing simultaneously
- [x] 7.3.7 Write tests for track parsing and compilation

### Pattern Definition and Use
> Plan: P7.4 | Requirements: Req 22

- [x] 7.4.1 Add PATTERN, USE token types to tokenizer
- [x] 7.4.2 Parse `pattern <patternName>:` followed by sequence
- [x] 7.4.3 Store pattern definitions in AST
- [x] 7.4.4 Parse `use <patternName> [xN]` syntax
- [x] 7.4.5 Expand patterns at compile time
- [x] 7.4.6 Handle `xN` repetition modifier on pattern use
- [x] 7.4.7 Validate that referenced pattern exists, error if not
- [x] 7.4.8 Write tests for pattern expansion

### Chord Support
> Plan: P7.5 | Requirements: Req 23

- [x] 7.5.1 Add CHORD_START, CHORD_END token types (for `[` and `]`)
- [x] 7.5.2 Parse `[C4 E4 G4] <Duration> [vel=<0..1>]` syntax
- [x] 7.5.3 Store chord as list of pitches in AST
- [x] 7.5.4 Expand chords to multiple events with same `t` in compiler
- [x] 7.5.5 Share duration and velocity across all chord notes
- [x] 7.5.6 Write tests for chord expansion

### Repeat Blocks
> Plan: P7.6 | Requirements: Req 24

- [x] 7.6.1 Add REPEAT, BRACE_OPEN, BRACE_CLOSE token types
- [x] 7.6.2 Parse `xN { ... }` repeat block syntax
- [x] 7.6.3 Store repeat block in AST with count and nested sequence
- [x] 7.6.4 Expand repeat blocks at compile time
- [x] 7.6.5 Handle nested repeat blocks correctly
- [x] 7.6.6 Write tests for repeat block expansion

### Per-Note Velocity
> Plan: P7.7 | Requirements: Req 25

- [x] 7.7.1 Extend note token parsing for `vel=<0..1>` parameter
- [x] 7.7.2 Store velocity in note AST node
- [x] 7.7.3 Validate velocity range (0 to 1), error if invalid
- [x] 7.7.4 Apply default velocity (0.8) when not specified
- [x] 7.7.5 Use note velocity in compiled event
- [x] 7.7.6 Write tests for per-note velocity

---

## Phase 8: v0.2 — Swing and Timing

### Swing Timing Transform
> Plan: P8.1 | Requirements: Req 26

- [x] 8.1.1 Create `src/dsl/swing.ts` module
- [x] 8.1.2 Implement `applySwing(events, swing, grid, bpm)` transform function
- [x] 8.1.3 Identify off-beat subdivisions based on grid
- [x] 8.1.4 Delay off-beats by `swing * subdivisionDuration`
- [x] 8.1.5 Clamp event times to prevent negative values
- [x] 8.1.6 Re-sort events by time after transform
- [x] 8.1.7 Integrate swing transform into compile pipeline
- [x] 8.1.8 Write tests for swing timing with known inputs/outputs

---

## Phase 9: v0.2 — Advanced Audio Transport

### Lookahead Scheduler
> Plan: P9.1 | Requirements: Req 27

- [x] 9.1.1 Create `src/audio/scheduler.ts` module
- [x] 9.1.2 Implement lookahead scheduling with `scheduleAheadSec = 0.2`
- [x] 9.1.3 Implement timer interval with `lookaheadMs = 25`
- [x] 9.1.4 Track `nextNoteIndex` for scheduling progress
- [x] 9.1.5 Schedule events falling within lookahead window
- [x] 9.1.6 Continue using Web Audio start(time) for precision
- [x] 9.1.7 Handle scheduler cleanup on stop

### Looping Transport
> Plan: P9.2 | Requirements: Req 28

- [x] 9.2.1 Calculate `loopDurationSec` from loopBars and BPM
- [x] 9.2.2 Track absolute transport time vs loop-relative time
- [x] 9.2.3 Wrap event scheduling at loop boundary
- [x] 9.2.4 Prevent double-scheduling at loop wrap point
- [x] 9.2.5 Implement loop toggle state
- [x] 9.2.6 Stop at end if loop is disabled

### Enhanced Transport Controls
> Plan: P9.3 | Requirements: Req 29

- [x] 9.3.1 Add Restart button to UI
- [x] 9.3.2 Implement restart: stop + reset playhead to 0 + play
- [x] 9.3.3 Add Loop toggle checkbox/button to UI
- [x] 9.3.4 Default Loop toggle to on if loopBars is set in program
- [x] 9.3.5 Display current BPM (read-only) in transport UI
- [x] 9.3.6 Update UI to reflect current transport state (playing/stopped)

### Track Mute and Solo
> Plan: P9.4 | Requirements: Req 30

- [x] 9.4.1 Add mute toggle control per track in UI
- [x] 9.4.2 Add solo toggle control per track in UI
- [x] 9.4.3 Store mute/solo state per track
- [x] 9.4.4 Filter events by track mute/solo state in scheduler
- [x] 9.4.5 Implement solo override logic: solo takes precedence over mute
- [x] 9.4.6 Handle multiple tracks soloed: play all soloed tracks

---

## Phase 10: v0.2 — UI Enhancements

### Playback Visualization
> Plan: P10.1 | Requirements: Req 31

- [x] 10.1.1 Add playhead time display element to UI
- [x] 10.1.2 Update playhead time during playback (requestAnimationFrame or interval)
- [x] 10.1.3 Display loop length in UI
- [x] 10.1.4 Display per-track event counts in track list
- [x] 10.1.5 Add real-time audio waveform visualization using AnalyserNode and canvas
- [x] 10.1.6 Add per-track color visualization (each track has its own color, colors blend based on active tracks)

### Debug Panel
> Plan: P10.2 | Requirements: Req 32

- [x] 10.2.1 Add "Show Debug" toggle button to UI
- [x] 10.2.2 Create collapsible debug panel
- [x] 10.2.3 Display compiled AST (formatted JSON) in debug panel
- [x] 10.2.4 Display all compiled events with track metadata
- [x] 10.2.5 Show chord notes as multiple events at same time

---

## Phase 11: v0.2 — Error Handling and Testing

### Enhanced Error Messages
> Plan: P11.1 | Requirements: Req 33

- [x] 11.1.1 Add specific error for undefined instrument in track
- [x] 11.1.2 Add specific error for undefined pattern in `use`
- [x] 11.1.3 Add validation error for swing value out of range (0-0.75)
- [x] 11.1.4 Add validation error for invalid grid value
- [x] 11.1.5 Include helpful explanation in error messages

### v0.2 Test Suite
> Plan: P11.2 | Requirements: Req 34

- [x] 11.2.1 Write tests for pattern expansion (single use, xN repetition)
- [x] 11.2.2 Write tests for repeat block expansion (simple and nested)
- [x] 11.2.3 Write tests for swing timing transform (verify time shifts)
- [x] 11.2.4 Write tests for chord expansion (verify multiple events same time)
- [x] 11.2.5 Run full test suite and ensure all tests pass

### Backward Compatibility Verification
> Plan: P11.3 | Requirements: Req 35

- [x] 11.3.1 Test that MVP example program compiles correctly in v0.2
- [x] 11.3.2 Test that v0.1 DSL syntax is still fully supported
- [x] 11.3.3 Verify Play/Stop/Compile buttons work as in MVP
- [x] 11.3.4 Run all MVP tests and ensure no regressions
- [x] 11.3.5 Test edge cases from MVP still work

---

## Phase 12: Final Polish

### Documentation Update
> Plan: P12.1 | Requirements: Req 1

- [x] 12.1.1 Update README with v0.2 features overview
- [x] 12.1.2 Document new DSL syntax: tracks, patterns, chords, repeats
- [x] 12.1.3 Document global settings: swing, loop, grid
- [x] 12.1.4 Document extended instrument parameters
- [x] 12.1.5 Add v0.2 example programs to README
- [x] 12.1.6 Document transport controls and mute/solo

### Code Quality and Cleanup
> Plan: P12.2 | Requirements: Req 17

- [x] 12.2.1 Review all modules for code clarity
- [x] 12.2.2 Ensure consistent code style across project
- [x] 12.2.3 Add/update code comments where needed
- [x] 12.2.4 Remove any remaining debug statements
- [x] 12.2.5 Run final test pass
- [x] 12.2.6 Verify application runs without errors in Chrome, Firefox, Safari
