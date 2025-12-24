# Implementation Plan

This document outlines the detailed implementation plan for the Web DSL Music Sequencer. Each plan item is linked to the corresponding requirements in `docs/requirements.md` and assigned a priority level.

---

## Phase 1: Project Foundation

### P1.1 — Project Setup and Scaffolding
**Priority:** High  
**Related Requirements:** [Req 1], [Req 17]

- Initialize Vite + TypeScript project
- Configure TypeScript with strict settings
- Set up project directory structure:
  - `src/dsl/` — DSL tokenizer, parser, compiler
  - `src/audio/` — Web Audio engine
  - `src/ui/` — UI components
- Add Vitest for testing
- Create basic `README.md` with setup instructions

### P1.2 — Basic UI Layout
**Priority:** High  
**Related Requirements:** [Req 2], [Req 3]

- Create main HTML structure with split layout
- Implement textarea for DSL editor (left panel)
- Implement output panel for results/errors (right or bottom panel)
- Add control buttons: Play, Stop, Compile
- Prefill editor with example DSL program
- Apply basic CSS styling for usability

---

## Phase 2: DSL Core — Parsing

### P2.1 — Pitch Parsing Module
**Priority:** High  
**Related Requirements:** [Req 6], [Req 8]

- Implement pitch string parser (e.g., `C4`, `D#3`, `Bb2`)
- Support sharps (#) and flats (b) accidentals
- Convert pitch to MIDI note number (A4 = 69)
- Convert MIDI to frequency (A4 = 440 Hz)
- Handle edge cases (invalid pitch names, out-of-range octaves)
- Write unit tests for pitch parsing

### P2.2 — Duration Parsing Module
**Priority:** High  
**Related Requirements:** [Req 7]

- Implement fraction duration parser (e.g., `1/4`, `1/8`, `3/16`)
- Convert duration fractions to seconds based on BPM
- Handle edge cases (invalid fractions, division by zero)
- Write unit tests for duration parsing

### P2.3 — Tokenizer Implementation
**Priority:** High  
**Related Requirements:** [Req 6]

- Implement lexer/tokenizer for DSL input
- Identify token types: BPM, INST, SEQ, NOTE, REST, COMMA, etc.
- Track line and column numbers for error reporting
- Handle whitespace and newlines flexibly
- Write unit tests for tokenizer

### P2.4 — Parser Implementation
**Priority:** High  
**Related Requirements:** [Req 4], [Req 5], [Req 6]

- Parse `bpm <number>` directive (default 120 if missing)
- Parse `inst <name> <waveform>` directive (default "lead sine")
- Parse `seq:` block with comma-separated note/rest tokens
- Build intermediate representation (AST or structured data)
- Generate parse errors with line/column information
- Write unit tests for parser

---

## Phase 3: DSL Core — Compilation

### P3.1 — Compiler Implementation
**Priority:** High  
**Related Requirements:** [Req 9]

- Transform parsed AST into SynthEvent list
- Calculate event start times (`t`) in seconds based on BPM
- Calculate event durations (`dur`) in seconds
- Include MIDI, frequency, velocity, and instrument info
- Handle rests (advance time without sound)
- Sort events by start time

### P3.2 — Compile Output and Summary
**Priority:** Medium  
**Related Requirements:** [Req 9], [Req 10]

- Generate compilation summary (BPM, total duration, event count)
- Format event list as JSON for display
- Implement compile button handler
- Update output panel on successful/failed compilation

---

## Phase 4: Error Handling

### P4.1 — Error Reporting System
**Priority:** High  
**Related Requirements:** [Req 11], [Req 16]

- Create error class/structure with message, line, column
- Display errors in output panel with formatting
- Implement simple line highlighting in editor for errors
- Clear errors on successful recompilation
- Wrap parsing/compilation in try-catch for graceful failure

---

## Phase 5: Audio Engine

### P5.1 — Audio Context Management
**Priority:** High  
**Related Requirements:** [Req 12]

- Create AudioContext on first user gesture (Play click)
- Implement singleton pattern for AudioContext reuse
- Handle browser autoplay policy requirements

### P5.2 — Audio Scheduling Engine
**Priority:** High  
**Related Requirements:** [Req 13], [Req 14]

- Implement event scheduling using Web Audio API
- Calculate `startTime = ctx.currentTime + 0.1` buffer
- Schedule oscillator start/stop at precise times
- Create signal chain: OscillatorNode → GainNode → destination
- Implement ADSR envelope via GainNode automation
  - Attack: ~0.005s ramp up
  - Decay: ~0.05s ramp to sustain
  - Sustain: ~0.7 level
  - Release: ~0.08s ramp to zero

### P5.3 — Stop and Cleanup
**Priority:** High  
**Related Requirements:** [Req 15]

- Track all created audio nodes
- Implement Stop to immediately silence all nodes
- Cancel scheduled future events
- Use playback token/id to ignore stale scheduled callbacks
- Disconnect and clean up nodes properly

---

## Phase 6: Integration and Testing (MVP)

### P6.1 — End-to-End Integration
**Priority:** High  
**Related Requirements:** [Req 13], [Req 10]

- Connect UI buttons to compile and playback functions
- Auto-compile on Play if needed
- Display compiled events in output panel
- Handle Play → Stop → Play cycle correctly

### P6.2 — Unit Tests for MVP
**Priority:** Medium  
**Related Requirements:** [Req 18]

- Ensure pitch parsing tests pass
- Ensure duration parsing tests pass
- Add integration tests for compile pipeline
- Configure `npm test` script

### P6.3 — Documentation and Cleanup
**Priority:** Medium  
**Related Requirements:** [Req 1]

- Update README with complete instructions
- Add code comments explaining scheduling decisions
- Clean up and organize code

---

## Phase 7: v0.2 — Extended DSL Features

### P7.1 — Global Settings Extension
**Priority:** High  
**Related Requirements:** [Req 19]

- Add `swing <0..0.75>` parsing (default 0)
- Add `loop <bars>` parsing (default 1)
- Add `grid <denominator>` parsing (default 16)
- Validate setting values and report errors

### P7.2 — Extended Instrument Definitions
**Priority:** High  
**Related Requirements:** [Req 20]

- Extend `inst` parsing for optional parameters:
  - `gain=<0..1>`
  - `attack=<s>`, `decay=<s>`, `sustain=<0..1>`, `release=<s>`
- Store instrument definitions with full ADSR config
- Apply defaults for omitted parameters

### P7.3 — Track Support
**Priority:** High  
**Related Requirements:** [Req 21]

- Parse `track <trackName> inst=<instName>:` syntax
- Validate instrument references (error if undefined)
- Support multiple concurrent tracks
- Include track name in compiled events

### P7.4 — Pattern Definition and Use
**Priority:** High  
**Related Requirements:** [Req 22]

- Parse `pattern <patternName>:` definitions
- Parse `use <patternName> [xN]` references
- Expand patterns at compile time
- Handle undefined pattern references with errors
- Write tests for pattern expansion

### P7.5 — Chord Support
**Priority:** Medium  
**Related Requirements:** [Req 23]

- Parse `[C4 E4 G4] <Duration> [vel=<0..1>]` syntax
- Expand chords into multiple note events at same time
- Share duration and velocity across chord notes
- Write tests for chord expansion

### P7.6 — Repeat Blocks
**Priority:** Medium  
**Related Requirements:** [Req 24]

- Parse `xN { ... }` repeat block syntax
- Expand repeat blocks at compile time
- Handle nested repeat blocks
- Write tests for repeat expansion

### P7.7 — Per-Note Velocity
**Priority:** Medium  
**Related Requirements:** [Req 25]

- Parse `vel=<0..1>` on individual notes
- Validate velocity range (0..1)
- Apply default velocity when not specified
- Report error for invalid velocity values

---

## Phase 8: v0.2 — Swing and Timing

### P8.1 — Swing Timing Transform
**Priority:** Medium  
**Related Requirements:** [Req 26]

- Implement swing as compile-time timing transform
- Delay off-beat subdivisions by `swing * subdivisionDuration`
- Clamp times to prevent negative values
- Keep events sorted after transform
- Write tests for swing timing

---

## Phase 9: v0.2 — Advanced Audio Transport

### P9.1 — Lookahead Scheduler
**Priority:** High  
**Related Requirements:** [Req 27]

- Replace one-shot scheduling with lookahead scheduler
- Maintain `nextNoteIndex` for scheduling progress
- Use setInterval (~25ms) to check scheduling window
- Schedule events within lookahead window (~0.2s)
- Use Web Audio timing for precision

### P9.2 — Looping Transport
**Priority:** High  
**Related Requirements:** [Req 28]

- Calculate loop duration in seconds from bars and BPM
- Wrap event times modulo loop duration
- Prevent double-scheduling at loop boundary
- Support loop toggle (on/off)

### P9.3 — Enhanced Transport Controls
**Priority:** Medium  
**Related Requirements:** [Req 29]

- Add Restart button (reset playhead to 0)
- Add Loop toggle control
- Display BPM (read-only from compiled program)
- Update UI to show current transport state

### P9.4 — Track Mute and Solo
**Priority:** Medium  
**Related Requirements:** [Req 30]

- Add mute toggle per track in UI
- Add solo toggle per track in UI
- Filter events by mute/solo state during scheduling
- Solo overrides mute; multiple solos play all soloed tracks

---

## Phase 10: v0.2 — UI Enhancements

### P10.1 — Playback Visualization
**Priority:** Medium  
**Related Requirements:** [Req 31]

- Display current playhead time during playback
- Display loop length
- Display per-track event counts

### P10.2 — Debug Panel
**Priority:** Low  
**Related Requirements:** [Req 32]

- Add toggle for compiled AST/events debug view
- Show events with track metadata
- Display expanded chords as multiple events

---

## Phase 11: v0.2 — Error Handling and Testing

### P11.1 — Enhanced Error Messages
**Priority:** Medium  
**Related Requirements:** [Req 33]

- Add specific errors for undefined instrument references
- Add specific errors for undefined pattern references
- Add validation errors for swing/grid values with explanations

### P11.2 — v0.2 Test Suite
**Priority:** Medium  
**Related Requirements:** [Req 34]

- Tests for pattern expansion
- Tests for repeat block expansion
- Tests for swing timing transform
- Tests for chord expansion

### P11.3 — Backward Compatibility Verification
**Priority:** High  
**Related Requirements:** [Req 35]

- Ensure v0.1 DSL programs compile correctly in v0.2
- Verify Play/Stop/Compile function as in MVP
- Run MVP test suite to confirm no regressions

---

## Phase 12: Final Polish

### P12.1 — Documentation Update
**Priority:** Medium  
**Related Requirements:** [Req 1]

- Update README with v0.2 DSL features and examples
- Document all new syntax and features
- Include example programs for v0.2 features

### P12.2 — Code Quality and Cleanup
**Priority:** Low  
**Related Requirements:** [Req 17]

- Review and refactor code for clarity
- Ensure consistent code style
- Add/update code comments where needed
- Final testing pass
