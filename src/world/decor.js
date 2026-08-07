import * as THREE from 'three';
import { rand, pick } from '../rng.js';
import { terrainInfo } from './terrain.js';

export function lowPolyMat(color, emissive) {
  return new THREE.MeshStandardMaterial({color, flatShading:true, roughness:0.85, emissive: emissive||0x000000, emissiveIntensity: emissive?0.55:0});
}

// Texture d'écorce générée une seule fois (dessinée dans un canevas, pas de
// fichier à télécharger) et réutilisée sur tous les troncs — ça casse
// l'effet "cylindre en plastique uni" sans changer le style du jeu.
let _barkBase = null;
function barkBaseTexture() {
  if (_barkBase) return _barkBase;
  const c = document.createElement('canvas'); c.width = 32; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a6a45'; ctx.fillRect(0,0,32,64);
  for (let i=0; i<26; i++) {
    const x = Math.random()*32;
    const dark = Math.random() < 0.5;
    ctx.strokeStyle = dark ? `rgba(60,40,20,${0.25+Math.random()*0.35})` : `rgba(180,150,110,${0.15+Math.random()*0.25})`;
    ctx.lineWidth = 0.6+Math.random()*1.6;
    ctx.beginPath();
    let cx = x;
    ctx.moveTo(cx, 0);
    for (let y=6; y<=64; y+=6) { cx += (Math.random()-0.5)*3; ctx.lineTo(cx, y); }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  _barkBase = tex;
  return tex;
}
// Une texture ne peut avoir qu'un seul "repeat" à la fois : on garde donc une
// copie par réglage (palmier/pin/arbre de jungle) plutôt que de la modifier
// sur l'unique texture partagée (ce qui aurait changé le motif de TOUS les
// troncs déjà créés).
const _barkVariants = {};
function barkMat(tint, rx, ry) {
  const key = rx+'x'+ry;
  let tex = _barkVariants[key];
  if (!tex) {
    tex = barkBaseTexture().clone();
    tex.needsUpdate = true;
    tex.repeat.set(rx, ry);
    _barkVariants[key] = tex;
  }
  return new THREE.MeshStandardMaterial({color: tint, map: tex, flatShading:true, roughness:0.95});
}

export function makePalm() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.28,3.4,6), barkMat(0xc9a06a, 2, 3));
  trunk.position.y = 1.7; trunk.rotation.z = rand(-0.08,0.08); g.add(trunk);
  const leafMat = lowPolyMat(pick([0x3fa15a, 0x39965a, 0x4aae66]));
  for (let i=0; i<5; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.9,2.4,4), leafMat);
    leaf.position.set(0,3.3,0); leaf.rotation.z = Math.PI/2.3; leaf.rotation.y = (i/5)*Math.PI*2; leaf.rotation.x = -0.3;
    g.add(leaf);
  }
  return g;
}
export function makePine() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.24,1.6,6), barkMat(0x8a6a45, 1.5, 1.5));
  trunk.position.y=0.8; g.add(trunk);
  const leafMat = lowPolyMat(pick([0x255c3a, 0x2c6b45, 0x1f5233]));
  for (let i=0; i<3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(rand(1.15,1.4)-i*0.32, rand(1.3,1.7), 7), leafMat);
    c.position.y = 1.6 + i*1.05; c.rotation.y = rand(0,Math.PI*2); g.add(c);
  }
  return g;
}
export function makeJungleTree() {
  const g = new THREE.Group();
  const h = rand(3.5,5.5);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.5,h,6), barkMat(0x8a6a45, 2, 4));
  trunk.position.y = h/2; g.add(trunk);
  const canopyMat = lowPolyMat(pick([0x1c6b3a,0x257a44,0x2f8a4d]));
  for (let i=0; i<4; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.4,2.2),1), canopyMat);
    s.position.set(rand(-1.3,1.3), h+rand(-0.3,1.3), rand(-1.3,1.3)); g.add(s);
  }
  return g;
}
export function makeRock() {
  const r = rand(0.5,1.6);
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r,0), lowPolyMat(pick([0x8a8a86, 0x94897a, 0x7d7d76, 0x9c9184])));
  m.rotation.set(rand(0,Math.PI),rand(0,Math.PI),rand(0,Math.PI));
  return m;
}
export function makeBush() {
  const g = new THREE.Group();
  const leafMat = lowPolyMat(pick([0x3d7a3d, 0x4f8f5a, 0x2f6b4f, 0x468a52]));
  for (let i=0; i<4; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.28,0.5), 1), leafMat);
    s.position.set(rand(-0.22,0.22), rand(0.2,0.42), rand(-0.22,0.22));
    g.add(s);
  }
  return g;
}
export function makeFlower() {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.5,4), lowPolyMat(0x3d7a3d));
  stem.position.y=0.25; g.add(stem);
  const bloom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16,0), lowPolyMat(pick([0xff6f9c,0xffd166,0xff8f5c,0xd66bff])));
  bloom.position.y=0.52; g.add(bloom);
  return g;
}

export function makeSeashell() {
  const g = new THREE.Group();
  const mat = lowPolyMat(pick([0xffe9c7, 0xffd9b0, 0xf7c9a0, 0xffffff]));
  const shell = new THREE.Mesh(new THREE.ConeGeometry(rand(0.12,0.2), rand(0.14,0.22), 7, 1, true), mat);
  shell.rotation.x = Math.PI/2 + rand(-0.3,0.3); shell.rotation.z = rand(0,Math.PI*2);
  shell.position.y = 0.06;
  g.add(shell);
  return g;
}
export function makeDriftwood() {
  const g = new THREE.Group();
  const mat = barkMat(pick([0xb8a184, 0x9c8468, 0xcbb896]), 1, 1.5);
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.13,rand(1.2,2.2),6), mat);
  log.rotation.z = Math.PI/2; log.rotation.y = rand(0,Math.PI*2);
  log.position.y = 0.12;
  g.add(log);
  return g;
}
export function makeGrassTuft() {
  const g = new THREE.Group();
  const mat = lowPolyMat(pick([0x5aa15a, 0x4f8f5a, 0x6bb56b]));
  for (let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.035, rand(0.22,0.4), 3), mat);
    blade.position.set(rand(-0.1,0.1), rand(0.11,0.2), rand(-0.1,0.1));
    blade.rotation.z = rand(-0.3,0.3);
    g.add(blade);
  }
  return g;
}

// Parasol rayé, pour donner un petit côté "vacances" à la plage. Les rayures
// sont de vraies couleurs de sommets (pas une texture) réparties autour du
// cône, façon moulin à vent.
export function makeParasol() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.045,1.7,6), lowPolyMat(0xe8dcc0));
  pole.position.y = 0.85; g.add(pole);

  const stripePairs = [[0xff6f6f,0xffffff],[0xffd166,0xffffff],[0x4fd1c5,0xffffff],[0xff9a5c,0xffffff],[0xd66bff,0xffffff]];
  const [c1hex, c2hex] = pick(stripePairs);
  const segs = 10;
  const geo = new THREE.ConeGeometry(1.05, 0.5, segs, 1, false);
  geo.toNonIndexed();
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count*3);
  const col1 = new THREE.Color(c1hex), col2 = new THREE.Color(c2hex);
  for (let i=0; i<pos.count; i+=3) {
    let sx=0, sz=0;
    for (let k=0; k<3; k++) { sx += pos.getX(i+k); sz += pos.getZ(i+k); }
    const a = Math.atan2(sz, sx);
    const seg = Math.floor(((a+Math.PI)/(Math.PI*2))*segs) % segs;
    const c = (seg%2===0) ? col1 : col2;
    for (let k=0; k<3; k++) { colors[(i+k)*3]=c.r; colors[(i+k)*3+1]=c.g; colors[(i+k)*3+2]=c.b; }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  const canopy = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({vertexColors:true, flatShading:true, roughness:0.8}));
  canopy.position.y = 1.55;
  g.add(canopy);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05,6,6), lowPolyMat(c1hex));
  tip.position.y = 1.82; g.add(tip);
  return g;
}
export function makeBeachTowel() {
  const g = new THREE.Group();
  const stripeSets = [[0xff6f6f,0xffffff],[0x4fd1c5,0xffe9c7],[0xffd166,0xffffff],[0xd66bff,0xffffff]];
  const [c1,c2] = pick(stripeSets);
  const towel = new THREE.Mesh(new THREE.PlaneGeometry(0.85,1.5), lowPolyMat(pick([c1,c2])));
  towel.rotation.x = -Math.PI/2;
  towel.position.y = 0.015;
  g.add(towel);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.85,0.3), lowPolyMat(pick([c1,c2])));
  stripe.rotation.x = -Math.PI/2;
  stripe.position.set(0, 0.02, rand(-0.4,0.4));
  g.add(stripe);
  return g;
}

export function scatter(scene, count, fn, xRange, zRange) {
  for (let i=0; i<count; i++) {
    const x = rand(xRange[0],xRange[1]), z = rand(zRange[0],zRange[1]);
    const info = terrainInfo(x,z);
    if (info.h < -1) continue;
    const obj = fn();
    obj.position.set(x, info.h, z);
    obj.rotation.y = rand(0,Math.PI*2);
    const s = rand(0.85,1.2); obj.scale.set(s,s,s);
    // Une vraie ombre portée au sol, ça change tout pour donner
    // l'impression que les objets sont vraiment posés sur l'île.
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(obj);
  }
}
