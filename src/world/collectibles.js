import * as THREE from 'three';
import { rand } from '../rng.js';
import { terrainInfo } from './terrain.js';
import { COLLECTIBLE_TYPES, MINE_POS, CAVE_POS } from '../config.js';
import { ISLETS } from './islets.js';
import { world } from './runtime.js';
import { showToast } from '../ui.js';
import { dispatchAction, isOnline } from '../sync.js';
import * as network from '../network.js';

export function spawnCollectible(scene, type, x, z, yOff) {
  yOff = yOff || 1;
  const def = COLLECTIBLE_TYPES[type];
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28,0),
    new THREE.MeshStandardMaterial({color:def.color, emissive:def.color, emissiveIntensity:0.4, flatShading:true}));
  const info = terrainInfo(x,z);
  mesh.position.set(x, info.h + yOff, z);
  mesh.userData.baseY = mesh.position.y; mesh.userData.type = type;
  mesh.userData.spin = rand(0.5,1.4); mesh.userData.phase = rand(0,Math.PI*2);
  scene.add(mesh);
  return {mesh, type, taken:false};
}

export function scatterCollectibles(scene) {
  const list = [];
  const add = (type, x, z, yOff) => list.push(spawnCollectible(scene, type, x, z, yOff));
  for (let i=0; i<22; i++) add('shell', rand(-100,100), rand(58,110));
  for (let i=0; i<16; i++) add('flower', rand(-75,75), rand(6,46));
  for (let i=0; i<12; i++) add('flower', rand(-18,80), rand(-68,-26));
  for (let i=0; i<16; i++) add('creature', rand(-18,80), rand(-68,-26));
  for (let i=0; i<12; i++) add('gold', MINE_POS.x+rand(-7,10), MINE_POS.z+rand(-7,10));
  for (let i=0; i<12; i++) add('crystal', CAVE_POS.x+rand(-5,5), CAVE_POS.z+rand(-5,5), 1.4);
  for (let i=0; i<12; i++) add('fish', rand(16,44), rand(100,124), 0.6);
  ISLETS.forEach(is => { add('mappiece', is.pos.x+rand(-3,3), is.pos.z+rand(-3,3)); });
  return list;
}

export function updateCollectibles(dt, t) {
  world.collectMeshes.forEach((c, index) => {
    if (c.taken) return;
    c.mesh.rotation.y += dt*c.mesh.userData.spin;
    c.mesh.position.y = c.mesh.userData.baseY + Math.sin(t*2+c.mesh.userData.phase)*0.15;
    for (const p of world.players) {
      // Un joueur "distant" (l'ami connecté par le réseau) n'est ramassé
      // que sur SON appareil ; ici on ne regarde que les joueurs qu'on
      // contrôle réellement soi-même, pour ne pas compter deux fois.
      if (p.remote) continue;
      if (c.mesh.position.distanceTo(p.mesh.position) < 1.6) { collectItem(c, index); break; }
    }
  });
}

function collectItem(c, index) {
  c.taken = true; world.scene.remove(c.mesh);
  showToast(COLLECTIBLE_TYPES[c.type].emoji+" "+COLLECTIBLE_TYPES[c.type].name+" +1");
  if (isOnline()) network.sendCollectTaken({ index });
  dispatchAction({ type:'collect', index, item:c.type });
}
