import './styles.css';
import * as THREE from 'three';
import { world } from './world/runtime.js';
import { buildSky, buildClouds } from './world/sky.js';
import { buildMainTerrain } from './world/terrain.js';
import { buildOcean, animateWater } from './world/ocean.js';
import { scatter, makePalm, makePine, makeJungleTree, makeRock, makeFlower, makeBush, makeSeashell, makeDriftwood, makeGrassTuft, makeParasol, makeBeachTowel, makeLounger } from './world/decor.js';
import { makeRabbit, makeBird, makeDeer, makeSheep } from './world/animals.js';
import { buildIslets } from './world/islets.js';
import { buildWaterfall, buildMineEntrance, buildDock } from './world/landmarks.js';
import { buildVillage } from './world/village.js';
import { scatterCollectibles, updateCollectibles } from './world/collectibles.js';
import { rng } from './rng.js';
import { makePlayerEntity, updateAllPlayers, updateCamera, setupJoystick, withinMainBounds, groundHeightHere } from './players.js';
import { updateNearbyFor, completeReachMission } from './missions.js';
import { initCharacterCreator, openCharacterPanel } from './character.js';
import {
  refreshHUD, setupMinimap, drawMinimap, showToast, openPanel, closePanel,
  show, hide, goToProfilePicker, createAndSelectProfile, selectProfile,
  refreshInventoryPanel, openShopPanel, openBoatPanel, setSelectedMode,
  openMissionPanel, openMapPanel
} from './ui.js';
import { session, scheduleSave, saveGame, freshState } from './state.js';
import { loadProfileIndex, getLastProfile, clearLastProfile, migrateLegacySaveIfNeeded } from './profiles.js';
import { exportBackup, importBackupFromFile } from './backup.js';
import { tickPositionSync, ensureRemoteEntity, joinOnlineGame, isHost } from './sync.js';
import { advanceDayPhase } from './world/daynight.js';

/* ---------------------- Init monde ---------------------- */
function initWorld() {
  world.scene = new THREE.Scene();
  world.scene.background = new THREE.Color(0xcdf3ee);
  world.scene.fog = new THREE.Fog(0xcdf3ee, 90, 340);

  world.camera = new THREE.PerspectiveCamera(58, window.innerWidth/window.innerHeight, 0.1, 700);

  world.renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
  world.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  world.renderer.setSize(window.innerWidth, window.innerHeight);
  world.renderer.shadowMap.enabled = true;
  world.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  world.renderer.outputColorSpace = THREE.SRGBColorSpace;
  world.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  world.renderer.toneMappingExposure = 1.08;
  document.getElementById('canvas-holder').appendChild(world.renderer.domElement);

  world.hemiLight = new THREE.HemisphereLight(0xbdf0ff, 0x3a6b45, 0.9);
  world.scene.add(world.hemiLight);
  world.sunLight = new THREE.DirectionalLight(0xfff3da, 1.05);
  world.sunLight.position.set(70,110,40);
  world.sunLight.castShadow = true;
  world.sunLight.shadow.mapSize.set(1536,1536);
  world.sunLight.shadow.camera.left=-140; world.sunLight.shadow.camera.right=140;
  world.sunLight.shadow.camera.top=140; world.sunLight.shadow.camera.bottom=-140;
  world.sunLight.shadow.camera.near=1; world.sunLight.shadow.camera.far=320;
  world.sunLight.shadow.bias=-0.0018;
  world.scene.add(world.sunLight); world.scene.add(world.sunLight.target);
  world.ambientLight = new THREE.AmbientLight(0xffffff,0.22);
  world.scene.add(world.ambientLight);

  buildSky(world.scene); buildClouds(world.scene); buildMainTerrain(world.scene);
  const ocean = buildOcean(world.scene);
  world.waterMesh = ocean.waterMesh; world.waterGeo = ocean.waterGeo;
  buildIslets(world.scene);
  buildWaterfall(world.scene); buildMineEntrance(world.scene);
  world.boatMesh = buildDock(world.scene);
  world.shopMeshes = buildVillage(world.scene);

  scatter(world.scene, 64, makePalm, [-104,104], [48,116]);
  scatter(world.scene, 100, () => rng()<0.5 ? makeFlower() : makeRock(), [-85,85], [5,46]);
  scatter(world.scene, 65, makeBush, [-85,85], [5,46]);
  scatter(world.scene, 110, makePine, [-110,-24], [-108,-24]);
  scatter(world.scene, 34, makeRock, [-110,-24], [-108,-24]);
  scatter(world.scene, 42, makeBush, [-110,-24], [-108,-24]);
  scatter(world.scene, 100, makeJungleTree, [-20,108], [-108,-24]);
  scatter(world.scene, 26, makeRock, [-20,108], [-108,-24]);
  scatter(world.scene, 48, makeBush, [-20,108], [-108,-24]);
  // Bordure de plage : coquillages et bois flotté, pour un rendu plus vivant
  // là où la mer rencontre le sable (tout autour de la nouvelle côte).
  scatter(world.scene, 60, makeSeashell, [-104,104], [50,118]);
  scatter(world.scene, 18, makeDriftwood, [-104,104], [50,118]);
  scatter(world.scene, 70, makeGrassTuft, [-85,85], [5,46]);
  // Petit coin cocooning sur la plage : parasols colorés, serviettes, et
  // quelques palmiers en plus juste à cet endroit pour un vrai coin détente.
  scatter(world.scene, 10, makeParasol, [-95,95], [54,100]);
  scatter(world.scene, 14, makeBeachTowel, [-95,95], [54,100]);
  scatter(world.scene, 16, makePalm, [-95,95], [54,100]);
  scatter(world.scene, 12, makeLounger, [-95,95], [54,100]);

  // Un peu de vie dans les bois : petits animaux décoratifs, dispersés
  // dans la forêt de pins (avec la mine) et dans la jungle.
  scatter(world.scene, 7, makeRabbit, [-96,-24], [-90,-24]);
  scatter(world.scene, 6, makeBird, [-96,-24], [-90,-24]);
  scatter(world.scene, 3, makeDeer, [-96,-30], [-85,-30]);
  // Des moutons tranquilles dans la prairie, pour l'ambiance.
  scatter(world.scene, 7, makeSheep, [-85,85], [5,46]);
  scatter(world.scene, 9, makeRabbit, [-20,90], [-90,-24]);
  scatter(world.scene, 8, makeBird, [-20,90], [-90,-24]);

  // Si le jeu a été fermé pendant qu'on était sur un îlot, on retrouve la
  // bonne zone (et donc la bonne hauteur de sol) au lieu de réapparaître
  // dans le vide au-dessus de l'océan.
  world.currentArea = session.state.currentArea || 'main';

  world.players = [];
  if (session.state.mode === 'duo') {
    world.players.push(makePlayerEntity(world.scene, session.state.players[0].appearance, session.state.players[0].pos));
    world.players.push(makePlayerEntity(world.scene, session.state.players[1].appearance, session.state.players[1].pos));
    world.players[0].useKeyboard = true;
  } else if (session.state.mode === 'online') {
    // world.players[0] est toujours MON personnage sur cet appareil (même
    // si, dans la sauvegarde partagée, je suis "l'invité·e" au slot 1).
    const mine = session.state.players[world.mySlot];
    world.players.push(makePlayerEntity(world.scene, mine.appearance, mine.pos));
    world.players[0].useKeyboard = true;
    ensureRemoteEntity(); // au cas où l'ami se soit déjà présenté avant qu'on lance le monde
  } else {
    world.players.push(makePlayerEntity(world.scene, session.state.appearance, session.state.playerPos));
    world.players[0].useKeyboard = true;
  }

  // Filet de sécurité : si une ancienne sauvegarde a laissé quelqu'un
  // "coincé" hors des limites de l'île principale (par exemple restée d'un
  // séjour sur un îlot jamais mémorisé), on le replace gentiment sur la
  // plage de départ plutôt que de le laisser bloqué dans le vide.
  if (world.currentArea === 'main') {
    world.players.forEach(p => {
      if (p.remote) return;
      if (!withinMainBounds(p.mesh.position.x, p.mesh.position.z)) {
        p.mesh.position.set(0, groundHeightHere(0,82), 82);
      }
    });
  }

  world.clock = new THREE.Clock();
  window.addEventListener('resize', onResize);
}
function onResize() {
  if (!world.camera || !world.renderer) return;
  world.camera.aspect = window.innerWidth/window.innerHeight;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ---------------------- Boucle principale ---------------------- */
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, world.clock.getDelta());
  const t = world.clock.elapsedTime;

  updateAllPlayers(dt);
  updateCamera(dt);
  updateCollectibles(dt,t);
  tickPositionSync(dt);
  if (world.players[0]) updateNearbyFor(world.players[0], document.getElementById('action-btn'), document.getElementById('action-label'));
  // Le bouton d'action du joueur 2 n'existe que pour le vrai mode Duo local
  // (deux joysticks sur le même écran) — en ligne, world.players[1] est le
  // reflet de l'ami distant, pas quelqu'un qui appuie sur ce bouton-ci.
  if (session.state.mode === 'duo' && world.players[1]) updateNearbyFor(world.players[1], document.getElementById('action-btn-p2'), document.getElementById('action-label-p2'));
  animateWater(t, world.waterGeo);
  drawMinimap();

  world.renderer.render(world.scene, world.camera);
}

/* ---------------------- Wiring de l'écran d'accueil / HUD / panneaux ---------------------- */
document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closePanel(btn.dataset.close)));
document.querySelectorAll('.panel-backdrop').forEach(p => p.addEventListener('click', e => { if (e.target===p) closePanel(p.id); }));

document.getElementById('mode-solo-btn').addEventListener('click', () => { setSelectedMode('solo'); goToProfilePicker(); });
document.getElementById('mode-duo-btn').addEventListener('click', () => { setSelectedMode('duo'); goToProfilePicker(); });
document.getElementById('back-to-mode-btn').addEventListener('click', () => { hide('profile-picker'); show('mode-picker'); });

/* ----- En ligne : héberger (repris depuis l'écran profil habituel) ----- */
document.getElementById('mode-online-btn').addEventListener('click', () => { hide('mode-picker'); show('online-choice'); });
document.getElementById('online-choice-back-btn').addEventListener('click', () => { hide('online-choice'); show('mode-picker'); });
document.getElementById('online-host-btn').addEventListener('click', () => {
  setSelectedMode('online');
  hide('online-choice');
  goToProfilePicker();
});

/* ----- En ligne : rejoindre avec un code ----- */
document.getElementById('online-join-btn').addEventListener('click', () => { hide('online-choice'); show('online-join'); });
document.getElementById('online-join-back-btn').addEventListener('click', () => { hide('online-join'); show('online-choice'); });
document.getElementById('online-join-confirm-btn').addEventListener('click', async () => {
  const name = (document.getElementById('online-join-name').value||'').trim().slice(0,16) || 'Joueur 2';
  const code = (document.getElementById('online-join-code').value||'').trim().toUpperCase();
  const statusEl = document.getElementById('online-join-status');
  if (code.length < 4) { statusEl.textContent = 'Entre le code à 4 lettres que ton ami t\'a donné.'; return; }
  statusEl.textContent = 'Connexion en cours…';
  document.getElementById('online-join-confirm-btn').disabled = true;
  const slowHintTimer = setTimeout(() => {
    statusEl.textContent = "Ça prend du temps… vérifie que vous avez bien tapé le même code, chacun de votre côté.";
  }, 15000);
  try {
    const hostName = await joinOnlineGame(name, code);
    clearTimeout(slowHintTimer);
    document.getElementById('active-profile-label').textContent = `Profil : ${name} · Connecté·e avec ${hostName || "l'hôte"}`;
    hide('online-join'); hide('mode-picker'); show('main-start-actions');
  } finally {
    document.getElementById('online-join-confirm-btn').disabled = false;
  }
});

document.getElementById('import-save-btn').addEventListener('click', () => {
  document.getElementById('import-save-input').click();
});
document.getElementById('import-save-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (!confirm('Restaurer cette sauvegarde ? Elle remplacera les profils et parties déjà présents sur cet appareil.')) return;
  try {
    await importBackupFromFile(file);
    alert('Sauvegarde restaurée ! Le jeu va se recharger.');
    location.reload();
  } catch (err) {
    alert("Impossible de lire ce fichier de sauvegarde : " + err.message);
  }
});

document.getElementById('new-profile-btn').addEventListener('click', async () => {
  const n1 = (document.getElementById('name-input-1').value||'').trim().slice(0,16) || 'Joueur 1';
  const n2 = (document.getElementById('name-input-2').value||'').trim().slice(0,16) || 'Joueur 2';
  await createAndSelectProfile(n1, n2);
  document.getElementById('name-input-1').value=''; document.getElementById('name-input-2').value='';
});

document.getElementById('switch-profile-btn').addEventListener('click', async () => {
  await clearLastProfile();
  hide('main-start-actions'); show('mode-picker');
});
document.getElementById('export-save-btn').addEventListener('click', () => exportBackup());
document.getElementById('btn-switch-hud').addEventListener('click', async () => {
  if (confirm("Changer de profil ou de mode ? Ta progression vient d'être sauvegardée.")) {
    await saveGame();
    await clearLastProfile();
    location.reload();
  }
});
document.getElementById('btn-inventory').addEventListener('click', () => { refreshInventoryPanel(); openPanel('panel-inventory'); });
document.getElementById('btn-time').addEventListener('click', () => {
  const phase = advanceDayPhase();
  document.getElementById('btn-time').textContent = phase.emoji;
  showToast(phase.emoji + ' ' + phase.label);
});
document.getElementById('mission-toggle-btn').addEventListener('click', openMissionPanel);
document.getElementById('btn-map').addEventListener('click', openMapPanel);
document.getElementById('btn-day').addEventListener('click', () => {
  session.state.dayOffset += 1;
  showToast('☀️ Un nouveau jour se lève sur Island 365');
  refreshHUD(); scheduleSave();
});
document.getElementById('reset-link').addEventListener('click', async (e) => {
  e.preventDefault();
  if (confirm('Recommencer toute la progression de ce profil depuis le début ?')) {
    session.state = freshState(session.activeProfile.mode);
    await saveGame();
    location.reload();
  }
});

document.getElementById('action-btn').addEventListener('click', () => {
  const p = world.players[0]; if (!p || !p.nearest) return;
  if (p.nearest.type==='shop') openShopPanel(p.nearest.data);
  else if (p.nearest.type==='boat') openBoatPanel();
  else if (p.nearest.type==='reach') completeReachMission(p.nearest.data);
});
document.getElementById('action-btn-p2').addEventListener('click', () => {
  const p = world.players[1]; if (!p || !p.nearest) return;
  if (p.nearest.type==='shop') openShopPanel(p.nearest.data);
  else if (p.nearest.type==='boat') openBoatPanel();
  else if (p.nearest.type==='reach') completeReachMission(p.nearest.data);
});

document.getElementById('customize-btn').addEventListener('click', openCharacterPanel);
document.getElementById('btn-character').addEventListener('click', openCharacterPanel);

document.getElementById('play-btn').addEventListener('click', async () => {
  document.getElementById('loading-line').textContent = "préparation de l'île…";
  try {
    initWorld();
    setupJoystick('joystick-zone','joy-nub', world.players[0].input);
    if (session.state.mode === 'duo') setupJoystick('joystick-zone-p2','joy-nub-p2', world.players[1].input);
    setupJoystick('joystick-zone-cam','joy-nub-cam', world.camInput, 28);
    setupMinimap();
    refreshHUD();
    world.collectMeshes = scatterCollectibles(world.scene);
    document.getElementById('hud').classList.toggle('duo', session.state.mode==='duo');
    document.getElementById('start-screen').style.display='none';
    document.getElementById('hud').style.display='block';
    if (session.state.mode === 'online' && isHost() && world.onlineCode) {
      showToast('🔑 Ton code ami : ' + world.onlineCode);
    }
    animate();
  } catch (err) {
    document.getElementById('loading-line').textContent = 'Oups, une erreur est survenue : ' + (err && err.message ? err.message : err);
    console.error(err);
  }
});

initCharacterCreator();

/* ---------------------- Démarrage ---------------------- */
(async function boot() {
  await migrateLegacySaveIfNeeded();
  const last = await getLastProfile();
  if (last) {
    const list = await loadProfileIndex();
    const p = list.find(x => x.id===last.id);
    if (p) { setSelectedMode(p.mode); await selectProfile(p); return; }
  }
  // sinon, l'écran de choix du mode (déjà visible par défaut) reste affiché
})();
