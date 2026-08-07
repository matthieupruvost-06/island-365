import * as THREE from 'three';
import { rand, pick } from '../rng.js';
import { lowPolyMat } from './decor.js';

export function makeRabbit() {
  const g = new THREE.Group();
  const furColor = pick([0xcfae87, 0xe8ded0, 0x8a6a4a, 0xffffff]);
  const fur = lowPolyMat(furColor);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), fur);
  body.scale.set(1, 0.85, 1.3); body.position.y = 0.24; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), fur);
  head.position.set(0, 0.4, 0.24); g.add(head);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 5), fur);
    ear.position.set(side*0.06, 0.6, 0.2); ear.rotation.x = -0.2; g.add(ear);
  }
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 6), lowPolyMat(0xffffff));
  tail.position.set(0, 0.3, -0.34); g.add(tail);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function makeBird() {
  const g = new THREE.Group();
  const color = pick([0x3a6ea5, 0xd1476b, 0x4a3a2a, 0xe6b91e, 0x2f8a4d]);
  const feather = lowPolyMat(color);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 6), feather);
  body.scale.set(1, 1, 1.4); body.position.y = 0.18; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 7, 6), feather);
  head.position.set(0, 0.27, 0.16); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 5), lowPolyMat(0xffb703));
  beak.rotation.x = Math.PI/2; beak.position.set(0, 0.26, 0.27); g.add(beak);
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 4), feather);
    wing.rotation.z = side * 1.4; wing.position.set(side*0.15, 0.19, 0); g.add(wing);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function makeDeer() {
  const g = new THREE.Group();
  const hide = lowPolyMat(pick([0x9a6a3f, 0xb08050]));
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.75, 6), hide);
  body.rotation.z = Math.PI/2; body.position.y = 0.55; g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.4, 6), hide);
  neck.position.set(0, 0.78, 0.38); neck.rotation.x = -0.5; g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 7, 6), hide);
  head.position.set(0, 0.98, 0.55); g.add(head);
  const legMat = hide;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 5), legMat);
    leg.position.set(sx*0.14, 0.28, sz*0.25); g.add(leg);
  }
  const antlerMat = lowPolyMat(0x6a5030);
  for (const side of [-1, 1]) {
    const antler = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.28, 4), antlerMat);
    antler.position.set(side*0.08, 1.18, 0.5); antler.rotation.z = side*0.3; g.add(antler);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function makeSheep() {
  const g = new THREE.Group();
  const wool = lowPolyMat(pick([0xf7f2e6, 0xffffff, 0xe9e1cf]));
  for (let i=0; i<6; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(0.19,0.27), 0), wool);
    s.position.set(rand(-0.22,0.22), 0.3+rand(-0.05,0.09), rand(-0.3,0.3));
    g.add(s);
  }
  const faceMat = lowPolyMat(pick([0x3a2a1f, 0x5a463a, 0x1c1a18]));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 6), faceMat);
  head.position.set(0, 0.34, 0.33); g.add(head);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 5), faceMat);
    ear.position.set(side*0.12, 0.38, 0.28); ear.rotation.z = side*0.9; g.add(ear);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.24,5), faceMat);
    leg.position.set(sx*0.14, 0.12, sz*0.2); g.add(leg);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}
