// Example 5: Complex Composition
// A complete piece combining all DSL features:
// - Multiple tracks and instruments
// - Patterns with reuse
// - Chords and arpeggios
// - Repeat blocks (nested)
// - Accidentals (sharps and flats)
// - Velocity dynamics
// - Custom ADSR envelopes

bpm 128
swing 0.25
loop 4
grid 16

// Define instruments with custom envelopes
inst synth sawtooth gain=0.5 attack=0.01 decay=0.15 sustain=0.4 release=0.3
inst pad triangle gain=0.35 attack=0.3 decay=0.2 sustain=0.6 release=0.5
inst bass square gain=0.45 attack=0.005 decay=0.08 sustain=0.7 release=0.1
inst arp sine gain=0.4 attack=0.005 decay=0.05 sustain=0.5 release=0.15

// Reusable patterns
pattern introRiff:
  E4 1/16 vel=0.8, G4 1/16 vel=0.6, B4 1/16 vel=0.9, E5 1/16 vel=0.7

pattern minorChord:
  [E3 G3 B3] 1/2

pattern majorChord:
  [G3 B3 D4] 1/2

pattern bassGroove:
  E2 1/8 vel=0.9, r 1/16, E2 1/16 vel=0.5, G2 1/8 vel=0.7, B2 1/8 vel=0.6

// Lead synth track
track lead inst=synth:
  // Intro - building tension
  x2 { use introRiff },
  r 1/4,
  
  // Main melody with accidentals
  E4 1/8 vel=0.9, F#4 1/8 vel=0.7, G4 1/8 vel=0.8, A4 1/8 vel=0.6,
  B4 1/4 vel=1.0, A4 1/8 vel=0.7, G4 1/8 vel=0.6,
  
  // Chromatic run down
  F#4 1/16 vel=0.8, F4 1/16 vel=0.7, E4 1/16 vel=0.6, Eb4 1/16 vel=0.5,
  D4 1/8 vel=0.7, E4 1/4 vel=0.9,
  
  // Second phrase
  x2 {
    G4 1/8 vel=0.8, A4 1/16 vel=0.6, B4 1/16 vel=0.7,
    C5 1/8 vel=0.9, B4 1/8 vel=0.6
  },
  
  // Climax
  E5 1/8 vel=1.0, D5 1/8 vel=0.9, C5 1/8 vel=0.8, B4 1/8 vel=0.7,
  A4 1/4 vel=0.9, G4 1/4 vel=0.8,
  
  // Resolution
  E4 1/2 vel=0.6, r 1/2

// Pad track for atmosphere
track atmosphere inst=pad:
  // Slow chord progression
  [E3 G3 B3] 1/1,                    // Em
  [C3 E3 G3] 1/1,                    // C
  [G3 B3 D4] 1/1,                    // G
  [D3 F#3 A3] 1/1,                   // D
  
  // Second progression
  [A3 C4 E4] 1/1,                    // Am
  [E3 G#3 B3] 1/1,                   // E (major)
  [A3 C4 E4] 1/2, [G3 B3 D4] 1/2,   // Am -> G
  [E3 G3 B3] 1/1                     // Em

// Bass track - driving rhythm
track lowend inst=bass:
  x2 { use bassGroove },
  
  // Walking bass section
  C2 1/4 vel=0.9, D2 1/4 vel=0.7, E2 1/4 vel=0.8, G2 1/4 vel=0.6,
  A2 1/4 vel=0.9, G2 1/4 vel=0.7, E2 1/4 vel=0.8, D2 1/4 vel=0.6,
  
  // Syncopated section
  x2 {
    E2 1/8 vel=1.0, r 1/8, G2 1/8 vel=0.7, r 1/8
  },
  
  // Ending bass run
  E2 1/8 vel=0.9, F#2 1/8 vel=0.8, G2 1/8 vel=0.7, A2 1/8 vel=0.6,
  B2 1/4 vel=0.8, E2 1/2 vel=1.0

// Arpeggio track - rhythmic texture
track arpeggios inst=arp:
  // Nested repeat for complex pattern
  x2 {
    x4 { E4 1/16 vel=0.6, G4 1/16 vel=0.5, B4 1/16 vel=0.7, G4 1/16 vel=0.5 },
    x4 { C4 1/16 vel=0.6, E4 1/16 vel=0.5, G4 1/16 vel=0.7, E4 1/16 vel=0.5 }
  },
  
  // Variation
  x2 {
    x4 { G4 1/16 vel=0.6, B4 1/16 vel=0.5, D5 1/16 vel=0.7, B4 1/16 vel=0.5 }
  },
  
  // Final flourish
  x2 { E4 1/16 vel=0.8, G4 1/16 vel=0.7, B4 1/16 vel=0.9, E5 1/16 vel=1.0 },
  E5 1/4 vel=0.6, r 1/4
