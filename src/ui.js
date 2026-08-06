import { COLLECTIBLE_TYPES } from './config.js';
import { session, scheduleSave, currentDayIndex, loadGame } from './state.js';
import { currentMission, currentShopNumber, isMissionDoneToday } from './missions.js';
import { world } from './world/runtime.js';
import { islandRadius } from './world/terrain.js';
import { ISLETS } from './world/islets.js';
import { rand } from './rng.js';
import { loadProfileIndex, createProfile, setLastProfile } from './profiles.js';
import { dispatchAction, startHosting } from './sync.js';

/* ---------------------- Panneaux (bottom sheets) ---------------------- */
export function openPanel(id) { document.getElementById(id).classList.add('open'); }
export function closePanel(id) { document.getElementById(id).classList.remove('open'); }

export function show(id) { document.getElementById(id).style.display = 'flex'; }
export function hide(id) { document.getElementById(id).style.display = 'none'; }

/* ---------------------- Toasts ---------------------- */
export function showToast(msg) {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div'); el.className='toast'; el.textContent = msg;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(()=>el.remove(),300); }, 2200);
}

/* ---------------------- HUD ---------------------- */
// Résumé compact affiché en permanence sur le bouton de la mission. Le
// détail complet (numéro de boutique en grand, description...) est dans
// le panneau mission, voir refreshMissionPanel()/openMissionPanel().
export function refreshHUD() {
  const mission = currentMission();
  document.getElementById('day-num').textContent = (currentDayIndex()%365)+1;
  document.getElementById('coin-count').textContent = session.state.coins;
  const hint = document.getElementById('m-hint');
  if (isMissionDoneToday()) {
    hint.textContent = '✅ Terminée — appuie pour voir';
  } else if (mission.type === 'collect') {
    const have = session.state.inventory[mission.item]||0;
    hint.textContent = COLLECTIBLE_TYPES[mission.item].emoji+' '+Math.min(have,mission.count)+'/'+mission.count+' — appuie pour voir';
  } else {
    hint.textContent = '👉 Appuie pour voir la mission';
  }
}

/* ---------------------- Panneau mission ---------------------- */
export function refreshMissionPanel() {
  const mission = currentMission();
  document.getElementById('panel-day-num').textContent = (currentDayIndex()%365)+1;

  const badge = document.getElementById('panel-mission-badge');
  if (mission.type === 'collect') {
    badge.textContent = 'n°'+String(currentShopNumber()).padStart(3,'0');
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
  document.getElementById('panel-mission-title').textContent = mission.type==='collect'
    ? 'Boutique n°'+String(currentShopNumber()).padStart(3,'0')
    : (mission.emoji ? mission.emoji+' ' : '')+(mission.label || 'Défi du jour');
  document.getElementById('panel-mission-desc').textContent = mission.type==='collect' ? 'La boutique '+mission.text : mission.text;

  const prog = document.getElementById('panel-mission-progress');
  if (isMissionDoneToday()) {
    prog.textContent = '✅ Mission du jour terminée — reviens demain !';
  } else if (mission.type === 'collect') {
    const have = session.state.inventory[mission.item]||0;
    prog.textContent = COLLECTIBLE_TYPES[mission.item].emoji+' '+Math.min(have,mission.count)+' / '+mission.count;
  } else {
    prog.textContent = '🎯 '+(mission.label||'');
  }
}
export function openMissionPanel() {
  refreshMissionPanel();
  openPanel('panel-mission');
}

/* ---------------------- Minimap ---------------------- */
let miniCtx;
export function setupMinimap() {
  const el = document.getElementById('minimap');
  el.innerHTML = '';
  const cnv = document.createElement('canvas');
  cnv.width=196; cnv.height=196; cnv.style.width='100%'; cnv.style.height='100%';
  el.appendChild(cnv);
  miniCtx = cnv.getContext('2d');
}
export function drawMinimap() {
  if (!miniCtx) return;
  const ctx = miniCtx, S=196, C=S/2, scale = C/130;
  ctx.clearRect(0,0,S,S);
  ctx.fillStyle = '#1c8f92'; ctx.fillRect(0,0,S,S);
  ctx.beginPath();
  for (let a=0; a<=Math.PI*2+0.1; a+=0.15) {
    const r = islandRadius(a)*scale;
    const x = C + Math.sin(a)*r, y = C - Math.cos(a)*r;
    if (a===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath(); ctx.fillStyle = '#7fbf6a'; ctx.fill();
  ctx.fillStyle='#caa968'; ctx.beginPath(); ctx.arc(C, C-6*scale, 18*scale,0,Math.PI*2); ctx.fill();
  const colors = ['#FF7A59','#2b6fe0'];
  world.players.forEach((p,i) => {
    const px = C + p.mesh.position.x*scale, py = C - p.mesh.position.z*scale;
    ctx.fillStyle = colors[i]||'#FF7A59';
    ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#173B3B'; ctx.lineWidth=1.5; ctx.stroke();
  });
}

/* ---------------------- Carte de l'île ---------------------- */
// Les 9 grands coins de l'île, avec leur position approximative dans le
// monde (mêmes coordonnées x/z que le jeu) pour les placer sur la carte.
const MAP_ZONES = [
  { n:1, emoji:'🏖️', name:'Plage de départ',   desc:"Là où l'aventure commence.",            x:0,   z:80,  color:'#f2c14e' },
  { n:2, emoji:'🌾', name:'Prairie',            desc:'Fleurs, rochers et grands espaces.',    x:0,   z:25,  color:'#8bd15a' },
  { n:3, emoji:'🏘️', name:'Village',            desc:'Les 4 boutiques à livrer.',              x:0,   z:-3,  color:'#e0764a' },
  { n:4, emoji:'🌲', name:'Forêt et la mine',    desc:'Pins, rochers et une mine à explorer.', x:-70, z:-55, color:'#3f7a4a' },
  { n:5, emoji:'🌴', name:'Jungle',              desc:'Arbres touffus et animaux cachés.',      x:35,  z:-57, color:'#1c6b3a' },
  { n:6, emoji:'💦', name:'La cascade',          desc:"L'eau qui tombe de la montagne.",       x:-22, z:-84, color:'#3aa0c8' },
  { n:7, emoji:'⛰️', name:'La montagne',         desc:'Le sommet le plus haut de l’île.', x:20,  z:-98, color:'#b9b6ad' },
  { n:8, emoji:'🏝️', name:'Îlots secrets',       desc:'Accessibles en bateau depuis le quai.',  x:60,  z:55,  color:'#d66bff' },
  { n:9, emoji:'⚓', name:'Le quai',              desc:'Pour embarquer vers les îlots.',         x:41,  z:95,  color:'#2b6fe0' },
];

let mapCtx;
export function drawIslandMap() {
  const cnv = document.getElementById('map-canvas');
  if (!mapCtx) mapCtx = cnv.getContext('2d');
  const ctx = mapCtx, S=280, C=S/2, scale = C/200;
  ctx.clearRect(0,0,S,S);
  ctx.fillStyle = '#1c8f92'; ctx.fillRect(0,0,S,S);

  // Silhouette de l'île (même forme que le vrai terrain)
  ctx.beginPath();
  for (let a=0; a<=Math.PI*2+0.1; a+=0.1) {
    const r = islandRadius(a)*scale;
    const x = C + Math.sin(a)*r, y = C - Math.cos(a)*r;
    if (a===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath(); ctx.fillStyle = '#7fbf6a'; ctx.fill();
  ctx.fillStyle='#caa968'; ctx.beginPath(); ctx.arc(C, C-6*scale, 18*scale,0,Math.PI*2); ctx.fill();

  // Petits îlots secrets, dispersés autour de l'île principale
  ISLETS.forEach(is => {
    const px = C + is.pos.x*scale, py = C - is.pos.z*scale;
    ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.arc(px,py,7,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#173B3B'; ctx.lineWidth=1; ctx.stroke();
    ctx.font='9px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(is.emoji, px, py+0.5);
  });

  // Les 9 zones numérotées
  MAP_ZONES.forEach(z => {
    const px = C + z.x*scale, py = C - z.z*scale;
    ctx.fillStyle = z.color; ctx.beginPath(); ctx.arc(px,py,10,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(z.n, px, py+0.5);
  });
}

export function renderMapLegend() {
  const list = document.getElementById('map-legend');
  list.innerHTML = '';
  MAP_ZONES.forEach(z => {
    const row = document.createElement('div'); row.className = 'map-zone-row';
    row.innerHTML = `<div class="map-zone-num" style="background:${z.color};">${z.n}</div>
      <div class="map-zone-text"><b>${z.emoji} ${z.name}</b><span>${z.desc}</span></div>`;
    list.appendChild(row);
  });
}

export function openMapPanel() {
  drawIslandMap();
  renderMapLegend();
  openPanel('panel-map');
}

/* ---------------------- Inventaire ---------------------- */
export function refreshInventoryPanel() {
  const grid = document.getElementById('inv-grid');
  grid.innerHTML = '';
  Object.keys(COLLECTIBLE_TYPES).forEach(k => {
    const def = COLLECTIBLE_TYPES[k];
    const div = document.createElement('div'); div.className='inv-item';
    div.innerHTML = `<div class="ii-emoji">${def.emoji}</div><div class="ii-count">${session.state.inventory[k]||0}</div><div class="ii-name">${def.name}</div>`;
    grid.appendChild(div);
  });
}

/* ---------------------- Boutique ---------------------- */
export function openShopPanel(shopData) {
  const mission = currentMission();
  const isTargetShop = mission.type==='collect' && shopData.number === currentShopNumber();
  document.getElementById('shop-num-label').textContent = 'n°'+String(shopData.number).padStart(3,'0');
  document.getElementById('shop-name').textContent = shopData.quartier.name.replace('Quartier ','Boutique ');
  document.getElementById('shop-specialty').textContent = shopData.quartier.spec;

  const body = document.getElementById('shop-body');
  const deliverBtn = document.getElementById('shop-deliver-btn');

  if (isTargetShop && !isMissionDoneToday()) {
    const need = mission.count, have = session.state.inventory[mission.item]||0;
    body.innerHTML = `<b>"Bonjour ! J'ai besoin de ${need} ${COLLECTIBLE_TYPES[mission.item].name.toLowerCase()}${need>1?'s':''} ${COLLECTIBLE_TYPES[mission.item].emoji}"</b><br><br>
      Vous en avez actuellement : <b>${have} / ${need}</b>`;
    deliverBtn.style.display='block';
    deliverBtn.disabled = have < need;
    deliverBtn.textContent = have>=need ? 'Livrer la commande' : 'Il manque des objets…';
    deliverBtn.onclick = () => {
      if ((session.state.inventory[mission.item]||0) >= mission.count) {
        dispatchAction({ type:'deliverShop', item: mission.item, count: mission.count, reward: mission.reward, dayIndex: currentDayIndex() });
        showToast('✅ Livraison réussie ! +'+mission.reward+' 🪙');
        closePanel('panel-shop');
      }
    };
  } else if (isTargetShop && isMissionDoneToday()) {
    body.innerHTML = `Merci beaucoup pour cette livraison aujourd'hui ! Reviens demain pour une nouvelle mission. 🌴`;
    deliverBtn.style.display='none';
  } else {
    body.innerHTML = `Cette boutique n'a rien à demander aujourd'hui. Reviens un autre jour !`;
    deliverBtn.style.display='none';
  }
  openPanel('panel-shop');
}

/* ---------------------- Quai / îlots ---------------------- */
export function openBoatPanel() {
  const list = document.getElementById('islet-list');
  list.innerHTML = '';
  ISLETS.forEach(is => {
    const row = document.createElement('div'); row.className='islet-row';
    row.innerHTML = `<div>${is.emoji} <b>${is.name}</b></div>`;
    const btn = document.createElement('button'); btn.textContent = 'Naviguer';
    btn.onclick = () => {
      world.currentArea = is.key;
      session.state.currentArea = is.key; scheduleSave();
      // En ligne, l'ami navigue de son côté sur son appareil : on ne
      // téléporte que son propre personnage, pas le "reflet" de l'ami.
      world.players.forEach((p) => { if (p.remote) return; p.mesh.position.set(is.pos.x+rand(-5,5), is.pos.y+0.9, is.pos.z+rand(-5,5)); });
      showToast('⛵ Vous accostez sur '+is.name);
      closePanel('panel-boat');
    };
    row.appendChild(btn); list.appendChild(row);
  });
  const back = document.createElement('div'); back.className='islet-row';
  back.innerHTML = `<div>🏝️ Retour à l'île principale</div>`;
  const bb = document.createElement('button'); bb.textContent='Rentrer';
  bb.onclick = () => {
    world.currentArea='main';
    session.state.currentArea = 'main'; scheduleSave();
    world.players.forEach((p,i) => { if (p.remote) return; p.mesh.position.set(41+(i*3), 1.4, 96); });
    showToast('⛵ Retour sur Island 365');
    closePanel('panel-boat');
  };
  back.appendChild(bb); list.appendChild(back);
  openPanel('panel-boat');
}

/* ====================================================================
   ÉCRAN D'ACCUEIL : mode (solo/duo) → profil → jeu
==================================================================== */
export let selectedMode = 'solo';
export function setSelectedMode(m) { selectedMode = m; }

export async function goToProfilePicker() {
  hide('mode-picker'); show('profile-picker');
  document.getElementById('picker-sub').textContent = selectedMode==='duo' ? 'Choisissez votre équipe'
    : selectedMode==='online' ? 'Qui héberge la partie ?'
    : "Qui explore aujourd'hui ?";
  document.getElementById('name-input-2').style.display = selectedMode==='duo' ? 'block' : 'none';
  document.getElementById('name-input-1').placeholder = selectedMode==='duo' ? 'Prénom du joueur 1' : 'Prénom';
  const list = await loadProfileIndex();
  renderProfileList(list.filter(p => p.mode===selectedMode));
}
export function renderProfileList(list) {
  const el = document.getElementById('profile-list');
  el.innerHTML = '';
  list.forEach(p => {
    const b = document.createElement('button');
    b.className='profile-chip';
    b.textContent = (p.mode==='duo' ? '🙂🙂 ' : '🙂 ') + p.name;
    b.addEventListener('click', () => selectProfile(p));
    el.appendChild(b);
  });
}
export async function createAndSelectProfile(n1, n2) {
  const names = selectedMode==='duo' ? [n1,n2] : [n1];
  const profile = await createProfile(selectedMode, names);
  await selectProfile(profile);
}
export async function selectProfile(p) {
  session.activeProfile = p;
  await setLastProfile(p.id, p.mode);
  await loadGame();
  if (p.mode === 'online') {
    const code = startHosting();
    document.getElementById('active-profile-label').textContent = `Profil : ${p.name} · Code ami : ${code}`;
  } else {
    document.getElementById('active-profile-label').textContent = 'Profil : '+p.name;
  }
  hide('profile-picker'); hide('mode-picker'); show('main-start-actions');
}
