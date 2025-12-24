// Ambient Drone
// A peaceful, atmospheric piece with long sustained notes and evolving textures

bpm 60
loop 8

// Deep drone - very slow attack for evolving texture
inst drone sine gain=0.3 attack=1.0 decay=0.5 sustain=0.8 release=1.5

// Ethereal pad - soft and airy
inst pad triangle gain=0.25 attack=0.8 decay=0.3 sustain=0.6 release=1.0

// High shimmer - delicate overtones
inst shimmer sine gain=0.15 attack=0.5 decay=0.2 sustain=0.4 release=0.8

// Occasional low pulse
inst pulse square gain=0.2 attack=0.3 decay=0.4 sustain=0.3 release=0.6

// Deep foundation drone - holds root notes
track foundation inst=drone:
  C2 1/1, C2 1/1,
  C2 1/1, C2 1/1,
  G1 1/1, G1 1/1,
  C2 1/1, C2 1/1

// Middle layer - slow moving chords
track atmosphere inst=pad:
  [C3 G3] 1/1, [E3 B3] 1/1,
  [F3 C4] 1/1, [G3 D4] 1/1,
  [D3 A3] 1/1, [E3 B3] 1/1,
  [F3 C4] 1/1, [C3 G3] 1/1

// High frequency details - sparse melodic fragments
track sparkle inst=shimmer:
  r 1/2, G5 1/2 vel=0.4,
  E5 1/1 vel=0.3,
  r 1/1,
  C5 1/2 vel=0.5, r 1/2,
  r 1/1,
  B4 1/1 vel=0.3,
  G5 1/2 vel=0.4, E5 1/2 vel=0.3,
  C5 1/1 vel=0.5

// Subtle rhythmic element - very sparse
track heartbeat inst=pulse:
  r 1/1,
  C3 1/2 vel=0.4, r 1/2,
  r 1/1,
  r 1/2, G2 1/2 vel=0.3,
  r 1/1,
  C3 1/2 vel=0.5, r 1/2,
  r 1/1,
  r 1/1
