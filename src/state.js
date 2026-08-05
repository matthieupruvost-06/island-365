import * as storage from './storage.js';
import { DEFAULT_APPEARANCE_P1, DEFAULT_APPEARANCE_P2 } from './config.js';

export const DAY_MS = 86400000;
export function realDayIndex() { return Math.floor(Date.now() / DAY_MS); }

export function freshState(mode) {
  const base = {
    mode: mode,
    inventory: {shell:0, gold:0, crystal:0, flower:0, creature:0, fish:0, mappiece:0},
    coins: 0,
    dayOffset: 0,
    startDayIndex: realDayIndex(), // le jour 1 commence à la création du profil
    completedDays: {}
  };
  if (mode === 'duo' || mode === 'online') {
    // 'online' utilise la même forme que 'duo' (deux personnages) : l'un
    // est contrôlé sur cet appareil, l'autre arrive par le réseau.
    base.players = [
      {appearance: Object.assign({}, DEFAULT_APPEARANCE_P1), pos: {x:-3, y:0, z:82}},
      {appearance: Object.assign({}, DEFAULT_APPEARANCE_P2), pos: {x:3, y:0, z:82}}
    ];
  } else {
    base.appearance = Object.assign({}, DEFAULT_APPEARANCE_P1);
    base.playerPos = {x:0, y:0, z:82};
  }
  return base;
}

// session : conteneur mutable partagé (profil actif + état de jeu courant).
export const session = {
  activeProfile: null, // {id, name, mode, names}
  state: freshState('solo'),
};

let saveTimer = null;
export function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveGame, 800); }

export async function saveGame() {
  if (!session.activeProfile) return;
  try { await storage.set('save-' + session.activeProfile.id, JSON.stringify(session.state)); } catch (e) {}
}

export async function loadGame() {
  if (!session.activeProfile) { session.state = freshState('solo'); return; }
  const mode = session.activeProfile.mode;
  try {
    const r = await storage.get('save-' + session.activeProfile.id);
    if (r && r.value) {
      const loaded = JSON.parse(r.value);
      session.state = Object.assign(freshState(mode), loaded);
      if (mode === 'duo' || mode === 'online') {
        const defaults = [DEFAULT_APPEARANCE_P1, DEFAULT_APPEARANCE_P2];
        const loadedPlayers = loaded.players || [];
        session.state.players = [0, 1].map(i => ({
          appearance: Object.assign({}, defaults[i], (loadedPlayers[i] && loadedPlayers[i].appearance) || {}),
          pos: (loadedPlayers[i] && loadedPlayers[i].pos) || {x: i === 0 ? -3 : 3, y:0, z:82}
        }));
      } else {
        session.state.appearance = Object.assign({}, DEFAULT_APPEARANCE_P1, loaded.appearance || {});
      }
    } else {
      session.state = freshState(mode);
    }
  } catch (e) { session.state = freshState(mode); }
}

export function currentDayIndex() {
  return Math.max(0, (realDayIndex() - (session.state.startDayIndex || realDayIndex())) + session.state.dayOffset);
}
