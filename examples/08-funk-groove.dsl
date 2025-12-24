// Funk Groove
// A funky, syncopated groove with heavy use of rests and swing timing

bpm 100
loop 4
swing 0.6
grid 16

// Punchy bass - tight envelope for funk slap
inst bass square gain=0.55 attack=0.005 decay=0.08 sustain=0.3 release=0.1

// Funky rhythm guitar - short stabs
inst guitar sawtooth gain=0.4 attack=0.005 decay=0.1 sustain=0.2 release=0.08

// Lead for melodic fills
inst lead sine gain=0.5 attack=0.01 decay=0.1 sustain=0.6 release=0.15

// Syncopated bass pattern - the pocket
pattern bass_groove:
  C2 1/16 vel=1.0, r 1/16, r 1/8,
  r 1/16, C2 1/16 vel=0.7, r 1/8,
  Eb2 1/16 vel=0.9, r 1/16, G2 1/16 vel=0.6, r 1/16

// Rhythmic chord stabs - off-beat accents
pattern funk_stab:
  r 1/16, [C4 Eb4 G4] 1/16 vel=0.8, r 1/8,
  r 1/8, [C4 Eb4 G4] 1/16 vel=0.6, r 1/16

// Main bass track - heavy syncopation
track bassline inst=bass:
  // Bar 1-2: Main groove
  use bass_groove x4,
  // Bar 3: Variation with walk up
  C2 1/16 vel=1.0, r 1/16, D2 1/16 vel=0.6, r 1/16,
  Eb2 1/16 vel=0.8, r 1/16, F2 1/16 vel=0.5, r 1/16,
  G2 1/8 vel=0.9, r 1/8,
  Bb2 1/16 vel=0.7, r 1/16, G2 1/16 vel=0.6, r 1/16,
  // Bar 4: Return to root
  use bass_groove x2

// Rhythm guitar - staccato chords
track rhythm inst=guitar:
  use funk_stab x8,
  // Bar 3-4: Variation
  r 1/8, [Eb4 G4 Bb4] 1/16 vel=0.7, r 1/16,
  [F4 Ab4 C5] 1/16 vel=0.9, r 1/16, r 1/8,
  r 1/16, [Eb4 G4 Bb4] 1/16 vel=0.6, r 1/8,
  r 1/8, [C4 Eb4 G4] 1/8 vel=0.8,
  use funk_stab x4

// Lead fills - sparse and funky
track fills inst=lead:
  // Bar 1: Rest
  r 1/1,
  // Bar 2: Quick fill
  r 1/2, r 1/8,
  G4 1/16 vel=0.9, Bb4 1/16 vel=0.7,
  C5 1/8 vel=1.0,
  // Bar 3: Answer phrase
  r 1/4,
  Eb5 1/16 vel=0.8, r 1/16, C5 1/16 vel=0.6, r 1/16,
  Bb4 1/8 vel=0.7, r 1/8,
  G4 1/4 vel=0.5,
  // Bar 4: Ending lick
  r 1/2,
  x2 { C5 1/16 vel=0.9, Bb4 1/16 vel=0.6 },
  G4 1/8 vel=0.8, r 1/8
