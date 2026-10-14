// Headphones and speakers: nothing on them lights or presses, and they hold no songs. They stand on
// their plinths and are picked up and turned in the hand like the players.

// got: the year he got it. era: the medium the picture is drawn in while it is in hand
// (fidelity.js). flat: it lies on the plinth (earphones), and is tilted up to face you when held.
export const exhibit = (id, name, got, size, grams, { era = 'clean', flat = false } = {}) => ({ id, name, got, file: `models/${id}.glb`, size, grams, era, flat, songs: 0, async setup() {} });
