// Example 3: Multi-Track Composition
// Demonstrates multiple tracks with different instruments
// A layered arrangement with bass, chords, and melody

bpm 120
loop 2

// Define instruments with different characteristics
inst bass square gain=0.5 attack=0.01 decay=0.05 sustain=0.8 release=0.1
inst pad triangle gain=0.4 attack=0.2 decay=0.1 sustain=0.7 release=0.4
inst lead sine gain=0.6 attack=0.005 decay=0.05 sustain=0.6 release=0.15

// Bass track - driving rhythm
track bassline inst=bass:
  C2 1/8, r 1/8, C2 1/8, r 1/8, G2 1/8, r 1/8, G2 1/8, r 1/8,
  A2 1/8, r 1/8, A2 1/8, r 1/8, E2 1/8, r 1/8, E2 1/8, r 1/8,
  F2 1/8, r 1/8, F2 1/8, r 1/8, C2 1/8, r 1/8, C2 1/8, r 1/8,
  G2 1/8, r 1/8, G2 1/8, r 1/8, G2 1/4, r 1/4

// Pad track - sustained chords for harmony
track harmony inst=pad:
  [C3 E3 G3] 1/1,
  [A2 C3 E3] 1/1,
  [F2 A2 C3] 1/1,
  [G2 B2 D3] 1/1

// Lead track - catchy melody
track melody inst=lead:
  r 1/2, E4 1/8, G4 1/8, C5 1/4,
  r 1/4, C5 1/8, B4 1/8, A4 1/4, G4 1/4,
  r 1/4, A4 1/8, G4 1/8, F4 1/4, E4 1/4,
  r 1/4, D4 1/8, E4 1/8, D4 1/2
