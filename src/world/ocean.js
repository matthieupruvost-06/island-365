import * as THREE from 'three';

export function buildOcean(scene) {
  const waterGeo = new THREE.PlaneGeometry(900, 900, 50, 50);
  waterGeo.rotateX(-Math.PI/2);
  const mat = new THREE.MeshStandardMaterial({color:0x1c8f92, transparent:true, opacity:0.85, roughness:0.3, metalness:0.15, flatShading:true});
  const waterMesh = new THREE.Mesh(waterGeo, mat);
  waterMesh.position.y = -1.1;
  scene.add(waterMesh);
  return { waterMesh, waterGeo };
}

export function animateWater(t, waterGeo) {
  const pos = waterGeo.attributes.position;
  for (let i=0; i<pos.count; i+=3) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, Math.sin(t*1.2 + x*0.05 + z*0.04)*0.45);
  }
  pos.needsUpdate = true;
}
