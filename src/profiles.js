import * as storage from './storage.js';
import { rng } from './rng.js';
import { freshState, realDayIndex } from './state.js';

export const PROFILE_INDEX_KEY = 'profile-index';
export const LAST_PROFILE_KEY = 'last-profile';

export async function loadProfileIndex() {
  try { const r = await storage.get(PROFILE_INDEX_KEY); if (r && r.value) return JSON.parse(r.value); }
  catch (e) {}
  return [];
}
export async function saveProfileIndex(list) {
  try { await storage.set(PROFILE_INDEX_KEY, JSON.stringify(list)); } catch (e) {}
}
export async function createProfile(mode, names) {
  const id = 'p' + Date.now().toString(36) + Math.floor(rng() * 1000);
  const name = mode === 'duo' ? (names[0] + ' & ' + names[1]) : names[0];
  const profile = {id, name, mode, names};
  const list = await loadProfileIndex();
  list.push(profile);
  await saveProfileIndex(list);
  return profile;
}
export async function setLastProfile(id, mode) {
  try { await storage.set(LAST_PROFILE_KEY, JSON.stringify({id, mode})); } catch (e) {}
}
export async function getLastProfile() {
  try { const r = await storage.get(LAST_PROFILE_KEY); if (r && r.value) return JSON.parse(r.value); } catch (e) {}
  return null;
}
export async function clearLastProfile() { try { await storage.delete(LAST_PROFILE_KEY); } catch (e) {} }

// Migre automatiquement une ancienne sauvegarde unique (avant le système de
// profils) vers un premier profil solo, et remet le compteur de jours à 1.
export async function migrateLegacySaveIfNeeded() {
  const list = await loadProfileIndex();
  if (list.length > 0) return;
  try {
    const r = await storage.get('island365-save');
    if (r && r.value) {
      const legacy = JSON.parse(r.value);
      const profile = await createProfile('solo', ['Joueur 1']);
      const migrated = freshState('solo');
      migrated.inventory = Object.assign(migrated.inventory, legacy.inventory || {});
      migrated.coins = legacy.coins || 0;
      migrated.appearance = Object.assign({}, migrated.appearance, legacy.appearance || {});
      // le jour redémarre à 1, comme demandé
      migrated.startDayIndex = realDayIndex();
      migrated.dayOffset = 0;
      migrated.completedDays = {};
      try { await storage.set('save-' + profile.id, JSON.stringify(migrated)); } catch (e) {}
      try { await storage.delete('island365-save'); } catch (e) {}
    }
  } catch (e) { /* pas d'ancienne sauvegarde */ }
}
