import * as THREE from 'three';
import { rand } from '../rng.js';
import { terrainInfo } from './terrain.js';
import { lowPolyMat } from './decor.js';
import { NUM_SHOPS, QUARTIERS } from '../config.js';

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
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.4,1.8,2.2), lowPolyMat(0xf1e3c0));
      base.position.y = 0.9; base.castShadow=true; base.receiveShadow=true; g.add(base);
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
