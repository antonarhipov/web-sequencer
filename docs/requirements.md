# Requirements Document

## Introduction

The **Web DSL Music Sequencer** is a browser-based application that enables users to compose and play music using a custom Domain-Specific Language (DSL). Users type musical instructions in a code editor, which are then parsed, compiled into timed audio events, and played back using the Web Audio API.

The application is designed in two phases:
- **MVP (v0.1)**: Core functionality with basic DSL, single instrument, and simple playback
- **v0.2**: Extended features including multiple tracks, patterns, loops, swing timing, and improved transport controls

---

## Requirements

### 1. Project Setup and Configuration

**User Story:**
> As a developer, I want a properly configured Vite + TypeScript project so that I can develop and build the application efficiently.

**Acceptance Criteria:**
> WHEN the project is cloned and `npm install` is run THEN all dependencies SHALL be installed without errors.
> WHEN `npm run dev` is executed THEN the development server SHALL start and the application SHALL be accessible in a browser.
> WHEN the application is loaded in Chrome, Firefox, or Safari THEN it SHALL render and function correctly without browser-specific errors.

---

### 2. User Interface Layout

**User Story:**
> As a user, I want a clear and intuitive interface so that I can easily write DSL code and see the results.

**Acceptance Criteria:**
> WHEN the application loads THEN the page SHALL display a DSL editor area (textarea) on the left side.
> WHEN the application loads THEN the page SHALL display an output panel on the right or bottom for errors and compiled event preview.
> WHEN the application loads THEN the editor SHALL be prefilled with an example DSL program.
> WHEN the application loads THEN control buttons for Play, Stop, and Compile SHALL be visible and accessible.

---

### 3. DSL Editor Functionality

**User Story:**
> As a user, I want to type and edit DSL code in the editor so that I can compose music.

**Acceptance Criteria:**
> WHEN I type in the editor THEN the text SHALL update in real-time.
> WHEN I paste DSL code THEN it SHALL be accepted and displayed correctly.
> WHEN the editor contains code and I modify it THEN the changes SHALL be preserved until I navigate away or refresh.

---

### 4. BPM Configuration

**User Story:**
> As a user, I want to specify the tempo (BPM) of my composition so that notes play at the correct speed.

**Acceptance Criteria:**
> WHEN I specify `bpm <number>` in the DSL THEN the compiler SHALL use that value for timing calculations.
> WHEN no BPM is specified THEN the compiler SHALL default to 120 BPM.
> WHEN an invalid BPM value is provided (e.g., negative, non-numeric) THEN the compiler SHALL display a clear error message.

---

### 5. Instrument Definition

**User Story:**
> As a user, I want to define instruments with different waveforms so that I can create varied sounds.

**Acceptance Criteria:**
> WHEN I specify `inst <name> <waveform>` THEN the instrument SHALL be registered with the given name and waveform type.
> WHEN no instrument is defined THEN the compiler SHALL default to an instrument named "lead" with "sine" waveform.
> WHEN an invalid waveform type is provided THEN the compiler SHALL display a clear error message.
> WHEN waveform is "sine", "square", "sawtooth", or "triangle" THEN it SHALL be accepted as valid.

---

### 6. Sequence Definition and Note Parsing

**User Story:**
> As a user, I want to write sequences of notes and rests so that I can compose melodies.

**Acceptance Criteria:**
> WHEN I write `seq:` followed by note tokens THEN the parser SHALL recognize it as a sequence block.
> WHEN I write a note token like `C4 1/8` THEN the parser SHALL extract the pitch (C), octave (4), and duration (1/8).
> WHEN I write notes with accidentals like `D#3` or `Bb2` THEN the parser SHALL correctly interpret sharps (#) and flats (b).
> WHEN I write a rest token like `r 1/8` THEN the parser SHALL recognize it as a rest with the specified duration.
> WHEN tokens are separated by commas THEN the parser SHALL correctly split and parse each token.
> WHEN tokens span multiple lines THEN the parser SHALL handle whitespace and newlines flexibly.

---

### 7. Duration Parsing

**User Story:**
> As a user, I want to specify note durations as fractions so that I can control rhythmic timing precisely.

**Acceptance Criteria:**
> WHEN I specify a duration like `1/4` THEN the compiler SHALL interpret it as a quarter note relative to BPM.
> WHEN I specify a duration like `1/8` THEN the compiler SHALL interpret it as an eighth note.
> WHEN I specify a duration like `3/16` THEN the compiler SHALL interpret it as three sixteenth notes.
> WHEN an invalid duration format is provided THEN the compiler SHALL display a clear error message with line/column information.

---

### 8. Pitch to MIDI and Frequency Conversion

**User Story:**
> As a user, I want pitches to be converted to correct frequencies so that notes sound at the right pitch.

**Acceptance Criteria:**
> WHEN a pitch like `A4` is compiled THEN it SHALL be converted to MIDI note 69 and frequency 440 Hz.
> WHEN a pitch like `C4` is compiled THEN it SHALL be converted to the correct MIDI note (60) and frequency (~261.63 Hz).
> WHEN sharps or flats are used THEN the MIDI and frequency values SHALL be adjusted correctly (±1 semitone).

---

### 9. Compilation to Event List

**User Story:**
> As a user, I want my DSL code to compile into a list of timed events so that the audio engine can play them.

**Acceptance Criteria:**
> WHEN compilation succeeds THEN the output SHALL be a list of SynthEvent objects with `t`, `dur`, `kind`, `midi`, `freq`, `vel`, and `inst` properties.
> WHEN compilation succeeds THEN the output panel SHALL display a summary showing BPM, total duration, and number of events.
> WHEN compilation succeeds THEN the raw event list JSON SHALL be visible in the output panel.
> WHEN events are compiled THEN times (`t`) SHALL be calculated in seconds based on BPM and durations.

---

### 10. Compile Button Functionality

**User Story:**
> As a user, I want to compile my DSL code on demand so that I can check for errors and preview the output.

**Acceptance Criteria:**
> WHEN I click the Compile button THEN the current DSL code SHALL be parsed and compiled.
> WHEN compilation succeeds THEN the output panel SHALL update with the compiled results.
> WHEN compilation fails THEN the output panel SHALL display the error message.

---

### 11. Error Handling and Display

**User Story:**
> As a user, I want clear error messages when my DSL code has problems so that I can fix them.

**Acceptance Criteria:**
> WHEN a parse error occurs THEN the error message SHALL include the line number and column number.
> WHEN a parse error occurs THEN the error message SHALL describe what token or syntax failed.
> WHEN an error occurs THEN the approximate line in the editor SHALL be highlighted (simple highlighting is acceptable).
> WHEN the user fixes the error and recompiles THEN the error message SHALL be cleared if successful.

---

### 12. Audio Context Initialization

**User Story:**
> As a user, I want audio to start on my first interaction so that playback works correctly in all browsers.

**Acceptance Criteria:**
> WHEN the user clicks Play for the first time THEN an AudioContext SHALL be created.
> WHEN the AudioContext is created THEN it SHALL be reused for subsequent playback sessions.
> WHEN the browser requires a user gesture for audio THEN the application SHALL handle this gracefully.

---

### 13. Play Button and Audio Scheduling

**User Story:**
> As a user, I want to play my composition so that I can hear the music I've created.

**Acceptance Criteria:**
> WHEN I click Play THEN the DSL SHALL be compiled (if not already) and playback SHALL start.
> WHEN playback starts THEN audio events SHALL be scheduled with precise timing using Web Audio API.
> WHEN playback starts THEN a small buffer (e.g., 0.1s) SHALL be added before the first note to ensure accuracy.
> WHEN notes play THEN they SHALL use the specified instrument waveform and sound at the correct pitch and duration.

---

### 14. ADSR Envelope

**User Story:**
> As a user, I want notes to have a natural attack and release so that they don't sound harsh or abrupt.

**Acceptance Criteria:**
> WHEN a note plays THEN it SHALL have an attack phase (~0.005s) where volume ramps up.
> WHEN a note plays THEN it SHALL have a decay phase (~0.05s) where volume decreases to sustain level.
> WHEN a note plays THEN it SHALL have a sustain level (~0.7) during the main duration.
> WHEN a note ends THEN it SHALL have a release phase (~0.08s) where volume fades to zero.

---

### 15. Stop Button Functionality

**User Story:**
> As a user, I want to stop playback immediately so that I can silence the music when needed.

**Acceptance Criteria:**
> WHEN I click Stop THEN all currently playing sounds SHALL stop immediately.
> WHEN I click Stop THEN all scheduled future sounds SHALL be cancelled.
> WHEN Stop is clicked during playback THEN no scheduled events SHALL play after the stop command.
> WHEN playback is stopped THEN clicking Play again SHALL restart from the beginning.

---

### 16. Graceful Error Recovery

**User Story:**
> As a user, I want the application to handle errors gracefully so that it doesn't crash or become unresponsive.

**Acceptance Criteria:**
> WHEN an error occurs during parsing THEN the application SHALL NOT throw uncaught exceptions.
> WHEN an error occurs during playback THEN the application SHALL NOT crash.
> WHEN an error occurs THEN the user SHALL be able to correct the issue and try again.

---

### 17. Code Modularity (Non-Functional)

**User Story:**
> As a developer, I want the code to be modular and well-organized so that it is easy to maintain and test.

**Acceptance Criteria:**
> WHEN the codebase is organized THEN there SHALL be separate modules for tokenization, parsing, compilation, and audio engine.
> WHEN modules are implemented THEN parsing logic SHALL be independent of UI and audio engine.
> WHEN modules are implemented THEN they SHALL be testable in isolation.

---

### 18. Unit Tests for Core Parsing

**User Story:**
> As a developer, I want unit tests for core functionality so that I can ensure the parser works correctly.

**Acceptance Criteria:**
> WHEN pitch parsing is tested THEN tests SHALL verify correct MIDI and frequency conversion for various pitches.
> WHEN duration parsing is tested THEN tests SHALL verify correct conversion to seconds based on BPM.
> WHEN tests are run with `npm test` THEN all tests SHALL pass.

---

## v0.2 Requirements

### 19. Global Settings Extension

**User Story:**
> As a user, I want additional global settings so that I can control swing, looping, and grid resolution.

**Acceptance Criteria:**
> WHEN I specify `swing <0..0.75>` THEN the compiler SHALL apply swing timing to the sequence.
> WHEN no swing is specified THEN swing SHALL default to 0 (no swing).
> WHEN I specify `loop <bars>` THEN the transport SHALL loop playback for the specified number of bars.
> WHEN no loop is specified THEN loop SHALL default to 1 bar.
> WHEN I specify `grid <denominator>` THEN the compiler SHALL use that value for step resolution (default 16).

---

### 20. Extended Instrument Definitions

**User Story:**
> As a user, I want to customize instrument parameters so that I can shape the sound of each instrument.

**Acceptance Criteria:**
> WHEN I specify `inst <name> <waveform> [gain=<0..1>] [attack=<s>] [decay=<s>] [sustain=<0..1>] [release=<s>]` THEN the compiler SHALL use those values.
> WHEN optional parameters are omitted THEN default values SHALL be used.
> WHEN multiple instruments are defined THEN each SHALL have independent settings.

---

### 21. Track Support

**User Story:**
> As a user, I want to define multiple tracks so that I can layer different instruments and patterns.

**Acceptance Criteria:**
> WHEN I define `track <trackName> inst=<instName>:` THEN a new track SHALL be created with the specified instrument.
> WHEN a track references an undefined instrument THEN the compiler SHALL display a clear error message.
> WHEN multiple tracks are defined THEN they SHALL play simultaneously.

---

### 22. Pattern Definition and Reuse

**User Story:**
> As a user, I want to define reusable patterns so that I can avoid repetition in my compositions.

**Acceptance Criteria:**
> WHEN I define `pattern <patternName>:` followed by a sequence THEN it SHALL be stored for later reference.
> WHEN I use `use <patternName>` in a track THEN the pattern's sequence SHALL be inserted at that point.
> WHEN I use `use <patternName> xN` THEN the pattern SHALL be repeated N times.
> WHEN an undefined pattern is referenced THEN the compiler SHALL display a clear error message.

---

### 23. Chord Support

**User Story:**
> As a user, I want to play multiple notes simultaneously so that I can create chords.

**Acceptance Criteria:**
> WHEN I write `[C4 E4 G4] <Duration>` THEN all notes in the bracket SHALL play at the same time.
> WHEN a chord is compiled THEN each note SHALL become a separate event with the same start time.
> WHEN velocity is specified for a chord THEN all notes SHALL share that velocity.

---

### 24. Repeat Blocks

**User Story:**
> As a user, I want to repeat sections of a sequence so that I can create loops efficiently.

**Acceptance Criteria:**
> WHEN I write `xN { ... }` THEN the sequence inside SHALL be repeated N times.
> WHEN repeat blocks are nested THEN they SHALL expand correctly.
> WHEN a repeat block is compiled THEN the events SHALL be expanded at compile time.

---

### 25. Per-Note Velocity

**User Story:**
> As a user, I want to control the volume of individual notes so that I can add dynamics to my music.

**Acceptance Criteria:**
> WHEN I specify `<Note> <Duration> vel=<0..1>` THEN that note SHALL use the specified velocity.
> WHEN no velocity is specified THEN a default velocity (e.g., 0.8) SHALL be used.
> WHEN velocity is outside the 0..1 range THEN the compiler SHALL display a clear error message.

---

### 26. Swing Timing Transform

**User Story:**
> As a user, I want swing/shuffle timing so that my music has a more natural groove.

**Acceptance Criteria:**
> WHEN swing is greater than 0 THEN every second subdivision (off-beat) SHALL be delayed by `swing * subdivisionDuration`.
> WHEN swing is applied THEN event times SHALL never become negative.
> WHEN swing transform is applied THEN events SHALL remain sorted by time.

---

### 27. Lookahead Scheduler

**User Story:**
> As a user, I want reliable playback for long compositions so that timing remains accurate.

**Acceptance Criteria:**
> WHEN playback runs THEN a lookahead scheduler SHALL schedule events within a window ahead of current time.
> WHEN the scheduler runs THEN it SHALL use a timer (e.g., setInterval every 25ms) to check for events to schedule.
> WHEN events are scheduled THEN they SHALL use Web Audio API's precise timing (start(time)).

---

### 28. Looping Transport

**User Story:**
> As a user, I want playback to loop so that I can hear my composition repeat continuously.

**Acceptance Criteria:**
> WHEN loop is enabled and playback reaches the end THEN it SHALL seamlessly restart from the beginning.
> WHEN looping THEN events SHALL NOT be double-scheduled.
> WHEN the loop toggle is off THEN playback SHALL stop at the end of the composition.

---

### 29. Transport Controls

**User Story:**
> As a user, I want enhanced transport controls so that I have better control over playback.

**Acceptance Criteria:**
> WHEN the transport is displayed THEN Play, Stop, and Restart buttons SHALL be visible.
> WHEN the Loop toggle is available THEN it SHALL default to on if loopBars is set.
> WHEN Restart is clicked THEN the playhead SHALL reset to 0.
> WHEN BPM is displayed THEN it SHALL show the value from the compiled program (read-only).

---

### 30. Track Mute and Solo

**User Story:**
> As a user, I want to mute or solo individual tracks so that I can focus on specific parts of my composition.

**Acceptance Criteria:**
> WHEN I mute a track THEN its events SHALL NOT be scheduled for playback.
> WHEN I solo a track THEN only that track's events SHALL be scheduled (mutes are overridden).
> WHEN multiple tracks are soloed THEN all soloed tracks SHALL play.
> WHEN no tracks are soloed THEN mute settings SHALL apply normally.

---

### 31. Playback Visualization

**User Story:**
> As a user, I want to see the current playback position so that I know where I am in the composition.

**Acceptance Criteria:**
> WHEN playback is active THEN the current playhead time SHALL be displayed.
> WHEN playback is active THEN the loop length SHALL be displayed.
> WHEN playback is active THEN per-track event counts SHALL be visible.

---

### 32. Compiled Output Debug Panel

**User Story:**
> As a user, I want to inspect the compiled AST and events so that I can debug my compositions.

**Acceptance Criteria:**
> WHEN a debug toggle is enabled THEN the compiled AST/events SHALL be displayed in a panel.
> WHEN the panel shows events THEN they SHALL include track metadata.
> WHEN chords are compiled THEN they SHALL appear as multiple events at the same time.

---

### 33. v0.2 Error Handling

**User Story:**
> As a user, I want improved error messages for v0.2 features so that I can troubleshoot complex compositions.

**Acceptance Criteria:**
> WHEN an unknown instrument is referenced by a track THEN a compile error SHALL be shown.
> WHEN an unknown pattern is referenced by `use` THEN a compile error SHALL be shown.
> WHEN invalid swing or grid values are provided THEN a compile error with explanation SHALL be shown.

---

### 34. v0.2 Test Coverage

**User Story:**
> As a developer, I want tests for v0.2 features so that I can ensure correct behavior.

**Acceptance Criteria:**
> WHEN pattern expansion is tested THEN tests SHALL verify correct event generation.
> WHEN repeat block expansion is tested THEN tests SHALL verify correct repetition.
> WHEN swing timing is tested THEN tests SHALL verify correct time adjustments on a known sequence.
> WHEN chord expansion is tested THEN tests SHALL verify multiple events at the same time.

---

### 35. Backward Compatibility

**User Story:**
> As a user, I want v0.2 to remain compatible with MVP features so that existing compositions still work.

**Acceptance Criteria:**
> WHEN a v0.1 DSL program is used THEN it SHALL compile and play correctly in v0.2.
> WHEN Play/Stop/Compile buttons are used THEN they SHALL function as they did in the MVP.
> WHEN upgrading to v0.2 THEN no regressions to MVP functionality SHALL occur.
