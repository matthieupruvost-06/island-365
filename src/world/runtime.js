// État partagé du monde 3D en cours de jeu (scène, joueurs actifs, entités
// dynamiques...). Regroupé dans un objet mutable unique pour que tous les
// modules (players, missions, ui, ...) lisent/écrivent la même référence
// sans avoir besoin de se réimporter les uns les autres.
export const world = {
  scene: null,
  camera: null,
  renderer: null,
  clock: null,
  sunLight: null,
  waterMesh: null,
  waterGeo: null,
  boatMesh: null,
  shopMeshes: [],
  collectMeshes: [],
  players: [],
  currentArea: 'main',
  camHeading: Math.PI,
};
