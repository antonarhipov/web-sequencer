# SWE Agent Prompts — Web DSL Music Sequencer

Use these prompts as inputs to your SWE AI agent in the IDE. Prompt 1 is the MVP. Prompt 2 is an incremental v0.2 expansion to implement after Prompt 1 is complete and stable.

---

## Prompt 1 — MVP: Web DSL Music Sequencer (v0.1)

Implement an MVP of a browser-based app where users type a small DSL that compiles into scheduled Web Audio playback.

### Goal
A single-page web app that:
1) provides a code editor (textarea is fine for MVP) for a music DSL  
2) parses + compiles the DSL into a normalized event list  
3) schedules events with the Web Audio API with accurate timing  
4) shows parse/compile errors clearly (line/column + message)

### Tech / Setup
- Use **Vite + TypeScript**.
- No backend.
- Keep dependencies minimal. (Optional: CodeMirror later; for MVP a `<textarea>` is fine.)
- Must run in modern Chrome/Firefox/Safari.

---

### Functional Requirements

#### UI
- Page layout:
  - Left: DSL editor area (textarea), prefilled with an example program.
  - Right or bottom: output panel for errors + compiled event preview (JSON).
  - Controls: **Play**, **Stop**, and **Compile** (Compile can run automatically on Play too).
- Display:
  - On successful compile: show a summary (BPM, total duration, number of events) + raw event list JSON.
  - On error: show a readable error message with line/column and highlight the approximate line (simple is OK).

#### DSL (v0.1)
Support a tiny DSL with:
- `bpm <number>` (required; default 120 if missing)
- `inst <name> <waveform>` (optional; default `lead sine`)
- `seq:` followed by a comma-separated list of tokens on one or multiple lines:
  - Note token: `<PitchOctave> <Duration>`
    - Example pitches: `C4`, `D#3`, `Bb2`
  - Rest token: `r <Duration>`
  - Duration syntax: fractions like `1/4`, `1/8`, `3/16` (no dotted notes yet)
- Whitespace/newlines flexible.
- Example program:
  ```
  bpm 120
  inst lead saw
  seq:
    C4 1/8, D4 1/8, E4 1/4, r 1/8, G4 1/8
  ```

#### Compiler Output
Compile into a list of events in seconds (based on BPM):
```ts
type SynthEvent = {
  t: number;        // start time in seconds from beginning
  dur: number;      // duration in seconds
  kind: "note" | "rest";
  midi?: number;    // for notes only
  freq?: number;    // for notes only
  vel: number;      // 0..1
  inst: { name: string; waveform: OscillatorType };
};
```
- Rests may be represented as events or skipped, but total time must advance properly.
- Convert pitch to MIDI and frequency (A4=440).
- Use a constant velocity for MVP (e.g., 0.8).

#### Audio Engine
- Create one `AudioContext` on first user gesture (Play).
- Scheduling:
  - Determine `startTime = ctx.currentTime + 0.1`.
  - For each note event schedule oscillator start/stop precisely at `startTime + event.t`.
- Instrument:
  - Simple synth using `OscillatorNode -> GainNode -> destination`.
  - Apply a basic ADSR envelope via Gain automation:
    - Attack ~0.005s, decay ~0.05s, sustain ~0.7, release ~0.08s (tweakable constants).
- Stop:
  - Stops playback immediately and prevents already scheduled future sounds from playing.
  - Implementation hint: track created nodes and call `stop()` + disconnect; also maintain a “playback token/id” so old scheduled callbacks are ignored.

#### Error Handling
- Parse errors should include:
  - error message
  - line and column (best effort)
  - indicate which token/line failed
- Fail gracefully: no uncaught exceptions during Play.

---

### Non-Functional Requirements
- Code should be clean, modular, and testable:
  - `dsl/tokenize.ts` (optional)
  - `dsl/parser.ts`
  - `dsl/compiler.ts`
  - `audio/engine.ts`
  - `ui/app.tsx` or `main.ts` (depending on framework choice)
- Keep parsing logic independent of UI and audio engine.
- Provide basic unit tests for pitch parsing + duration parsing (Vitest is OK).

---

### Deliverables
1) Working Vite project with instructions in README:
   - `npm install`
   - `npm run dev`
2) A running page that can:
   - compile the sample DSL
   - play it with audible notes
   - stop reliably
   - show error messages for malformed DSL
3) Minimal but understandable code comments explaining scheduling decisions.

---

### Suggested Implementation Plan (follow this order)
1) Scaffold Vite + TS app + simple UI.
2) Implement pitch parsing (`C#4`, `Bb3`) → MIDI → frequency.
3) Implement duration parsing (`1/8`) → seconds via BPM.
4) Implement a simple DSL parser (line-based + token splitting is OK).
5) Compile to an event list.
6) Implement Web Audio playback scheduling and Stop.
7) Add error reporting (line/column best effort) + tests.

---

## Prompt 2 — v0.2: Tracks, Patterns, Loops, Swing, and Better Transport

Extend the MVP into a more useful live-coding sequencer while keeping the architecture clean: **parse → compile → schedule**.

### Goal
Add:
- multiple tracks with independent instruments
- named patterns and pattern reuse
- looping playback with transport controls
- swing (shuffle) timing
- per-note velocity and simple accents
- improved scheduler (lookahead) for long-running playback
- better UX: mute/solo and track-level visibility of compiled events

### Tech / Setup
- Continue with **Vite + TypeScript**.
- Keep the core modules separated:
  - `dsl/*` purely text → AST → events
  - `audio/*` purely events → sound
  - `ui/*` purely user interaction + display
- If you add an editor, prefer **CodeMirror 6** (optional; only if easy).

---

## DSL (v0.2)

### Core Concepts
- **Global settings**
  - `bpm <number>` (as before)
  - `swing <0..0.75>` (optional; default 0; applied to pairs of 1/8 notes at the chosen grid)
  - `loop <bars>` (optional; default 1; used by transport for looping)
  - `grid <denominator>` (optional; default 16; represents a bar split into 16 steps for swing + alignment)
- **Instrument definitions**
  - `inst <name> <waveform> [gain=<0..1>] [attack=<s>] [decay=<s>] [sustain=<0..1>] [release=<s>]`
- **Tracks**
  - `track <trackName> inst=<instName>:` then an inline sequence, or a pattern reference.
- **Patterns**
  - `pattern <patternName>:` followed by a sequence
  - pattern usage: `use <patternName> [xN]` inside a track
- **Sequence items**
  - Note: `<PitchOctave> <Duration> [vel=<0..1>]`
  - Rest: `r <Duration>`
  - Chord: `[C4 E4 G4] <Duration> [vel=<0..1>]` (play notes simultaneously)
  - Repeat block: `xN { ... }` where `{ ... }` is a comma-separated sequence

### Duration
- Continue supporting fractions `1/16`, `1/8`, `1/4`, etc.
- Add `1` as a whole note and `1/2` etc.
- (Optional) Support `bars:beats:steps` only if it is simple; otherwise skip.

### Example Program
```
bpm 128
grid 16
swing 0.15
loop 2

inst lead saw gain=0.3 attack=0.005 decay=0.05 sustain=0.7 release=0.08
inst bass square gain=0.25
inst hat triangle gain=0.15 attack=0.001 decay=0.02 sustain=0.2 release=0.02

pattern hats:
  x16 { C6 1/16 vel=0.4, r 1/16 }

pattern riff:
  C4 1/8 vel=0.9, D#4 1/8 vel=0.8, G4 1/4 vel=0.85, r 1/8, [C4 G4] 1/8 vel=0.8

track drums inst=hat:
  use hats x2

track bassline inst=bass:
  x4 { C2 1/8 vel=0.8, r 1/8, C2 1/8 vel=0.7, r 1/8 }

track melody inst=lead:
  use riff x2
```

---

## Compiler Output (v0.2)
Continue compiling into a normalized list of events, but now include track metadata and chords expand to multiple note events sharing the same `t`.

```ts
type CompiledEvent = {
  t: number;                // seconds from transport start (within loop)
  dur: number;              // seconds
  kind: "note" | "rest";
  track: string;
  midi?: number;
  freq?: number;
  vel: number;              // 0..1
  inst: {
    name: string;
    waveform: OscillatorType;
    gain: number;
    adsr: { attack: number; decay: number; sustain: number; release: number };
  };
};
type CompiledProgram = {
  bpm: number;
  grid: number;             // e.g., 16 steps per bar
  swing: number;            // 0..0.75
  loopBars: number;         // integer
  loopDurationSec: number;  // computed
  events: CompiledEvent[];  // events with t in [0, loopDurationSec)
};
```
Rules:
- Expand chords into multiple `kind:"note"` events with the same `t/dur/track`.
- Apply repeats and pattern expansion during compile (not during playback).
- Apply swing as a *timing transform* at compile time:
  - For the chosen `grid`, delay every second subdivision in pairs (e.g., “off” 1/8s) by `swing * (subdivisionDuration)` and pull the preceding one earlier or keep the downbeat fixed (choose a consistent rule and document it).
  - Ensure events never go negative; clamp at 0 if needed.
- Sort events by `t` ascending, stable within same time (e.g., by track then midi).

---

## Audio / Transport (v0.2)

### Transport Features
- Controls:
  - Play / Stop
  - Loop toggle (on by default if loopBars is set)
  - Restart (reset playhead to 0)
  - BPM display (read-only from program)
- Track controls:
  - Mute per track
  - Solo per track (solo overrides mutes)
- Visual:
  - Show playhead time within loop and loop length
  - Show per-track count of scheduled note events (and optionally last compile time)

### Scheduler Upgrade
Implement a lookahead scheduler for reliability:
- Maintain `nextNoteIndex` and schedule events that fall within `[ctx.currentTime, ctx.currentTime + scheduleAheadSec]`
- Use a timer (e.g., `setInterval` every `lookaheadMs`) only to enqueue scheduling work; actual audio timing uses `start(time)` and parameter automation.
Recommended constants:
- `lookaheadMs = 25`
- `scheduleAheadSec = 0.2`
- When looping, wrap `t` modulo `loopDurationSec`, but avoid double-scheduling (use absolute transport time internally).

### Stop / Cleanup
- Stop must immediately silence sound and cancel future scheduled events:
  - Keep a list of active nodes and disconnect them.
  - Use a monotonically increasing `playbackId` token to ignore stale schedules.

### Instruments
- Keep oscillator synth, but now honor instrument parameters:
  - `waveform`, `gain`, `adsr`
- (Optional) Add a simple filter node per instrument (lowpass) if easy, but not required.

---

## Error Handling & Diagnostics (v0.2)
- Improve error messages:
  - Unknown instrument referenced by track → compile error.
  - Unknown pattern referenced by `use` → compile error.
  - Invalid swing/grid values → compile error with explanation.
- Provide a “Compiled AST/events” toggle panel for debugging.
- Add tests:
  - pattern expansion
  - repeat block expansion
  - swing timing transform on a small known sequence
  - chord expansion

---

## Deliverables (v0.2)
1) Updated README describing the DSL v0.2 features and examples.
2) Working UI with multi-track playback + looping + swing.
3) A minimal test suite that covers the new compiler behavior.
4) No regressions to MVP features (Play/Stop/Compile must remain stable).

---

## Implementation Notes / Suggested Steps
1) Add an AST layer (if MVP went straight to events), so patterns/tracks are easier to represent.
2) Implement `pattern` + `use` expansion at compile time.
3) Add `track` blocks and instrument lookup.
4) Add chord parsing and expansion.
5) Add swing transform + tests.
6) Replace one-shot scheduling with lookahead scheduler + looping transport.
7) Add mute/solo behavior in the scheduler (filter events by track state).
