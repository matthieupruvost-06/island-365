import * as THREE from 'three';
import { rand, pick } from '../rng.js';
import { terrainInfo } from './terrain.js';

export function lowPolyMat(color, emissive) {
  return new THREE.MeshStandardMaterial({color, flatShading:true, roughness:0.85, emissive: emissive||0x000000, emissiveIntensity: emissive?0.55:0});
}

export function makePalm() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.28,3.4,6), lowPolyMat(0xa9793f));
  trunk.position.y = 1.7; trunk.rotation.z = rand(-0.08,0.08); g.add(trunk);
  const leafMat = lowPolyMat(0x3fa15a);
  for (let i=0; i<5; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.9,2.4,4), leafMat);
    leaf.position.set(0,3.3,0); leaf.rotation.z = Math.PI/2.3; leaf.rotation.y = (i/5)*Math.PI*2; leaf.rotation.x = -0.3;
    g.add(leaf);
  }
  return g;
}
export function makePine() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.24,1.6,6), lowPolyMat(0x6d4a2f));
  trunk.position.y=0.8; g.add(trunk);
  const leafMat = lowPolyMat(0x255c3a);
  for (let i=0; i<3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(1.3-i*0.32, 1.5, 7), leafMat);
    c.position.y = 1.6 + i*1.05; g.add(c);
  }
  return g;
}
export function makeJungleTree() {
  const g = new THREE.Group();
  const h = rand(3.5,5.5);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.5,h,6), lowPolyMat(0x4a3420));
  trunk.position.y = h/2; g.add(trunk);
  const canopyMat = lowPolyMat(pick([0x1c6b3a,0x257a44,0x2f8a4d]));
  for (let i=0; i<3; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.6,2.3),0), canopyMat);
    s.position.set(rand(-1,1), h+rand(0,1.2), rand(-1,1)); g.add(s);
  }
  return g;
}
export function makeRock() {
  const r = rand(0.5,1.6);
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r,0), lowPolyMat(0x8a8a86));
  m.rotation.set(rand(0,Math.PI),rand(0,Math.PI),rand(0,Math.PI));
  return m;
}
export function makeBush() {
  const g = new THREE.Group();
  const leafMat = lowPolyMat(pick([0x3d7a3d, 0x4f8f5a, 0x2f6b4f]));
  for (let i=0; i<3; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.32,0.52), 0), leafMat);
    s.position.set(rand(-0.2,0.2), rand(0.22,0.4), rand(-0.2,0.2));
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

export function scatter(scene, count, fn, xRange, zRange) {
  for (let i=0; i<count; i++) {
    const x = rand(xRange[0],xRange[1]), z = rand(zRange[0],zRange[1]);
    const info = terrainInfo(x,z);
    if (info.h < -1) continue;
    const obj = fn();
    obj.position.set(x, info.h, z);
    obj.rotation.y = rand(0,Math.PI*2);
    const s = rand(0.85,1.2); obj.scale.set(s,s,s);
    scene.add(obj);
  }
}
