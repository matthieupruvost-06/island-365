// Sauvegarde de secours : le jeu persiste déjà tout dans localStorage, mais
// localStorage reste local à cet appareil/navigateur (aucune garantie
// absolue en cas de réinstallation, de changement de téléphone ou de
// nettoyage du stockage par l'utilisateur). Ces fonctions permettent
// d'exporter toutes les données de jeu dans un fichier, et de les
// réimporter plus tard — sur ce même appareil ou un autre.

const BACKUP_APP_ID = 'island365';
const BACKUP_VERSION = 1;

function collectSaveData() {
  const data = {};
  const profileIndexRaw = localStorage.getItem('profile-index');
  const lastProfileRaw = localStorage.getItem('last-profile');
  if (profileIndexRaw !== null) data['profile-index'] = profileIndexRaw;
  if (lastProfileRaw !== null) data['last-profile'] = lastProfileRaw;

  let profiles = [];
  try { profiles = profileIndexRaw ? JSON.parse(profileIndexRaw) : []; } catch (e) { profiles = []; }
  for (const p of profiles) {
    const raw = localStorage.getItem('save-' + p.id);
    if (raw !== null) data['save-' + p.id] = raw;
  }
  return data;
}

export function exportBackup() {
  const payload = {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: collectSaveData(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `island365-sauvegarde-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importBackupFromFile(file) {
  const text = await file.text();
  let payload;
  try { payload = JSON.parse(text); } catch (e) { throw new Error('ce fichier n\'est pas un JSON valide'); }
  if (!payload || payload.app !== BACKUP_APP_ID || !payload.data || typeof payload.data !== 'object') {
    throw new Error('ce fichier ne ressemble pas à une sauvegarde Island 365');
  }
  for (const [key, value] of Object.entries(payload.data)) {
    if (typeof value !== 'string') continue;
    localStorage.setItem(key, value);
  }
}
