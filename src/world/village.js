import * as THREE from 'three';
import { rand } from '../rng.js';
import { terrainInfo } from './terrain.js';
import { lowPolyMat } from './decor.js';
import { NUM_SHOPS, QUARTIERS } from '../config.js';

// Petite texture "planches de bois" pour les murs des boutiques (dessinée
// une seule fois dans un canevas, pas de fichier à télécharger) — ça évite
// l'effet "boîte en plastique uni" des façades.
let _plankTex = null;
function plankTexture() {
  if (_plankTex) return _plankTex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,64,64);
  ctx.strokeStyle = 'rgba(110,90,60,0.3)'; ctx.lineWidth = 2;
  for (let y=8; y<64; y+=16) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(64,y); ctx.stroke(); }
  for (let i=0; i<40; i++) {
    const x = Math.random()*64, y = Math.random()*64;
    ctx.fillStyle = `rgba(140,110,75,${(0.05+Math.random()*0.1).toFixed(2)})`;
    ctx.fillRect(x, y, 2+Math.random()*3, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2,2);
  _plankTex = tex;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

export function numberSprite(n) {
  const c = document.createElement('canvas'); c.width = 160; c.height = 90;
  const ctx = c.getContext('2d');
  ctx.fillStyle = "#FBF3E1"; roundRect(ctx,4,4,152,60,14); ctx.fill();
  ctx.strokeStyle = "#173B3B"; ctx.lineWidth=4; roundRect(ctx,4,4,152,60,14); ctx.stroke();
  ctx.fillStyle = "#173B3B"; ctx.font = "bold 34px sans-serif";
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText("n°"+String(n).padStart(3,'0'), 80, 38);
  const tex = new THREE.CanvasTexture(c);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, depthTest:true}));
  spr.scale.set(2.6,1.5,1);
  return spr;
}

export function buildVillage(scene) {
  const shopMeshes = [];
  let shopIdx = 0;
  const perQuartier = Math.ceil(NUM_SHOPS / QUARTIERS.length);
  QUARTIERS.forEach((q) => {
    const cols = Math.ceil(Math.sqrt(perQuartier));
    for (let i=0; i<perQuartier && shopIdx<NUM_SHOPS; i++, shopIdx++) {
      const row = Math.floor(i/cols), col = i%cols;
      const x = q.center[0] + (col-cols/2)*4.4 + rand(-0.3,0.3);
      const z = q.center[1] + (row-cols/2)*4.4 + rand(-0.3,0.3);
      const g = new THREE.Group();
      const wallMat = new THREE.MeshStandardMaterial({color:0xf1e3c0, map: plankTexture(), flatShading:true, roughness:0.9});
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.4,1.8,2.2), wallMat);
      base.position.y = 0.9; base.castShadow=true; base.receiveShadow=true; g.add(base);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.9,0.06), lowPolyMat(q.color));
      door.position.set(0, 0.45, 1.13); g.add(door);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9,1.3,4), lowPolyMat(q.color));
      roof.position.y = 2.4; roof.rotation.y = Math.PI/4; roof.castShadow=true; g.add(roof);
      const num = numberSprite(shopIdx+1);
      num.position.set(0,3.1,0); g.add(num);
      const info = terrainInfo(x,z);
      g.position.set(x, info.h, z);
      g.userData.shopNumber = shopIdx+1;
      g.userData.quartier = q;
      scene.add(g);
      shopMeshes.push({mesh:g, number:shopIdx+1, pos:new THREE.Vector3(x,info.h,z), quartier:q});
    }
  });
  return shopMeshes;
}
