import * as THREE from 'three';
import { rand } from '../rng.js';

let skyGeo = null;

// Petits nuages "low poly" (quelques boules qui se chevauchent), pour que le
// ciel ne soit plus juste un dégradé tout plat.
function makeCloud() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({color:0xffffff, flatShading:true, roughness:1});
  const puffs = 4 + Math.floor(rand(0,3));
  for (let i=0; i<puffs; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(rand(3,6),0), mat);
    s.position.set(rand(-6,6), rand(-1,1.5), rand(-3,3));
    g.add(s);
  }
  return g;
}
export function buildClouds(scene) {
  for (let i=0; i<16; i++) {
    const c = makeCloud();
    const a = rand(0, Math.PI*2), r = rand(40,190);
    c.position.set(Math.sin(a)*r, rand(55,88), Math.cos(a)*r);
    const s = rand(0.8,1.6); c.scale.set(s,s,s);
    scene.add(c);
  }
}

export function buildSky(scene) {
  const geo = new THREE.SphereGeometry(420, 20, 14);
  const colors = new Float32Array(geo.attributes.position.count * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.BackSide, fog:false});
  scene.add(new THREE.Mesh(geo, mat));
  skyGeo = geo;
  setSkyColors(0x2f9fd8, 0xcdf3ee); // dégradé par défaut (identique au prototype)
}

// Recolore le ciel en place (même géométrie) pour changer d'ambiance sans
// reconstruire la sphère — utilisé par le cycle jour/nuit.
export function setSkyColors(topHex, bottomHex) {
  if (!skyGeo) return;
  const pos = skyGeo.attributes.position;
  const colorAttr = skyGeo.attributes.color;
  const top = new THREE.Color(topHex), bottom = new THREE.Color(bottomHex);
  for (let i=0; i<pos.count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp((y/420+0.15)/1.15, 0, 1);
    const col = bottom.clone().lerp(top, t);
    colorAttr.setXYZ(i, col.r, col.g, col.b);
  }
  colorAttr.needsUpdate = true;
}
