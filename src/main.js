import './styles.css';
import * as THREE from 'three';
import { world } from './world/runtime.js';
import { buildSky } from './world/sky.js';
import { buildMainTerrain } from './world/terrain.js';
import { buildOcean, animateWater } from './world/ocean.js';
import { scatter, makePalm, makePine, makeJungleTree, makeRock, makeFlower } from './world/decor.js';
import { buildIslets } from './world/islets.js';
import { buildWaterfall, buildMineEntrance, buildDock } from './world/landmarks.js';
import { buildVillage } from './world/village.js';
import { scatterCollectibles, updateCollectibles } from './world/collectibles.js';
import { rng } from './rng.js';
import { makePlayerEntity, updateAllPlayers, updateCamera, setupJoystick } from './players.js';
import { updateNearbyFor, completeReachMission } from './missions.js';
import { initCharacterCreator, openCharacterPanel } from './character.js';
import {
  refreshHUD, setupMinimap, drawMinimap, showToast, openPanel, closePanel,
  show, hide, goToProfilePicker, createAndSelectProfile, selectProfile,
  refreshInventoryPanel, openShopPanel, openBoatPanel, setSelectedMode
} from './ui.js';
import { session, scheduleSave, saveGame, freshState } from './state.js';
import { loadProfileIndex, getLastProfile, clearLastProfile, migrateLegacySaveIfNeeded } from './profiles.js';
import { exportBackup, importBackupFromFile } from './backup.js';

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

  world.scene.add(new THREE.HemisphereLight(0xbdf0ff, 0x3a6b45, 0.9));
  world.sunLight = new THREE.DirectionalLight(0xfff3da, 1.05);
  world.sunLight.position.set(70,110,40);
  world.sunLight.castShadow = true;
  world.sunLight.shadow.mapSize.set(1536,1536);
  world.sunLight.shadow.camera.left=-140; world.sunLight.shadow.camera.right=140;
  world.sunLight.shadow.camera.top=140; world.sunLight.shadow.camera.bottom=-140;
  world.sunLight.shadow.camera.near=1; world.sunLight.shadow.camera.far=320;
  world.sunLight.shadow.bias=-0.0018;
  world.scene.add(world.sunLight); world.scene.add(world.sunLight.target);
  world.scene.add(new THREE.AmbientLight(0xffffff,0.22));

  buildSky(world.scene); buildMainTerrain(world.scene);
  const ocean = buildOcean(world.scene);
  world.waterMesh = ocean.waterMesh; world.waterGeo = ocean.waterGeo;
  buildIslets(world.scene);
  buildWaterfall(world.scene); buildMineEntrance(world.scene);
  world.boatMesh = buildDock(world.scene);
  world.shopMeshes = buildVillage(world.scene);

  scatter(world.scene, 40, makePalm, [-90,90], [48,96]);
  scatter(world.scene, 90, () => rng()<0.5 ? makeFlower() : makeRock(), [-75,75], [5,46]);
  scatter(world.scene, 90, makePine, [-96,-24], [-90,-24]);
  scatter(world.scene, 28, makeRock, [-96,-24], [-90,-24]);
  scatter(world.scene, 85, makeJungleTree, [-20,90], [-90,-24]);
  scatter(world.scene, 22, makeRock, [-20,90], [-90,-24]);

  world.players = [];
  if (session.state.mode === 'duo') {
    world.players.push(makePlayerEntity(world.scene, session.state.players[0].appearance, session.state.players[0].pos));
    world.players.push(makePlayerEntity(world.scene, session.state.players[1].appearance, session.state.players[1].pos));
    world.players[0].useKeyboard = true;
  } else {
    world.players.push(makePlayerEntity(world.scene, session.state.appearance, session.state.playerPos));
    world.players[0].useKeyboard = true;
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
  if (world.players[0]) updateNearbyFor(world.players[0], document.getElementById('action-btn'), document.getElementById('action-label'));
  if (world.players[1]) updateNearbyFor(world.players[1], document.getElementById('action-btn-p2'), document.getElementById('action-label-p2'));
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
    setupMinimap();
    refreshHUD();
    world.collectMeshes = scatterCollectibles(world.scene);
    document.getElementById('hud').classList.toggle('duo', session.state.mode==='duo');
    document.getElementById('start-screen').style.display='none';
    document.getElementById('hud').style.display='block';
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
