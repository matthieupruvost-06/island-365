import * as THREE from 'three';
import { MISSION_TEMPLATES, NUM_SHOPS, MOUNTAIN_PEAK, PEAK2_POS, CAVE_POS, MINE_POS } from './config.js';
import { session, scheduleSave, currentDayIndex } from './state.js';
import { world } from './world/runtime.js';
import { showToast, refreshHUD } from './ui.js';

export function currentMission() { return MISSION_TEMPLATES[ currentDayIndex() % MISSION_TEMPLATES.length ]; }
export function currentShopNumber() { return (currentDayIndex() % NUM_SHOPS) + 1; }
export function isMissionDoneToday() { return !!session.state.completedDays[currentDayIndex()]; }

export function updateNearbyFor(p, btnEl, labelEl) {
  p.nearest = null;
  let best = 3.2;
  if (world.currentArea === "main") {
    for (const s of world.shopMeshes) {
      const d = s.pos.distanceTo(p.mesh.position);
      if (d < best) { best=d; p.nearest = {type:'shop', data:s}; }
    }
    const dBoat = world.boatMesh.position.distanceTo(p.mesh.position);
    if (dBoat < 3.6 && dBoat < best) { best=dBoat; p.nearest = {type:'boat'}; }
    const mission = currentMission();
    if (mission.type === 'reach') {
      const targetPos = { peak: MOUNTAIN_PEAK, peak2: PEAK2_POS, cave: CAVE_POS, mine: MINE_POS, islet:null }[mission.target];
      if (targetPos) {
        const d = new THREE.Vector3(targetPos.x, p.mesh.position.y, targetPos.z).distanceTo(p.mesh.position);
        if (d < 6 && d < best+2 && !isMissionDoneToday()) p.nearest = {type:'reach', data:mission};
      }
    }
  } else {
    const mission = currentMission();
    if (mission.type === 'reach' && mission.target === 'islet' && !isMissionDoneToday()) completeReachMission(mission);
  }

  if (p.nearest) {
    btnEl.classList.add('show');
    const emoji = btnEl.querySelector('.a-emoji');
    if (p.nearest.type === 'shop') { emoji.textContent='🏠'; labelEl.textContent='n°'+String(p.nearest.data.number).padStart(3,'0'); }
    else if (p.nearest.type === 'boat') { emoji.textContent='🚤'; labelEl.textContent='Bateau'; }
    else if (p.nearest.type === 'reach') { emoji.textContent=p.nearest.data.emoji||'📸'; labelEl.textContent='Valider'; }
  } else btnEl.classList.remove('show');
}

export function completeReachMission(mission) {
  session.state.completedDays[currentDayIndex()] = true;
  session.state.coins += mission.reward;
  showToast("✅ Mission accomplie ! +"+mission.reward+" 🪙");
  refreshHUD(); scheduleSave();
}
