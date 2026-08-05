import * as THREE from 'three';
import { buildCharacterMesh } from './character.js';
import { groundHeight, islandRadius, angleOf } from './world/terrain.js';
import { world } from './world/runtime.js';
import { ISLETS } from './world/islets.js';
import { session } from './state.js';

export function makePlayerEntity(scene, appearance, savedPos) {
  const mesh = buildCharacterMesh(appearance);
  const gy = groundHeight(savedPos.x, savedPos.z);
  mesh.position.set(savedPos.x, gy, savedPos.z);
  scene.add(mesh);
  return { appearance, mesh, heading:Math.PI, bob:0, input:{active:false,dx:0,dy:0}, useKeyboard:false, nearest:null };
}
export function rebuildPlayerEntityMesh(scene, entity, appearance) {
  entity.appearance = appearance;
  const pos = entity.mesh.position.clone(), rot = entity.mesh.rotation.y;
  scene.remove(entity.mesh);
  entity.mesh = buildCharacterMesh(appearance);
  entity.mesh.position.copy(pos);
  entity.mesh.rotation.y = rot;
  scene.add(entity.mesh);
}

const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

export function setupJoystick(zoneId, nubId, inputState) {
  const zone = document.getElementById(zoneId);
  const nub = document.getElementById(nubId);
  let originX=0, originY=0, touchId=null;
  const RADIUS = zoneId.indexOf('p2') >= 0 ? 42 : 55;

  function start(x,y,id) { inputState.active = true; touchId = id; originX = x; originY = y; }
  function move(x,y) {
    let dx = x-originX, dy = y-originY;
    const d = Math.hypot(dx,dy);
    if (d > RADIUS) { dx = dx/d*RADIUS; dy = dy/d*RADIUS; }
    nub.style.transform = `translate(${dx}px,${dy}px)`;
    inputState.dx = dx/RADIUS; inputState.dy = dy/RADIUS;
  }
  function end() { inputState.active=false; inputState.dx=0; inputState.dy=0; touchId=null; nub.style.transform='translate(0px,0px)'; }

  zone.addEventListener('touchstart', e => { const t=e.changedTouches[0]; start(t.clientX,t.clientY,t.identifier); e.preventDefault(); }, {passive:false});
  zone.addEventListener('touchmove', e => { for (const t of e.changedTouches) { if (t.identifier===touchId) move(t.clientX,t.clientY); } e.preventDefault(); }, {passive:false});
  zone.addEventListener('touchend', e => { for (const t of e.changedTouches) { if (t.identifier===touchId) end(); } });
  zone.addEventListener('touchcancel', end);
  zone.addEventListener('mousedown', e => { start(e.clientX,e.clientY,'mouse'); });
  window.addEventListener('mousemove', e => { if (inputState.active && touchId==='mouse') move(e.clientX,e.clientY); });
  window.addEventListener('mouseup', () => { if (touchId==='mouse') end(); });
}

// Le joystick est interprété par rapport à la caméra : pousser à droite
// à l'écran fait toujours aller le personnage à droite à l'écran.
export function computeMoveVector(inputState, useKeyboard, camHeading) {
  let mx=0, mz=0;
  if (inputState.active) { mx = inputState.dx; mz = inputState.dy; }
  if (useKeyboard) {
    if (keys['arrowup']||keys['w']) mz -= 1;
    if (keys['arrowdown']||keys['s']) mz += 1;
    if (keys['arrowleft']||keys['a']) mx -= 1;
    if (keys['arrowright']||keys['d']) mx += 1;
  }
  const len = Math.hypot(mx,mz);
  if (len < 0.06) return {x:0,z:0,mag:0};
  const forwardX = Math.sin(camHeading), forwardZ = Math.cos(camHeading);
  const rightX = -Math.cos(camHeading), rightZ = Math.sin(camHeading);
  const worldX = rightX*mx - forwardX*mz;
  const worldZ = rightZ*mx - forwardZ*mz;
  const mag = Math.min(1,len);
  const wlen = Math.hypot(worldX,worldZ)||1;
  return {x:worldX/wlen, z:worldZ/wlen, mag};
}

export function withinMainBounds(x,z) { return Math.hypot(x,z) < islandRadius(angleOf(x,z)) + 3; }
export function withinIsletBounds(center,x,z) { return Math.hypot(x-center.x,z-center.z) < 15; }

export function updateAllPlayers(dt) {
  const speed = 12.5;
  let turnAccum = 0, turnWeight = 0;
  world.players.forEach(p => {
    const mv = computeMoveVector(p.input, p.useKeyboard, world.camHeading);
    if (mv.mag > 0) {
      const nx = p.mesh.position.x + mv.x*speed*dt*mv.mag;
      const nz = p.mesh.position.z + mv.z*speed*dt*mv.mag;
      let allowed;
      if (world.currentArea === "main") allowed = withinMainBounds(nx,nz);
      else { const is = ISLETS.find(i => i.key===world.currentArea); allowed = is && withinIsletBounds(is.pos,nx,nz); }
      if (allowed) {
        p.mesh.position.x = nx; p.mesh.position.z = nz;
        const targetHeading = Math.atan2(mv.x, mv.z);
        let diff = targetHeading - p.heading;
        while (diff>Math.PI) diff-=Math.PI*2;
        while (diff<-Math.PI) diff+=Math.PI*2;
        p.heading += diff*Math.min(1,dt*8);
        p.mesh.rotation.y = p.heading;
        turnAccum += diff; turnWeight++;
      }
      p.bob += dt*10;
    } else { p.bob *= 0.9; }
    const gy = groundHeight(p.mesh.position.x, p.mesh.position.z);
    p.mesh.position.y = gy + Math.abs(Math.sin(p.bob))*0.08;
  });
  if (turnWeight > 0) world.camHeading += (turnAccum/turnWeight)*Math.min(1,dt*3);

  if (session.state.mode === 'duo') {
    world.players.forEach((p,i) => { session.state.players[i].pos = {x:p.mesh.position.x,y:p.mesh.position.y,z:p.mesh.position.z}; });
  } else if (world.players[0]) {
    session.state.playerPos = {x:world.players[0].mesh.position.x,y:world.players[0].mesh.position.y,z:world.players[0].mesh.position.z};
  }
}

const camOffset = new THREE.Vector3();
const camTarget = new THREE.Vector3();
export function updateCamera(dt) {
  const { camera, players, sunLight } = world;
  const avg = new THREE.Vector3();
  players.forEach(p => avg.add(p.mesh.position));
  avg.divideScalar(players.length);
  let dist = 10.5, height = 6;
  if (players.length === 2) {
    const sep = players[0].mesh.position.distanceTo(players[1].mesh.position);
    dist = 12 + Math.min(sep*0.55, 22);
    height = 6.5 + Math.min(sep*0.15,6);
  }
  camOffset.set(-Math.sin(world.camHeading)*dist, height, -Math.cos(world.camHeading)*dist);
  camTarget.copy(avg).add(camOffset);
  camera.position.lerp(camTarget, Math.min(1, dt*4));
  camera.lookAt(new THREE.Vector3(avg.x, avg.y+1.3, avg.z));
  if (sunLight) { sunLight.position.set(avg.x+70, avg.y+110, avg.z+40); sunLight.target.position.copy(avg); }
}
