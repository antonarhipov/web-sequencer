// Example 4: Swing and Rhythm
// Demonstrates swing timing, repeat blocks, and velocity dynamics
// A groovy jazz-style rhythm with shuffle feel

bpm 110
swing 0.5
loop 2
grid 16

inst keys sine gain=0.6 attack=0.01 decay=0.1 sustain=0.5 release=0.2
inst bass sawtooth gain=0.4 attack=0.005 decay=0.05 sustain=0.7 release=0.1

// Define a swung rhythmic pattern
pattern swingRiff:
  C4 1/8 vel=0.9, E4 1/8 vel=0.6, G4 1/8 vel=0.8, E4 1/8 vel=0.5

// Keys track with velocity dynamics
track piano inst=keys:
  // Use repeat blocks for efficiency
  x2 {
    // Accented first beat, softer following notes
    C4 1/8 vel=1.0, r 1/16, E4 1/16 vel=0.4,
    G4 1/8 vel=0.7, r 1/16, E4 1/16 vel=0.4
  },
  
  // Melodic phrase with dynamics
  x2 {
    F4 1/8 vel=0.9, A4 1/8 vel=0.6,
    G4 1/8 vel=0.8, E4 1/8 vel=0.5
  },
  
  // Building intensity
  C5 1/8 vel=0.7, D5 1/8 vel=0.8, E5 1/8 vel=0.9, G5 1/8 vel=1.0,
  
  // Resolution with decrescendo
  E5 1/8 vel=0.8, D5 1/8 vel=0.6, C5 1/8 vel=0.4, G4 1/8 vel=0.3

// Walking bass line
track walking inst=bass:
  x2 {
    C2 1/4 vel=0.9, E2 1/4 vel=0.7,
    G2 1/4 vel=0.8, A2 1/4 vel=0.6
  },
  F2 1/4 vel=0.9, A2 1/4 vel=0.7,
  G2 1/4 vel=0.8, E2 1/4 vel=0.6,
  C2 1/2 vel=1.0, G2 1/2 vel=0.7
