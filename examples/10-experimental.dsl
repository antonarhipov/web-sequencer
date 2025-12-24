// Experimental Rhythms
// An avant-garde piece exploring unusual rhythmic patterns and textures

bpm 140
loop 8
grid 32

// Glitchy lead - very short, percussive
inst glitch square gain=0.4 attack=0.001 decay=0.02 sustain=0.1 release=0.03

// Atmospheric texture - slow evolving
inst texture sine gain=0.3 attack=0.4 decay=0.2 sustain=0.5 release=0.6

// Metallic bell-like tone
inst bell triangle gain=0.35 attack=0.002 decay=0.3 sustain=0.2 release=0.4

// Deep sub for occasional hits
inst sub sine gain=0.5 attack=0.05 decay=0.15 sustain=0.4 release=0.2

// Irregular stuttering pattern
pattern stutter:
  C5 1/32 vel=1.0, C5 1/32 vel=0.6, r 1/32, C5 1/32 vel=0.3,
  r 1/16, C5 1/32 vel=0.8, r 1/32

// Polyrhythmic 5-against-4 feel
pattern poly5:
  E4 1/8 vel=0.9, r 1/16,
  G4 1/16 vel=0.5,
  B4 1/8 vel=0.7, r 1/16,
  E5 1/16 vel=0.4

// Sparse chromatic clusters
pattern cluster:
  [C4 Db4] 1/8 vel=0.6, r 1/8,
  [F#4 G4] 1/16 vel=0.8, r 1/16, r 1/8,
  [Bb4 B4] 1/8 vel=0.5

// Glitch track - rapid-fire stutters
track glitches inst=glitch:
  use stutter x4,
  r 1/4,
  use stutter x2, r 1/8,
  x3 { D5 1/32 vel=0.9, r 1/32 }, r 1/16,
  use stutter x4,
  r 1/2,
  x4 { E5 1/32 vel=0.7, F5 1/32 vel=0.5 },
  r 1/4,
  use stutter x2,
  x2 { G5 1/32 vel=1.0, r 1/32, G5 1/32 vel=0.4, r 1/32 },
  r 1/8, use stutter x2

// Texture layer - long evolving notes
track ambient inst=texture:
  C3 1/1 vel=0.5,
  r 1/1,
  [E3 G3] 1/1 vel=0.4,
  Bb3 1/2 vel=0.6, r 1/2,
  r 1/1,
  [D3 F3] 1/1 vel=0.5,
  r 1/2, Ab3 1/2 vel=0.3,
  C3 1/1 vel=0.6

// Bell track - unpredictable accents
track bells inst=bell:
  r 1/2, use cluster,
  r 1/4, G5 1/8 vel=0.7, r 1/8,
  use poly5, r 1/4,
  use cluster, r 1/4,
  r 1/2, [E5 F#5] 1/4 vel=0.6, r 1/4,
  use poly5,
  r 1/8, Db5 1/8 vel=0.5, r 1/4,
  use cluster,
  B5 1/16 vel=0.9, r 1/16, r 1/4,
  use poly5, r 1/4

// Sub bass - irregular deep hits
track subs inst=sub:
  C1 1/4 vel=1.0, r 3/4,
  r 1/2, F1 1/4 vel=0.8, r 1/4,
  r 1/1,
  Eb1 1/8 vel=0.9, r 7/8,
  r 3/4, G1 1/4 vel=0.7,
  r 1/1,
  r 1/4, C1 1/4 vel=1.0, r 1/2,
  r 1/2, r 1/4, C1 1/4 vel=0.6
