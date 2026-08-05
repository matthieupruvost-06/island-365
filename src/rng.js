// RNG déterministe (seed fixe) : garantit que la disposition du monde
// (décors, collectibles) reste identique d'une session à l'autre.
export function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rng = mulberry32(20260804);

export function rand(a, b) { return a + rng() * (b - a); }
export function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
