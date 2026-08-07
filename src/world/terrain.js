import * as THREE from 'three';
import { MOUNTAIN_PEAK, PEAK2_POS, CAVE_POS, MINE_POS } from '../config.js';

export function angleOf(x, z) { return Math.atan2(x, z); }
export function islandRadius(angle) { return 114 + 12*Math.sin(angle*3) + 6*Math.sin(angle*5+1.3); }
export function lerp(a, b, t) { return a + (b - a) * t; }

// Petit bruit pseudo-aléatoire (mais toujours pareil pour les mêmes x,z) pour
// que le sol ne soit pas d'une couleur parfaitement uniforme — un rendu un
// peu plus naturel, sans casser le style "low poly" du jeu.
function colorNoise(x, z) {
  const s1 = Math.sin(x*12.9898 + z*78.233) * 43758.5453;
  const n1 = (s1 - Math.floor(s1)) * 0.16 - 0.08; // grosses taches, ±0.08
  const s2 = Math.sin(x*53.12 + z*91.7) * 21391.2;
  const n2 = (s2 - Math.floor(s2)) * 0.06 - 0.03; // petit grain fin, ±0.03
  return n1 + n2;
}

// Petite texture "grain" générée une seule fois (pas de fichier à
// télécharger) et répétée sur tout le sol : ça casse l'effet "plastique
// uniforme" du low poly, sans changer le style du jeu.
let _groundTex = null;
export function groundNoiseTexture() {
  if (_groundTex) return _groundTex;
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,128,128);
  for (let i=0; i<2600; i++) {
    const x = Math.random()*128, y = Math.random()*128;
    const v = 185 + Math.random()*70;
    ctx.fillStyle = `rgba(${v|0},${v|0},${v|0},${(0.12+Math.random()*0.22).toFixed(2)})`;
    ctx.fillRect(x, y, 1+Math.random(), 1+Math.random());
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(90, 90);
  _groundTex = tex;
  return tex;
}

export function terrainInfo(x, z) {
  const dist = Math.sqrt(x*x + z*z);
  const R = islandRadius(angleOf(x, z));
  if (dist > R + 2) { return {h:-3.0, c:[0.06,0.42,0.46]}; }
  let h = 0, c = [0.93,0.82,0.58];

  if (z > 50) {
    h = 0.3 + Math.sin(x*0.1)*0.2; c = [0.95,0.85,0.62];
  } else if (z > 4) {
    h = 0.6 + Math.sin(x*0.07+z*0.05)*0.5; c = [0.55,0.78,0.42];
    const riv1 = x - (Math.sin(z*0.08)*16);
    const riv2 = x - (Math.sin(z*0.08)*16) - 40;
    if (Math.abs(riv1) < 2.4 || Math.abs(riv2) < 2.4) { h = -0.4; c=[0.2,0.55,0.65]; }
  } else if (z > -22 && Math.abs(x) < 48) {
    h = 0.9; c = [0.80,0.70,0.48];
  } else if (z <= -22 && x < -22) {
    h = 1.0 + Math.sin(x*0.13)*0.6 + Math.sin(z*0.1)*0.6; c = [0.16,0.38,0.24];
    const dm = Math.hypot(x-MINE_POS.x, z-MINE_POS.z);
    if (dm < 10) { h = 0.4; c=[0.25,0.22,0.20]; }
  } else if (z <= -22 && x >= -22 && x < 56) {
    h = 0.8 + Math.sin(x*0.12)*0.5 + Math.sin(z*0.13)*0.5; c = [0.10,0.33,0.20];
  } else {
    h = 0.7; c = [0.30,0.38,0.30];
  }

  const dPeak = Math.hypot(x-MOUNTAIN_PEAK.x, z-MOUNTAIN_PEAK.z);
  const bump = 34*Math.exp(-(dPeak*dPeak)/650);
  if (bump > 0.4) {
    h += bump;
    const t = Math.min(1, bump/26);
    c = [ lerp(c[0],0.95,t), lerp(c[1],0.97,t), lerp(c[2],0.98,t) ];
  }
  const dPeak2 = Math.hypot(x-PEAK2_POS.x, z-PEAK2_POS.z);
  h += (14*Math.exp(-(dPeak2*dPeak2)/347))*0.6;

  const dMineFloor = Math.hypot(x-MINE_POS.x-5, z-MINE_POS.z-2);
  if (dMineFloor < 5.4) { h -= 1.4; c=[0.14,0.12,0.12]; }
  const dCave = Math.hypot(x-CAVE_POS.x, z-CAVE_POS.z);
  if (dCave < 8) { h = -0.6; c=[0.15,0.35,0.5]; }

  const shade = 0.92 + Math.min(1, Math.max(0,(h+1)/8))*0.08;
  const n = 1 + colorNoise(x, z);
  c = [c[0]*shade*n, c[1]*shade*n, c[2]*shade*n];
  return {h, c};
}
export function groundHeight(x, z) { return terrainInfo(x, z).h; }

export function buildMainTerrain(scene) {
  const size = 280, seg = 160;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI/2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count*3);
  for (let i=0; i<pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const info = terrainInfo(x, z);
    pos.setY(i, info.h);
    colors[i*3]=info.c[0]; colors[i*3+1]=info.c[1]; colors[i*3+2]=info.c[2];
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({vertexColors:true, flatShading:true, roughness:0.9, map: groundNoiseTexture()});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);
}
