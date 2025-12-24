// Example 1: Basic Melody
// A simple melody demonstrating notes, rests, and durations
// This plays "Twinkle Twinkle Little Star" melody

bpm 100

inst melody sine gain=0.7

seq:
  // First phrase: "Twinkle twinkle little star"
  C4 1/4, C4 1/4, G4 1/4, G4 1/4,
  A4 1/4, A4 1/4, G4 1/2,
  
  // Second phrase: "How I wonder what you are"
  F4 1/4, F4 1/4, E4 1/4, E4 1/4,
  D4 1/4, D4 1/4, C4 1/2,
  
  // Third phrase: "Up above the world so high"
  G4 1/4, G4 1/4, F4 1/4, F4 1/4,
  E4 1/4, E4 1/4, D4 1/2,
  
  // Fourth phrase: "Like a diamond in the sky"
  G4 1/4, G4 1/4, F4 1/4, F4 1/4,
  E4 1/4, E4 1/4, D4 1/2,
  
  // Final phrase: "Twinkle twinkle little star"
  C4 1/4, C4 1/4, G4 1/4, G4 1/4,
  A4 1/4, A4 1/4, G4 1/2,
  
  // Ending: "How I wonder what you are"
  F4 1/4, F4 1/4, E4 1/4, E4 1/4,
  D4 1/4, D4 1/4, C4 1/1
