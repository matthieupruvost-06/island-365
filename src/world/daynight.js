// Cycle jour/nuit simple, avancé à la main par un bouton du HUD (pas de
// vrai temps qui passe tout seul). Sert surtout à pouvoir "sauter" jusqu'au
// coucher de soleil pour les missions photo, et donner un peu plus
// d'ambiance à l'île. Les valeurs "midi" sont celles d'origine du jeu.
import * as THREE from 'three';
import { world } from './runtime.js';
import { setSkyColors } from './sky.js';

export const DAY_PHASES = [
  { key:'morning', label:'Matin',            emoji:'🌅', skyTop:0x2f9fd8, skyBottom:0xcdf3ee, sunColor:0xfff3da, sunIntensity:1.0,  ambient:0.22, hemi:0.9,  hemiSky:0xbdf0ff, hemiGround:0x3a6b45, bg:0xcdf3ee, fog:0xcdf3ee, fogFar:340 },
  { key:'midday',  label:'Milieu de journée', emoji:'☀️', skyTop:0x2f9fd8, skyBottom:0xcdf3ee, sunColor:0xffffff, sunIntensity:1.15, ambient:0.28, hemi:0.9,  hemiSky:0xbdf0ff, hemiGround:0x3a6b45, bg:0xcdf3ee, fog:0xcdf3ee, fogFar:340 },
  { key:'sunset',  label:'Coucher de soleil', emoji:'🌇', skyTop:0xff7a5c, skyBottom:0xffd9a0, sunColor:0xff9a5c, sunIntensity:0.85, ambient:0.20, hemi:0.55, hemiSky:0xffb37a, hemiGround:0x3a2a20, bg:0xffb37a, fog:0xffb37a, fogFar:300 },
  { key:'night',   label:'Nuit',              emoji:'🌙', skyTop:0x0b1c3a, skyBottom:0x24406b, sunColor:0x7f9dff, sunIntensity:0.18, ambient:0.10, hemi:0.18, hemiSky:0x1c2a4a, hemiGround:0x0a0a12, bg:0x0b1c3a, fog:0x0b1c3a, fogFar:220 },
];

let phaseIndex = 1; // on démarre "en journée", comme avant ce changement

export function currentDayPhase() { return DAY_PHASES[phaseIndex]; }

export function applyDayPhase(index) {
  const phase = DAY_PHASES[index];
  phaseIndex = index;
  setSkyColors(phase.skyTop, phase.skyBottom);
  if (world.scene) {
    world.scene.background = new THREE.Color(phase.bg);
    if (world.scene.fog) { world.scene.fog.color.set(phase.fog); world.scene.fog.far = phase.fogFar; }
  }
  if (world.sunLight) { world.sunLight.color.set(phase.sunColor); world.sunLight.intensity = phase.sunIntensity; }
  if (world.ambientLight) world.ambientLight.intensity = phase.ambient;
  if (world.hemiLight) {
    world.hemiLight.intensity = phase.hemi;
    world.hemiLight.color.set(phase.hemiSky);
    world.hemiLight.groundColor.set(phase.hemiGround);
  }
  return phase;
}

// Avance à la phase suivante (boucle) et l'applique tout de suite.
export function advanceDayPhase() {
  return applyDayPhase((phaseIndex + 1) % DAY_PHASES.length);
}
