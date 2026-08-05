import * as THREE from 'three';

let skyGeo = null;

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
