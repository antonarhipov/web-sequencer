// Example 11: Super Mario Bros. Theme (Extended Version)
// The iconic main theme from the classic Nintendo game
// Composed by Koji Kondo (1985)
// Extended arrangement - approximately 1+ minute

bpm 180
loop 48
grid 16

// Square wave for that classic 8-bit NES sound
inst melody square gain=0.5 attack=0.005 decay=0.05 sustain=0.4 release=0.05
inst bass square gain=0.4 attack=0.005 decay=0.03 sustain=0.5 release=0.05
inst harmony square gain=0.3 attack=0.005 decay=0.05 sustain=0.3 release=0.05

// Main melody - the iconic Super Mario theme
track lead inst=melody:
  // ========== SECTION A: Main Theme (First Time) ==========
  // Opening phrase - the iconic "ba-ba-ba ba-ba"
  E5 1/8, E5 1/8, r 1/8, E5 1/8,
  r 1/8, C5 1/8, E5 1/8, r 1/8,
  G5 1/4, r 1/4, G4 1/4, r 1/4,

  // Second phrase - descending
  C5 1/4, r 1/8, G4 1/8, r 1/4, E4 1/4,
  r 1/8, A4 1/8, r 1/8, B4 1/8,
  r 1/8, Bb4 1/8, A4 1/4,

  // Triplet-feel ascending run
  G4 1/8, E5 1/8, G5 1/8, A5 1/8,
  r 1/8, F5 1/8, G5 1/8, r 1/8,
  E5 1/8, r 1/8, C5 1/8, D5 1/8, B4 1/4,

  // ========== SECTION A: Main Theme (Second Time) ==========
  // Repeat main phrase
  C5 1/4, r 1/8, G4 1/8, r 1/4, E4 1/4,
  r 1/8, A4 1/8, r 1/8, B4 1/8,
  r 1/8, Bb4 1/8, A4 1/4,

  // Triplet-feel ascending run again
  G4 1/8, E5 1/8, G5 1/8, A5 1/8,
  r 1/8, F5 1/8, G5 1/8, r 1/8,
  E5 1/8, r 1/8, C5 1/8, D5 1/8, B4 1/4,

  // ========== SECTION B: Bridge/Transition ==========
  // Chromatic descending line
  r 1/8, G5 1/8, F#5 1/8, F5 1/8, D#5 1/4,
  E5 1/8, r 1/8, G#4 1/8, A4 1/8, C5 1/8, r 1/8,
  A4 1/8, C5 1/8, D5 1/4, r 1/4,

  // Repeat chromatic section
  r 1/8, G5 1/8, F#5 1/8, F5 1/8, D#5 1/4,
  E5 1/8, r 1/8, C6 1/8, r 1/8, C6 1/8, C6 1/4,
  r 1/4, r 1/4,

  // ========== SECTION C: Underground Theme Intro ==========
  // Lower register mysterious section
  C4 1/8, C5 1/8, A3 1/8, A4 1/8,
  Bb3 1/8, Bb4 1/8, r 1/4,
  C4 1/8, C5 1/8, A3 1/8, A4 1/8,
  Bb3 1/8, Bb4 1/8, r 1/4,

  // Underground chromatic walk
  F#3 1/8, F#4 1/8, F3 1/8, F4 1/8,
  E3 1/8, E4 1/8, r 1/4,
  Ab3 1/8, A3 1/8, Bb3 1/8, r 1/8,
  B3 1/4, r 1/4,

  // ========== SECTION D: Return to Main Theme ==========
  // Opening phrase return
  E5 1/8, E5 1/8, r 1/8, E5 1/8,
  r 1/8, C5 1/8, E5 1/8, r 1/8,
  G5 1/4, r 1/4, G4 1/4, r 1/4,

  // Full phrase
  C5 1/4, r 1/8, G4 1/8, r 1/4, E4 1/4,
  r 1/8, A4 1/8, r 1/8, B4 1/8,
  r 1/8, Bb4 1/8, A4 1/4,

  // Ascending run
  G4 1/8, E5 1/8, G5 1/8, A5 1/8,
  r 1/8, F5 1/8, G5 1/8, r 1/8,
  E5 1/8, r 1/8, C5 1/8, D5 1/8, B4 1/4,

  // ========== SECTION E: Hurry Up! Variation ==========
  // Faster-feeling repeated notes
  C5 1/16, C5 1/16, C5 1/8, C5 1/16, C5 1/16, D5 1/8,
  E5 1/16, E5 1/16, E5 1/8, C5 1/16, A4 1/16, G4 1/8,
  
  C5 1/16, C5 1/16, C5 1/8, C5 1/16, D5 1/16, E5 1/8,
  r 1/4, r 1/4,
  
  C5 1/16, C5 1/16, C5 1/8, C5 1/16, C5 1/16, D5 1/8,
  E5 1/16, E5 1/16, E5 1/8, C5 1/16, A4 1/16, G4 1/8,
  
  E5 1/8, E5 1/8, r 1/8, E5 1/8,
  r 1/8, C5 1/8, E5 1/8, r 1/8,
  G5 1/4, r 1/4, G4 1/4, r 1/4,

  // ========== SECTION F: Grand Finale ==========
  // Building to climax
  C5 1/8, E5 1/8, G5 1/8, C6 1/8,
  r 1/8, G5 1/8, E5 1/8, C5 1/8,
  
  D5 1/8, F5 1/8, A5 1/8, D6 1/8,
  r 1/8, A5 1/8, F5 1/8, D5 1/8,
  
  E5 1/8, G5 1/8, B5 1/8, E6 1/8,
  r 1/8, B5 1/8, G5 1/8, E5 1/8,
  
  // Final chromatic descent
  r 1/8, G5 1/8, F#5 1/8, F5 1/8, D#5 1/4,
  E5 1/8, r 1/8, G#4 1/8, A4 1/8, C5 1/8, r 1/8,
  A4 1/8, C5 1/8, D5 1/4, r 1/4,

  r 1/8, G5 1/8, F#5 1/8, F5 1/8, D#5 1/4,
  E5 1/8, r 1/8, C6 1/8, r 1/8, C6 1/8, C6 1/4,
  r 1/4, r 1/4,

  // ========== SECTION G: Level Complete Fanfare ==========
  // Triumphant ending
  G4 1/8, C5 1/8, E5 1/8, G5 1/8, C6 1/8, E6 1/8,
  G6 1/4,
  
  Ab4 1/8, C5 1/8, Eb5 1/8, Ab5 1/8, C6 1/8, Eb6 1/8,
  Ab6 1/4,
  
  Bb4 1/8, D5 1/8, F5 1/8, Bb5 1/8, D6 1/8, F6 1/8,
  Bb6 1/4,
  
  // Final C chord arpeggio
  C5 1/8, E5 1/8, G5 1/8, C6 1/8,
  E6 1/4, G6 1/4,
  C7 1/2, r 1/2

// Bass line - bouncy accompaniment
track bassline inst=bass:
  // ========== SECTION A: Main Theme Bass ==========
  // Opening bouncy bass
  D3 1/8, r 1/8, D3 1/8, r 1/8,
  D3 1/8, r 1/8, D3 1/8, r 1/8,
  G3 1/4, r 1/4, G2 1/4, r 1/4,

  // Second phrase bass
  G3 1/8, r 1/8, E3 1/8, r 1/8, C3 1/4, r 1/8,
  F3 1/8, r 1/8, F3 1/8, r 1/8,
  F3 1/8, r 1/8, F3 1/4,

  // Walking bass
  C3 1/8, r 1/8, C3 1/8, E3 1/8, G3 1/8, r 1/8,
  C4 1/8, r 1/8, G3 1/8, r 1/8,
  G3 1/8, r 1/8, A3 1/8, B3 1/8, G3 1/4,

  // ========== SECTION A repeat bass ==========
  G3 1/8, r 1/8, E3 1/8, r 1/8, C3 1/4, r 1/8,
  F3 1/8, r 1/8, F3 1/8, r 1/8,
  F3 1/8, r 1/8, F3 1/4,

  C3 1/8, r 1/8, C3 1/8, E3 1/8, G3 1/8, r 1/8,
  C4 1/8, r 1/8, G3 1/8, r 1/8,
  G3 1/8, r 1/8, A3 1/8, B3 1/8, G3 1/4,

  // ========== SECTION B: Bridge Bass ==========
  C3 1/8, r 1/8, G3 1/8, r 1/8, C3 1/4,
  F3 1/8, r 1/8, C3 1/8, F3 1/8, C3 1/8, r 1/8,
  F3 1/8, C3 1/8, G3 1/4, r 1/4,

  C3 1/8, r 1/8, G3 1/8, r 1/8, C3 1/4,
  Ab3 1/8, r 1/8, Ab3 1/8, r 1/8, Ab3 1/8, Ab3 1/4,
  r 1/4, r 1/4,

  // ========== SECTION C: Underground Bass ==========
  // Mysterious low notes
  C2 1/4, r 1/4, A2 1/4, Bb2 1/4,
  C2 1/4, r 1/4, A2 1/4, Bb2 1/4,
  
  F#2 1/4, F2 1/4, E2 1/4, r 1/4,
  Ab2 1/8, A2 1/8, Bb2 1/8, r 1/8, B2 1/4, r 1/4,

  // ========== SECTION D: Return Bass ==========
  D3 1/8, r 1/8, D3 1/8, r 1/8,
  D3 1/8, r 1/8, D3 1/8, r 1/8,
  G3 1/4, r 1/4, G2 1/4, r 1/4,

  G3 1/8, r 1/8, E3 1/8, r 1/8, C3 1/4, r 1/8,
  F3 1/8, r 1/8, F3 1/8, r 1/8,
  F3 1/8, r 1/8, F3 1/4,

  C3 1/8, r 1/8, C3 1/8, E3 1/8, G3 1/8, r 1/8,
  C4 1/8, r 1/8, G3 1/8, r 1/8,
  G3 1/8, r 1/8, A3 1/8, B3 1/8, G3 1/4,

  // ========== SECTION E: Hurry Up Bass ==========
  C3 1/8, C3 1/8, C3 1/8, r 1/8, G3 1/8, G3 1/8, G3 1/8, r 1/8,
  C3 1/8, C3 1/8, C3 1/8, r 1/8, r 1/4,
  
  C3 1/8, C3 1/8, C3 1/8, r 1/8, G3 1/8, G3 1/8, G3 1/8, r 1/8,
  D3 1/8, r 1/8, D3 1/8, r 1/8,
  D3 1/8, r 1/8, D3 1/8, r 1/8,
  G3 1/4, r 1/4, G2 1/4, r 1/4,

  // ========== SECTION F: Grand Finale Bass ==========
  C3 1/4, r 1/4, G3 1/4, r 1/4,
  D3 1/4, r 1/4, A3 1/4, r 1/4,
  E3 1/4, r 1/4, B3 1/4, r 1/4,
  
  C3 1/8, r 1/8, G3 1/8, r 1/8, C3 1/4,
  F3 1/8, r 1/8, C3 1/8, F3 1/8, C3 1/8, r 1/8,
  F3 1/8, C3 1/8, G3 1/4, r 1/4,

  C3 1/8, r 1/8, G3 1/8, r 1/8, C3 1/4,
  Ab3 1/8, r 1/8, Ab3 1/8, r 1/8, Ab3 1/8, Ab3 1/4,
  r 1/4, r 1/4,

  // ========== SECTION G: Level Complete Bass ==========
  C3 1/4, G3 1/4, C4 1/4, r 1/4,
  Ab2 1/4, Eb3 1/4, Ab3 1/4, r 1/4,
  Bb2 1/4, F3 1/4, Bb3 1/4, r 1/4,
  C3 1/4, G3 1/4, C4 1/4, r 1/4,
  C2 1/2, r 1/2

// Harmony track for extra richness in key sections
track chords inst=harmony:
  // Sparse harmony - comes in at key moments
  r 1/1, r 1/1, r 1/1,
  r 1/1, r 1/1, r 1/1,
  r 1/1, r 1/1, r 1/1,
  r 1/1, r 1/1, r 1/1,
  r 1/1, r 1/1, r 1/1,

  // Bridge harmony
  [E4 G4] 1/4, r 1/4, [D4 F4] 1/4, r 1/4,
  [C4 E4] 1/2, r 1/2,
  [E4 G4] 1/4, r 1/4, [E4 Ab4] 1/4, r 1/4,
  [E4 G4] 1/2, r 1/2,

  // Underground harmony - octaves
  r 1/1, r 1/1,
  r 1/1, r 1/1,

  // Return theme - light harmony
  r 1/1, r 1/1, r 1/1,
  r 1/1, r 1/1, r 1/1,
  r 1/1, r 1/1, r 1/1,

  // Hurry up - driving chords
  [E4 G4] 1/8, r 1/8, [E4 G4] 1/8, r 1/8, [F4 A4] 1/8, r 1/8, r 1/4,
  [E4 G4] 1/8, r 1/8, [E4 G4] 1/8, r 1/8, [F4 A4] 1/8, r 1/8, r 1/4,
  [E4 G4] 1/8, r 1/8, [E4 G4] 1/8, r 1/8, [F4 A4] 1/8, r 1/8, r 1/4,
  r 1/1, r 1/1,

  // Grand finale harmony
  [E4 G4] 1/4, r 1/4, [E4 G4] 1/4, r 1/4,
  [F4 A4] 1/4, r 1/4, [F4 A4] 1/4, r 1/4,
  [G4 B4] 1/4, r 1/4, [G4 B4] 1/4, r 1/4,
  
  [E4 G4] 1/4, r 1/4, [D4 F4] 1/4, r 1/4,
  [C4 E4] 1/2, r 1/2,
  [E4 G4] 1/4, r 1/4, [E4 Ab4] 1/4, r 1/4,
  [E4 G4] 1/2, r 1/2,

  // Level complete chords
  [E4 G4 C5] 1/2, r 1/2,
  [Eb4 Ab4 C5] 1/2, r 1/2,
  [F4 Bb4 D5] 1/2, r 1/2,
  [E4 G4 C5] 1/2, r 1/2,
  [C4 E4 G4 C5] 1/1
