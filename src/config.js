import * as THREE from 'three';

// NB: le village est conçu pour scaler jusqu'à 365 boutiques : il suffit
// d'augmenter NUM_SHOPS, le placement procédural s'occupe du reste.
export const NUM_SHOPS = 48;

export const QUARTIERS = [
  { name:"Quartier de la Mine",   spec:"⛏️ Minerais & outils", color:0x8a6a4a, center:[-24,-3] },
  { name:"Quartier des Objectifs",spec:"📸 Photographie",      color:0x5aa0c8, center:[24,-3] },
  { name:"Quartier des Racines",  spec:"🌿 Nature & jardins",   color:0x4f8f5a, center:[-24,17] },
  { name:"Quartier du Large",     spec:"🐚 Pêche & océan",      color:0x3fa6a1, center:[24,17] }
];

export const COLLECTIBLE_TYPES = {
  shell:   {emoji:"🐚", name:"Coquillage", color:0xffe9c7},
  gold:    {emoji:"🪙", name:"Or",          color:0xffcf4d},
  crystal: {emoji:"💎", name:"Cristal",     color:0x7fe8e0},
  flower:  {emoji:"🌺", name:"Fleur rare",  color:0xff6f9c},
  creature:{emoji:"🦋", name:"Petite bête", color:0xb98bff},
  fish:    {emoji:"🐟", name:"Poisson",     color:0x63b6ff},
  mappiece:{emoji:"🗺️", name:"Morceau de carte", color:0xe8d18a}
};

export const MISSION_TEMPLATES = [
  {id:"m1", type:"collect", item:"shell", count:3, zone:"Plage de départ", text:"a besoin de 3 coquillages trouvés près de la plage.", reward:25},
  {id:"m2", type:"reach",   target:"peak", label:"Sommet de la montagne", emoji:"📸", text:"Grimpe au sommet de la montagne et prends la vue au coucher du soleil.", reward:35},
  {id:"m3", type:"collect", item:"gold", count:2, zone:"Mine", text:"a besoin de 2 pépites d'or trouvées dans la mine.", reward:30},
  {id:"m4", type:"collect", item:"crystal", count:2, zone:"Grotte de la cascade", text:"a besoin de 2 cristaux trouvés dans la grotte derrière la cascade.", reward:35},
  {id:"m5", type:"reach",   target:"islet", label:"Un îlot secret", emoji:"🏝️", text:"Prends le bateau au quai et explore un îlot secret.", reward:30},
  {id:"m6", type:"collect", item:"flower", count:2, zone:"Prairie ou jungle", text:"a besoin de 2 fleurs rares trouvées dans la prairie ou la jungle.", reward:25},
  {id:"m7", type:"reach",   target:"peak2", label:"Point de vue de la montagne", emoji:"📸", text:"Retourne en haut de la montagne pour une photo du lever du soleil.", reward:20},
  {id:"m8", type:"collect", item:"creature", count:2, zone:"Jungle", text:"a besoin de 2 petites bêtes observées dans la jungle.", reward:25},
  {id:"m9", type:"reach",   target:"cave", label:"Grotte derrière la cascade", emoji:"🔎", text:"Explore la grotte secrète cachée derrière la grande cascade.", reward:20},
  {id:"m10",type:"collect", item:"fish", count:2, zone:"Le quai", text:"a besoin de 2 poissons pêchés près du port.", reward:20},
  {id:"m11",type:"reach",   target:"mine", label:"Fond de la mine", emoji:"⛏️", text:"Avance jusqu'au fond de la vieille mine.", reward:20},
  {id:"m12",type:"collect", item:"mappiece", count:1, zone:"Îlots secrets", text:"a besoin d'un morceau de carte trouvé sur un îlot.", reward:40}
];

export const SKIN_COLORS  = ['#ffe0c2','#ffd9a8','#e8b088','#c48a5c','#8a5a34','#5c3a22'];
export const HAIR_COLORS  = ['#1b1b1b','#4a2e1a','#8a5a2a','#d4a92a','#e6e6e6','#7a3ab5','#d1476b'];
export const EYE_COLORS   = ['#3b2a1a','#2a5a8a','#2f7a4a','#6a4a2a','#7a2a6a'];
export const SHIRT_COLORS = ['#FF7A59','#4FD1C5','#F4D8A0','#7a5ab5','#e05a7a','#3fa15a','#2b4a8a','#ffffff'];
export const PANTS_COLORS = ['#2F6B4F','#173B3B','#5a3a2a','#3a3a3a','#8a6a45','#4a2e6a','#c48a5c'];
export const HAT_COLORS   = ['#2F6B4F','#FF7A59','#e8d18a','#4FD1C5','#7a2a6a'];
export const HAIR_STYLES  = [
  {key:'court', label:'Court'}, {key:'carre', label:'Carré'},
  {key:'frise', label:'Frisé'}, {key:'chauve', label:'Sans cheveux'}
];

export const DEFAULT_APPEARANCE_P1 = {skin:'#ffd9a8', hairStyle:'court', hairColor:'#4a2e1a', eyes:'#3b2a1a', shirt:'#FF7A59', pants:'#2F6B4F', hat:true, hatColor:'#2F6B4F'};
export const DEFAULT_APPEARANCE_P2 = {skin:'#e8b088', hairStyle:'carre', hairColor:'#1b1b1b', eyes:'#2a5a8a', shirt:'#4FD1C5', pants:'#173B3B', hat:true, hatColor:'#4FD1C5'};

// Repères fixes du monde (montagne, point de vue secondaire, grotte, mine).
export const MOUNTAIN_PEAK = new THREE.Vector3(0, 34, -98);
export const PEAK2_POS = new THREE.Vector3(14, 28, -88);
export const CAVE_POS = new THREE.Vector3(3, 2, -107);
export const MINE_POS = new THREE.Vector3(-88, 1, -58);
