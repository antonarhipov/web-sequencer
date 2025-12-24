// Arpeggio Patterns
// Demonstrates various arpeggio techniques and patterns

bpm 130
loop 4
grid 16

// Bright lead for arpeggios
inst arp sine gain=0.6 attack=0.005 decay=0.1 sustain=0.4 release=0.15

// Soft pad for harmonic foundation
inst pad triangle gain=0.4 attack=0.3 decay=0.1 sustain=0.7 release=0.4

// Sub bass for low end
inst bass square gain=0.35 attack=0.01 release=0.1

// Rising arpeggio pattern (C major)
pattern arp_up:
  C4 1/16, E4 1/16, G4 1/16, C5 1/16

// Falling arpeggio pattern
pattern arp_down:
  C5 1/16, G4 1/16, E4 1/16, C4 1/16

// Alternating pattern
pattern arp_alt:
  C4 1/16, G4 1/16, E4 1/16, G4 1/16

// Main arpeggio track - cycles through patterns
track arpeggios inst=arp:
  // C major arpeggios
  use arp_up x2, use arp_down x2,
  use arp_alt x4,
  // F major arpeggios (transposed manually)
  F4 1/16, A4 1/16, C5 1/16, F5 1/16,
  F4 1/16, A4 1/16, C5 1/16, F5 1/16,
  F5 1/16, C5 1/16, A4 1/16, F4 1/16,
  F5 1/16, C5 1/16, A4 1/16, F4 1/16,
  // G major arpeggios
  G4 1/16, B4 1/16, D5 1/16, G5 1/16,
  G4 1/16, B4 1/16, D5 1/16, G5 1/16,
  G5 1/16, D5 1/16, B4 1/16, G4 1/16,
  G5 1/16, D5 1/16, B4 1/16, G4 1/16,
  // Back to C
  use arp_up x4

// Sustained chords underneath
track pads inst=pad:
  [C3 E3 G3] 1/1,
  [F3 A3 C4] 1/1,
  [G3 B3 D4] 1/1,
  [C3 E3 G3] 1/1

// Root notes for bass
track bassline inst=bass:
  C2 1/2, r 1/2,
  F2 1/2, r 1/2,
  G2 1/2, r 1/2,
  C2 1/2, r 1/2
