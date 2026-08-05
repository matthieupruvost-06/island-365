import * as THREE from 'three';
import {
  SKIN_COLORS, HAIR_COLORS, EYE_COLORS, SHIRT_COLORS, PANTS_COLORS, HAT_COLORS, HAIR_STYLES
} from './config.js';
import { session, scheduleSave } from './state.js';
import { world } from './world/runtime.js';
import { rebuildPlayerEntityMesh } from './players.js';
import { openPanel, closePanel } from './ui.js';
import { dispatchAction, isOnline } from './sync.js';

function stdMat(color, opts) {
  opts = opts || {};
  return new THREE.MeshStandardMaterial(Object.assign({color, flatShading:true, roughness:0.8}, opts));
}

export function buildCharacterMesh(app) {
  const g = new THREE.Group();
  const skin = stdMat(app.skin);
  const hairMat = stdMat(app.hairColor);

  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.62,8), stdMat(app.pants));
  legs.position.y = 0.34; g.add(legs);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.3,0.72,8), stdMat(app.shirt));
  torso.position.y = 1.02; g.add(torso);

  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.62,6), skin);
  armL.position.set(-0.46,1.02,0); armL.rotation.z = 0.12; g.add(armL);
  const armR = armL.clone(); armR.position.x = 0.46; armR.rotation.z = -0.12; g.add(armR);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34,10,8), skin);
  head.position.y = 1.62; g.add(head);

  const eyeGeo = new THREE.SphereGeometry(0.05,6,6);
  const eyeMat = stdMat(app.eyes, {roughness:0.4});
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.12,1.64,0.29); g.add(eyeL);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.12; g.add(eyeR);

  if (app.hairStyle === 'court') {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.36,10,8,0,Math.PI*2,0,Math.PI*0.55), hairMat);
    dome.position.y = 1.68; g.add(dome);
  } else if (app.hairStyle === 'carre') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.37,10,8,0,Math.PI*2,0,Math.PI*0.62), hairMat);
    cap.position.y = 1.67; g.add(cap);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.62,0.42,0.5), hairMat);
    back.position.set(0,1.5,-0.06); g.add(back);
  } else if (app.hairStyle === 'frise') {
    for (let i=0; i<7; i++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15,0), hairMat);
      const a = (i/7)*Math.PI*2;
      puff.position.set(Math.cos(a)*0.26, 1.78+Math.sin(i*1.7)*0.05, Math.sin(a)*0.26);
      g.add(puff);
    }
  }

  if (app.hat) {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.06,10), stdMat(app.hatColor));
    brim.position.y = 1.92; g.add(brim);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.3,0.3,10), stdMat(app.hatColor));
    top.position.y = 2.08; g.add(top);
  }

  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}

/* ====================================================================
   CRÉATEUR DE PERSONNAGE
==================================================================== */
let pvRenderer, pvScene, pvCamera, pvMesh, pvRAF = null, pvSpinning = true;
let charEditingIndex = 0; // 0 = Joueur 1, 1 = Joueur 2 (duo uniquement)

function activeAppearanceRef() {
  const mode = session.activeProfile && session.activeProfile.mode;
  if (mode === 'duo') return session.state.players[charEditingIndex].appearance;
  // En ligne, chacun ne modifie que son propre personnage — pas de bascule
  // Joueur 1/Joueur 2, "mon" slot dépend de si je suis l'hôte ou l'invité·e.
  if (mode === 'online') return session.state.players[world.mySlot].appearance;
  return session.state.appearance;
}
function setupPreview() {
  const canvas = document.getElementById('char-preview-canvas');
  pvRenderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  pvRenderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  pvRenderer.setSize(220,220,false);
  pvRenderer.outputColorSpace = THREE.SRGBColorSpace;
  pvRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  pvScene = new THREE.Scene();
  pvCamera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  pvCamera.position.set(0,1.35,4.4); pvCamera.lookAt(0,1.1,0);
  pvScene.add(new THREE.HemisphereLight(0xffffff,0x557755,1.0));
  const sun = new THREE.DirectionalLight(0xffffff,0.8); sun.position.set(3,5,4); pvScene.add(sun);
  refreshPreviewMesh();
}
function refreshPreviewMesh() {
  if (!pvScene) return;
  if (pvMesh) pvScene.remove(pvMesh);
  pvMesh = buildCharacterMesh(activeAppearanceRef());
  pvScene.add(pvMesh);
}
function startPreviewLoop() {
  pvSpinning = true;
  if (pvRAF) cancelAnimationFrame(pvRAF);
  const loop = () => {
    if (!pvSpinning) return;
    if (pvMesh) pvMesh.rotation.y += 0.012;
    pvRenderer.render(pvScene, pvCamera);
    pvRAF = requestAnimationFrame(loop);
  };
  loop();
}
function stopPreviewLoop() { pvSpinning = false; if (pvRAF) cancelAnimationFrame(pvRAF); }

function swatchRow(containerId, colors, getValue, setValue) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  colors.forEach(hex => {
    const b = document.createElement('button');
    b.className = 'swatch' + (getValue() === hex ? ' selected' : '');
    b.style.background = hex; b.type = 'button';
    b.addEventListener('click', () => { setValue(hex); renderCharacterPanel(); onAppearanceChanged(); });
    el.appendChild(b);
  });
}
function styleRow() {
  const el = document.getElementById('row-hairstyle');
  el.innerHTML = '';
  const app = activeAppearanceRef();
  HAIR_STYLES.forEach(s => {
    const b = document.createElement('button');
    b.className = 'style-pill' + (app.hairStyle === s.key ? ' selected' : '');
    b.type = 'button'; b.textContent = s.label;
    b.addEventListener('click', () => { app.hairStyle = s.key; renderCharacterPanel(); onAppearanceChanged(); });
    el.appendChild(b);
  });
}
function renderCharacterPanel() {
  const isDuo = session.activeProfile && session.activeProfile.mode === 'duo';
  document.getElementById('player-toggle-row').classList.toggle('show', !!isDuo);
  if (isDuo) {
    document.getElementById('edit-p1-btn').classList.toggle('selected', charEditingIndex === 0);
    document.getElementById('edit-p2-btn').classList.toggle('selected', charEditingIndex === 1);
    document.getElementById('edit-p1-btn').textContent = '🙂 ' + (session.activeProfile.names[0] || 'Joueur 1');
    document.getElementById('edit-p2-btn').textContent = '🙂 ' + (session.activeProfile.names[1] || 'Joueur 2');
  }
  const app = activeAppearanceRef();
  swatchRow('row-skin', SKIN_COLORS, () => app.skin, v => app.skin = v);
  styleRow();
  swatchRow('row-haircolor', HAIR_COLORS, () => app.hairColor, v => app.hairColor = v);
  swatchRow('row-eyes', EYE_COLORS, () => app.eyes, v => app.eyes = v);
  swatchRow('row-shirt', SHIRT_COLORS, () => app.shirt, v => app.shirt = v);
  swatchRow('row-pants', PANTS_COLORS, () => app.pants, v => app.pants = v);
  swatchRow('row-hatcolor', HAT_COLORS, () => app.hatColor, v => app.hatColor = v);
  const toggle = document.getElementById('hat-toggle');
  toggle.classList.toggle('on', !!app.hat);
  document.getElementById('row-hatcolor').style.opacity = app.hat ? '1' : '.35';
  document.getElementById('row-hatcolor').style.pointerEvents = app.hat ? 'auto' : 'none';
}
function onAppearanceChanged() {
  refreshPreviewMesh();
  // En ligne, world.players[0] est toujours MON personnage (peu importe si
  // je suis l'hôte ou l'invité·e) — c'est la convention utilisée partout
  // ailleurs pour brancher le joystick local sur la bonne entité.
  const localIndex = isOnline() ? 0 : charEditingIndex;
  if (world.players[localIndex]) rebuildPlayerEntityMesh(world.scene, world.players[localIndex], activeAppearanceRef());
  if (isOnline()) {
    dispatchAction({ type:'setAppearance', slot: world.mySlot, appearance: activeAppearanceRef() });
  } else {
    scheduleSave();
  }
}

export function initCharacterCreator() {
  document.getElementById('hat-toggle').addEventListener('click', () => {
    const app = activeAppearanceRef(); app.hat = !app.hat; renderCharacterPanel(); onAppearanceChanged();
  });
  document.getElementById('edit-p1-btn').addEventListener('click', () => { charEditingIndex = 0; renderCharacterPanel(); refreshPreviewMesh(); });
  document.getElementById('edit-p2-btn').addEventListener('click', () => { charEditingIndex = 1; renderCharacterPanel(); refreshPreviewMesh(); });
  document.getElementById('char-done-btn').addEventListener('click', () => { closePanel('panel-character'); stopPreviewLoop(); });
  document.getElementById('panel-character').querySelector('.sheet-close').addEventListener('click', stopPreviewLoop);
  document.getElementById('panel-character').addEventListener('click', e => { if (e.target.id === 'panel-character') stopPreviewLoop(); });
}

export function openCharacterPanel() {
  charEditingIndex = 0;
  if (!pvRenderer) setupPreview(); else refreshPreviewMesh();
  renderCharacterPanel();
  startPreviewLoop();
  openPanel('panel-character');
}
