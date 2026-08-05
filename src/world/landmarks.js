import * as THREE from 'three';
import { lowPolyMat } from './decor.js';
import { MOUNTAIN_PEAK, MINE_POS } from '../config.js';

export function buildWaterfall(scene) {
  const geo = new THREE.PlaneGeometry(6,32,1,12);
  const mat = new THREE.MeshStandardMaterial({color:0x8fe3ee, transparent:true, opacity:0.75, flatShading:true, side:THREE.DoubleSide});
  const fall = new THREE.Mesh(geo, mat);
  fall.position.set(MOUNTAIN_PEAK.x, 18, MOUNTAIN_PEAK.z+4); fall.rotation.x = -0.15;
  scene.add(fall);
}

export function buildMineEntrance(scene) {
  const g = new THREE.Group();
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.6,0.6,6,10,Math.PI), lowPolyMat(0x4a3a2a));
  arch.position.set(0,2.4,0); arch.castShadow=true; g.add(arch);
  const dark = new THREE.Mesh(new THREE.CircleGeometry(2.1,10), lowPolyMat(0x0c0c0c));
  dark.position.set(0,2.2,0.3); g.add(dark);
  g.position.copy(MINE_POS);
  scene.add(g);
}

export function buildDock(scene) {
  const g = new THREE.Group();
  for (let i=0; i<7; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.6,0.2,3.4), lowPolyMat(0x8a6a45));
    plank.position.set(0, 0.7, i*3.6); plank.castShadow=true; plank.receiveShadow=true;
    g.add(plank);
  }
  g.position.set(41, 0, 95); scene.add(g);

  const boatMesh = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.9,0.4,3.2,6), lowPolyMat(0xb5713f));
  hull.rotation.z = Math.PI/2; hull.position.y=0.55; hull.castShadow=true;
  boatMesh.add(hull);
  const sail = new THREE.Mesh(new THREE.ConeGeometry(0.9,1.8,4), lowPolyMat(0xfbf3e1));
  sail.position.set(0,1.6,0); boatMesh.add(sail);
  boatMesh.position.set(41, 0.6, 102);
  scene.add(boatMesh);
  return boatMesh;
}
