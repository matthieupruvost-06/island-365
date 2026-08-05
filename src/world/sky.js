import * as THREE from 'three';

export function buildSky(scene) {
  const geo = new THREE.SphereGeometry(420, 20, 14);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count*3);
  const top = new THREE.Color(0x2f9fd8), bottom = new THREE.Color(0xcdf3ee);
  for (let i=0; i<pos.count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp((y/420+0.15)/1.15, 0, 1);
    const col = bottom.clone().lerp(top, t);
    colors[i*3]=col.r; colors[i*3+1]=col.g; colors[i*3+2]=col.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.BackSide, fog:false});
  scene.add(new THREE.Mesh(geo, mat));
}
