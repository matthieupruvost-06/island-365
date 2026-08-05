// Remplace window.storage.* (API propre aux artifacts Claude.ai, absente une
// fois le jeu déployé) par une persistance réelle dans localStorage, derrière
// la même interface asynchrone get/set/delete/list. Les clés utilisées par le
// reste du jeu (profile-index, last-profile, save-<id>, island365-save) sont
// reproduites telles quelles.

export async function get(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return { value: raw };
  } catch (e) {
    return null;
  }
}

export async function set(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* stockage indisponible (navigation privée, quota...) : on ignore */
  }
}

async function del(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    /* ignore */
  }
}
export { del as delete };

export async function list(prefix) {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) out.push(k);
    }
  } catch (e) {
    /* ignore */
  }
  return out;
}
