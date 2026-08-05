import { joinRoom } from 'trystero';

// Connexion directe entre deux appareils (WebRTC), sans serveur à nous :
// Trystero se sert de relais publics gratuits juste pour que les deux
// téléphones se "présentent" l'un à l'autre (comme un carnet d'adresses),
// puis toutes les données du jeu passent directement de téléphone à
// téléphone. Le "code" tapé par les deux joueurs est simplement le nom de
// la salle dans laquelle ils se retrouvent.
const APP_ID = 'island365-matthieu-pruvost';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans 0/O/1/I, faciles à confondre

export function generateRoomCode() {
  let s = '';
  for (let i = 0; i < 4; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

let room = null;
let actions = {};
let peerId = null;

const listeners = { peerJoin: [], peerLeave: [], hello: [], pos: [], action: [], state: [], collectTaken: [] };
function emit(type, ...args) { listeners[type].forEach(fn => fn(...args)); }
export function on(type, fn) { listeners[type].push(fn); }

export function isConnected() { return !!room; }
export function hasPeer() { return !!peerId; }
export function getPeerId() { return peerId; }

export function connect(roomCode) {
  if (room) disconnect();
  room = joinRoom({ appId: APP_ID }, roomCode.toUpperCase());

  const names = ['hello', 'pos', 'action', 'state', 'collectTaken'];
  actions = {};
  for (const name of names) {
    actions[name] = room.makeAction(name);
    actions[name].onMessage = (data, ctx) => emit(name, data, ctx);
  }

  room.onPeerJoin = (id) => { peerId = id; emit('peerJoin', id); };
  room.onPeerLeave = (id) => { if (id === peerId) peerId = null; emit('peerLeave', id); };
}

export function disconnect() {
  if (room) { try { room.leave(); } catch (e) {} room = null; }
  actions = {};
  peerId = null;
}

export function sendHello(data) { actions.hello?.send(data); }
export function sendPos(data) { actions.pos?.send(data); }
export function sendAction(data) { actions.action?.send(data); }
export function sendState(data) { actions.state?.send(data); }
export function sendCollectTaken(data) { actions.collectTaken?.send(data); }
