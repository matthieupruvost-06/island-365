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
    plank.position.set(0, 0.55, i*3.6); plank.castShadow=true; plank.receiveShadow=true;
    g.add(plank);
  }
  g.position.set(41, 0, 110); scene.add(g);

  // Le bateau : amarré à côté du ponton (pas pile sur le chemin), avec une
  // coque basse et large — comme un vrai bateau — plutôt qu'un tube debout,
  // et des couleurs vives bien différentes du bois du quai pour qu'on le
  // reconnaisse tout de suite.
  const boatMesh = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.55,1.05,3.6,8), lowPolyMat(0xd9503a));
  hull.rotation.z = Math.PI/2; hull.scale.y = 0.42; hull.position.y = 0.28;
  hull.castShadow = true; hull.receiveShadow = true;
  boatMesh.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(3,0.14,1.5), lowPolyMat(0xe4c896));
  deck.position.y = 0.55; deck.castShadow = true;
  boatMesh.add(deck);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,1.9,6), lowPolyMat(0x6d4a2f));
  mast.position.set(-0.2,1.55,0); boatMesh.add(mast);
  const sail = new THREE.Mesh(new THREE.ConeGeometry(0.7,1.5,4), lowPolyMat(0xfbf3e1));
  sail.position.set(-0.2,2.4,0); boatMesh.add(sail);
  const flag = new THREE.Mesh(new THREE.ConeGeometry(0.13,0.28,3), lowPolyMat(0xe2543f));
  flag.rotation.z = Math.PI/2; flag.position.set(-0.2,3.2,0.04); boatMesh.add(flag);
  boatMesh.position.set(43.2, 0.15, 120);
  scene.add(boatMesh);
  return boatMesh;
}
