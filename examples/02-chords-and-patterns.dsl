// Example 2: Chords and Patterns
// Demonstrates chord notation and reusable patterns
// A simple chord progression with a melodic pattern

bpm 90
loop 4

inst piano triangle gain=0.6 attack=0.01 decay=0.1 sustain=0.6 release=0.3

// Define a reusable arpeggio pattern
pattern arpeggio:
  C4 1/8, E4 1/8, G4 1/8, E4 1/8

// Define chord patterns
pattern cMajor:
  [C3 E3 G3] 1/2

pattern fMajor:
  [F3 A3 C4] 1/2

pattern gMajor:
  [G3 B3 D4] 1/2

pattern aMajor:
  [A3 C4 E4] 1/2

seq:
  // Verse: Chords with arpeggios
  use cMajor, use arpeggio,
  use fMajor, use arpeggio,
  use gMajor, use arpeggio,
  use cMajor, use arpeggio,
  
  // Bridge: Just chords
  [C3 E3 G3 B3] 1/2,    // Cmaj7
  [F3 A3 C4 E4] 1/2,    // Fmaj7
  [D3 F3 A3 C4] 1/2,    // Dm7
  [G3 B3 D4 F4] 1/2,    // G7
  
  // Ending: Resolved chord
  [C3 E3 G3 C4] 1/1     // C major with octave
