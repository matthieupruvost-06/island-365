import * as THREE from 'three';
import { rand } from '../rng.js';
import { lowPolyMat, makePalm, makeRock } from './decor.js';

export const ISLETS = [
  {key:"shell",  name:"Îlot aux coquillages", emoji:"🐚", pos:new THREE.Vector3(156,1,75)},
  {key:"tropic", name:"Îlot tropical",        emoji:"🌴", pos:new THREE.Vector3(-163,1,51)},
  {key:"volcano",name:"Îlot volcanique",      emoji:"🌋", pos:new THREE.Vector3(163,1,-48)},
  {key:"myst",   name:"Îlot mystérieux",      emoji:"🌫️", pos:new THREE.Vector3(-167,1,-24)},
  {key:"ruins",  name:"Îlot des ruines",      emoji:"🏛️", pos:new THREE.Vector3(102,1,153)}
];

function buildIslet(scene, center, mainColor, deco) {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(13,15,1.4,12,1);
  const pos = geo.attributes.position; const colors=new Float32Array(pos.count*3);
  for (let i=0; i<pos.count; i++) { colors[i*3]=mainColor[0]; colors[i*3+1]=mainColor[1]; colors[i*3+2]=mainColor[2]; }
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  const base = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({vertexColors:true, flatShading:true}));
  base.position.y = 0.2; base.receiveShadow = true;
  g.add(base); deco(g); g.position.copy(center);
  scene.add(g);
}

export function buildIslets(scene) {
  buildIslet(scene, ISLETS[0].pos, [0.95,0.87,0.65], g=>{ for(let i=0;i<4;i++){ const p=makePalm(); p.position.set(rand(-5,5),0.9,rand(-5,5)); g.add(p); } });
  buildIslet(scene, ISLETS[1].pos, [0.5,0.75,0.4], g=>{ for(let i=0;i<5;i++){ const p=makePalm(); p.position.set(rand(-5,5),0.9,rand(-5,5)); g.add(p); } });
  buildIslet(scene, ISLETS[2].pos, [0.25,0.15,0.12], g=>{
    const cone = new THREE.Mesh(new THREE.ConeGeometry(5,7,8), lowPolyMat(0x3a2018)); cone.position.y=4.5; g.add(cone);
    const lava = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3,0), lowPolyMat(0xff5a2a,0xff5a2a)); lava.position.y=8; g.add(lava);
  });
  buildIslet(scene, ISLETS[3].pos, [0.35,0.42,0.42], g=>{ for(let i=0;i<3;i++){ const r=makeRock(); r.position.set(rand(-5,5),0.9,rand(-5,5)); g.add(r); } });
  buildIslet(scene, ISLETS[4].pos, [0.6,0.58,0.5], g=>{
    for (let i=0; i<4; i++) {
      const ruin = new THREE.Mesh(new THREE.BoxGeometry(1,rand(1.5,3),1), lowPolyMat(0xcac2a8));
      ruin.position.set(rand(-5,5),1,rand(-5,5)); ruin.rotation.y=rand(0,1); g.add(ruin);
    }
  });
}
