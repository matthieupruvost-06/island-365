// Coordonne l'état partagé (inventaire, pièces, mission du jour) entre les
// deux appareils quand on joue en ligne. Modèle volontairement simple : la
// personne qui a créé la partie ("hôte") est la seule source de vérité —
// c'est elle qui applique vraiment les changements et les renvoie à l'autre
// appareil ("invité·e"), qui se contente de les afficher. Ça évite tout
// désaccord entre les deux appareils sur "qui a eu quoi en premier".
import { session, scheduleSave, freshState } from './state.js';
import { world } from './world/runtime.js';
import * as network from './network.js';
import { refreshHUD, showToast } from './ui.js';
import { rebuildPlayerEntityMesh, makeRemoteEntity, setRemoteTarget } from './players.js';

export function isOnline() { return session.state.mode === 'online'; }
export function isHost() { return world.onlineRole === 'host'; }
export function isGuest() { return world.onlineRole === 'guest'; }

function maybeScheduleSave() {
  // L'invité·e ne possède pas la sauvegarde de cette partie (c'est celle de
  // l'hôte qui compte) : pas la peine d'écrire quoi que ce soit chez lui.
  if (!isOnline() || isHost()) scheduleSave();
}

export function snapshotSharedState() {
  return {
    inventory: session.state.inventory,
    coins: session.state.coins,
    dayOffset: session.state.dayOffset,
    startDayIndex: session.state.startDayIndex,
    completedDays: session.state.completedDays,
    players: session.state.players,
  };
}

export function applyStateSnapshot(snap) {
  const peerSlot = 1 - world.mySlot;
  const oldPeerLook = session.state.players && session.state.players[peerSlot] ? JSON.stringify(session.state.players[peerSlot].appearance) : null;
  Object.assign(session.state, snap);
  const newPeerLook = session.state.players && session.state.players[peerSlot] ? JSON.stringify(session.state.players[peerSlot].appearance) : null;
  const remote = world.players[1];
  // Si l'apparence de l'ami a changé, on reconstruit son personnage à
  // l'écran pour qu'on le voie avec son nouveau look sans attendre.
  if (remote && remote.remote && newPeerLook && newPeerLook !== oldPeerLook) {
    rebuildPlayerEntityMesh(world.scene, remote, session.state.players[peerSlot].appearance);
  }
  refreshHUD();
}

// Applique réellement un changement de partie. Ne s'occupe QUE des données
// partagées (inventaire/pièces/mission) — l'affichage (toast, fermeture de
// panneau) reste géré par qui a déclenché l'action, car c'est propre à son
// écran à elle/lui.
export function applySharedAction(action) {
  switch (action.type) {
    case 'deliverShop':
      if (session.state.completedDays[action.dayIndex]) return false; // déjà livrée aujourd'hui
      session.state.inventory[action.item] = Math.max(0, (session.state.inventory[action.item] || 0) - action.count);
      session.state.completedDays[action.dayIndex] = true;
      session.state.coins += action.reward;
      return true;
    case 'completeReach':
      // updateNearbyFor() peut redéclencher ça à chaque image tant qu'on
      // reste sur la zone : sans ce garde-fou, un aller-retour réseau lent
      // ferait gagner les pièces plusieurs fois de suite.
      if (session.state.completedDays[action.dayIndex]) return false;
      session.state.completedDays[action.dayIndex] = true;
      session.state.coins += action.reward;
      return true;
    case 'dayNext':
      session.state.dayOffset += 1;
      return true;
    case 'setAppearance':
      session.state.players[action.slot].appearance = action.appearance;
      return true;
    case 'collect': {
      const mesh = world.collectMeshes[action.index];
      if (!mesh || mesh.counted) return false; // déjà compté par l'autre appareil
      mesh.counted = true;
      mesh.taken = true;
      if (mesh.mesh.parent) world.scene.remove(mesh.mesh);
      session.state.inventory[action.item] = (session.state.inventory[action.item] || 0) + 1;
      return true;
    }
    default:
      return false;
  }
}

// Point d'entrée unique utilisé partout dans le jeu (solo, duo, en ligne)
// pour signaler "il vient de se passer un truc qui doit compter". En
// solo/duo, applique tout de suite en local, comme avant. En ligne : l'hôte
// applique et renvoie l'état à jour ; l'invité·e demande poliment à l'hôte
// de le faire et attend sa réponse.
export function dispatchAction(action) {
  if (isOnline() && !isHost()) {
    network.sendAction(action);
    return;
  }
  const applied = applySharedAction(action);
  if (applied === false) return;
  if (isOnline()) network.sendState(snapshotSharedState());
  refreshHUD();
  maybeScheduleSave();
}

/* ====================================================================
   CONNEXION : créer ou rejoindre une partie à deux
==================================================================== */
let onPeerConnected = null;
let handlersWired = false;

function wireNetworkHandlers() {
  if (handlersWired) return;
  handlersWired = true;

  network.on('peerJoin', () => {
    // Dès que quelqu'un se connecte (des deux côtés), on se présente.
    network.sendHello({ name: session.activeProfile && session.activeProfile.name, appearance: session.state.players[world.mySlot].appearance });
    if (isHost()) network.sendState(snapshotSharedState());
  });

  network.on('hello', (data) => {
    const isFirstHello = !world.peerName;
    world.peerName = data.name || (isHost() ? 'ton ami' : "l'hôte");
    const peerSlot = 1 - world.mySlot;
    if (data.appearance && session.state.players && session.state.players[peerSlot]) {
      session.state.players[peerSlot].appearance = data.appearance;
    }
    ensureRemoteEntity();
    if (onPeerConnected) { const cb = onPeerConnected; onPeerConnected = null; cb(data.name); }
    if (isFirstHello) showToast('🎉 ' + world.peerName + ' a rejoint la partie !');
  });

  network.on('peerLeave', () => {
    removeRemoteEntity();
    showToast('👋 ' + (world.peerName || 'Ton ami') + ' est parti — tu peux continuer à explorer.');
  });

  network.on('pos', (data) => {
    const remote = world.players[1];
    if (remote && remote.remote) setRemoteTarget(remote, data.x, data.y, data.z, data.heading);
  });

  network.on('state', (snap) => { if (!isHost()) applyStateSnapshot(snap); });

  network.on('collectTaken', ({ index }) => {
    const mesh = world.collectMeshes[index];
    if (mesh && !mesh.taken) { mesh.taken = true; if (mesh.mesh.parent) world.scene.remove(mesh.mesh); }
  });

  network.on('action', (action) => {
    if (!isHost()) return;
    const applied = applySharedAction(action);
    if (applied !== false) {
      network.sendState(snapshotSharedState());
      refreshHUD();
      maybeScheduleSave();
    }
  });
}

// Le profil (nouveau ou repris) est déjà sélectionné et chargé à ce stade
// (même écran "profil" que solo/duo, filtré sur le mode "online") — ici on
// se contente de générer un code et de se mettre à l'écoute. L'hôte peut
// commencer à jouer tout de suite, sans attendre que son ami se connecte.
export function startHosting() {
  world.onlineRole = 'host';
  world.mySlot = 0;
  wireNetworkHandlers();
  const code = network.generateRoomCode();
  world.onlineCode = code;
  network.connect(code);
  return code;
}

// Rejoint une partie existante : ne "réussit" (résout la promesse) qu'une
// fois vraiment connecté·e à l'hôte, pour afficher un état d'attente clair.
export function joinOnlineGame(name, code) {
  world.onlineRole = 'guest';
  world.mySlot = 1;
  session.activeProfile = { id: 'invite-' + Date.now().toString(36), name: name || 'Joueur 2', mode: 'online' };
  session.state = freshState('online');
  return new Promise((resolve) => {
    wireNetworkHandlers();
    onPeerConnected = resolve;
    network.connect(code);
  });
}

export function leaveOnlineGame() {
  network.disconnect();
  removeRemoteEntity();
  world.onlineRole = null;
  world.peerName = '';
}

// Construit le personnage de l'ami dans la scène 3D dès qu'on connaît son
// apparence ET que le monde a été construit (les deux ne sont pas toujours
// prêts en même temps : on peut recevoir sa présentation avant d'avoir
// soi-même appuyé sur "Commencer l'exploration").
export function ensureRemoteEntity() {
  if (!world.scene) return;
  if (world.players[1] && world.players[1].remote) return;
  const peerSlot = 1 - world.mySlot;
  const info = session.state.players && session.state.players[peerSlot];
  if (!info) return;
  const entity = makeRemoteEntity(world.scene, info.appearance, info.pos || { x: 3, y: 0, z: 82 });
  world.players[1] = entity;
}
function removeRemoteEntity() {
  const remote = world.players[1];
  if (remote && remote.remote) {
    if (world.scene) world.scene.remove(remote.mesh);
    world.players.splice(1, 1);
  }
}

let posAccum = 0;
export function tickPositionSync(dt) {
  if (!isOnline() || !network.isConnected()) return;
  posAccum += dt;
  if (posAccum < 0.1) return;
  posAccum = 0;
  const me = world.players[0];
  if (!me) return;
  network.sendPos({ x: me.mesh.position.x, y: me.mesh.position.y, z: me.mesh.position.z, heading: me.heading });
}
