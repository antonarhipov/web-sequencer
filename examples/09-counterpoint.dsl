// Classical Counterpoint
// A Bach-inspired two-part invention with independent melodic lines

bpm 90
loop 4
grid 16

// Upper voice - bright and clear
inst soprano sine gain=0.5 attack=0.01 decay=0.05 sustain=0.7 release=0.12

// Lower voice - warm and round
inst bass triangle gain=0.45 attack=0.01 decay=0.08 sustain=0.65 release=0.15

// Main subject (theme) - ascending motif
pattern subject:
  C4 1/16, D4 1/16, E4 1/16, F4 1/16,
  G4 1/8, E4 1/8,
  F4 1/16, E4 1/16, D4 1/16, C4 1/16

// Counter-subject - complementary motion
pattern counter:
  E3 1/8, G3 1/8,
  C3 1/16, D3 1/16, E3 1/16, F3 1/16,
  G3 1/8, F3 1/8

// Upper voice - soprano line
track upper inst=soprano:
  // Bar 1: Subject enters
  use subject,
  G4 1/8, A4 1/8,
  // Bar 2: Development
  B4 1/16, A4 1/16, G4 1/16, F4 1/16,
  E4 1/8, D4 1/8,
  C4 1/16, D4 1/16, E4 1/16, F4 1/16,
  G4 1/4,
  // Bar 3: Sequence up
  A4 1/16, B4 1/16, C5 1/16, D5 1/16,
  E5 1/8, C5 1/8,
  D5 1/16, C5 1/16, B4 1/16, A4 1/16,
  G4 1/8, F4 1/8,
  // Bar 4: Resolution
  E4 1/16, F4 1/16, G4 1/16, A4 1/16,
  G4 1/8, E4 1/8,
  D4 1/4,
  C4 1/4

// Lower voice - bass line with imitation
track lower inst=bass:
  // Bar 1: Counter-subject while soprano has subject
  use counter,
  C3 1/8, B2 1/8,
  // Bar 2: Subject enters in bass (imitation)
  C3 1/16, D3 1/16, E3 1/16, F3 1/16,
  G3 1/8, E3 1/8,
  F3 1/16, E3 1/16, D3 1/16, C3 1/16,
  B2 1/4,
  // Bar 3: Free counterpoint
  A2 1/8, B2 1/8,
  C3 1/8, D3 1/8,
  E3 1/16, D3 1/16, C3 1/16, B2 1/16,
  A2 1/8, G2 1/8,
  // Bar 4: Cadence
  F2 1/8, G2 1/8,
  A2 1/16, B2 1/16, C3 1/16, D3 1/16,
  G2 1/4,
  C3 1/4
