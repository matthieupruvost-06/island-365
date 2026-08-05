# Island 365 🏝️

Une île procédurale en Three.js, jouable en solo ou en duo (2 joueurs sur le
même appareil), avec une mission différente chaque jour, un créateur de
personnage low-poly, et une sauvegarde locale par profil.

Ce dépôt est la reconstruction, en projet Vite multi-fichiers, du prototype
fonctionnel `island365-prototype.html` (fichier HTML unique). Toute la
logique et les valeurs numériques (positions, missions, couleurs...) ont été
conservées à l'identique ; seul le stockage a changé (voir ci-dessous).

## Lancer en local

```bash
npm install
npm run dev
```

Ouvre l'URL affichée (par défaut `http://localhost:5173`). Fonctionne au
clavier (ZQSD / flèches) et à la souris en desktop, au joystick tactile sur
mobile/tablette.

```bash
npm run build     # build de production dans dist/
npm run preview   # sert dist/ localement pour vérifier le build
```

## Déploiement

Le build est un site 100% statique (`dist/`), déployable n'importe où.

**GitHub Pages (recommandé, déjà configuré)** — le workflow
`.github/workflows/deploy.yml` build avec Vite et publie `dist/` à chaque
push sur `main`. Pour l'activer : Settings → Pages → Source → **GitHub
Actions**, sur ce dépôt. `vite.config.js` utilise `base: './'` (chemins
relatifs), donc aucun réglage de sous-chemin n'est nécessaire même si Pages
sert le site depuis `https://<user>.github.io/<repo>/`.

**Alternative — Vercel / Netlify** : importer le dépôt, build command
`npm run build`, output directory `dist`. Déploiement automatique à chaque
push, sans configuration supplémentaire.

Le jeu doit être servi en **HTTPS** (GitHub Pages, Vercel et Netlify le font
par défaut) : c'est nécessaire pour un usage tactile fiable sur mobile, et
requis pour l'installation en PWA ci-dessous.

## Installer sur iPhone (PWA)

Le jeu est une vraie PWA (manifest + service worker via `vite-plugin-pwa`) :
une fois déployé en HTTPS, il s'installe sur l'écran d'accueil comme une
app, en plein écran, et fonctionne même hors connexion après un premier
chargement.

Sur iPhone (Safari, obligatoire — Chrome iOS ne peut pas installer de PWA) :

1. Ouvre l'URL du jeu déployé dans **Safari**.
2. Appuie sur l'icône de partage (le carré avec la flèche vers le haut).
3. Choisis **"Sur l'écran d'accueil"**.
4. Lance le jeu depuis son icône sur l'écran d'accueil : il s'ouvre en plein
   écran, sans barre d'adresse.

**Mises à jour automatiques.** Le service worker est configuré en
`registerType: 'autoUpdate'` : à chaque nouveau déploiement (push sur
`main` → build → publication), la prochaine fois que tu rouvres l'app
depuis l'écran d'accueil, elle télécharge et applique la nouvelle version
automatiquement, sans rien à faire de ton côté et sans jamais toucher à tes
données de sauvegarde (voir section suivante).

## Stockage : localStorage, pas de compte, pas de réseau

Le prototype original tournait dans l'environnement des artifacts Claude.ai
et utilisait une API `window.storage.*` propre à cet environnement. Elle
n'existe pas une fois le jeu déployé sur un hébergeur classique.
`src/storage.js` la remplace par un module qui expose la même interface
asynchrone (`get`, `set`, `delete`, `list`) mais persiste réellement dans
`localStorage` du navigateur, avec les mêmes clés que le prototype :

- `profile-index` — liste des profils créés sur cet appareil
- `last-profile` — dernier profil actif (reprise automatique au lancement)
- `save-<profileId>` — sauvegarde complète d'un profil
- `island365-save` — clé legacy (avant l'introduction des profils), migrée
  automatiquement vers un premier profil solo si elle existe

**`localStorage` est local à l'appareil.** "Jouer en ligne" signifie ici que
le jeu est accessible via une URL, pas que deux joueurs sur deux appareils
partagent une partie en réseau. Le mode Duo reste volontairement local : deux
personnages, deux joysticks, sur le même écran — voir "Pistes futures"
ci-dessous pour un vrai multijoueur réseau.

### Ne pas perdre sa progression

`localStorage` survit aux fermetures de l'app, aux redémarrages du
téléphone et aux mises à jour du jeu (une mise à jour ne touche jamais aux
données de sauvegarde, seulement au code). En revanche, ce n'est pas un
coffre-fort absolu : un nettoyage manuel des données du navigateur/de
l'app, ou un changement de téléphone, effacerait la sauvegarde locale.

Pour se prémunir de ça, l'écran d'accueil propose deux boutons :

- **💾 Sauvegarder mes données** (une fois un profil sélectionné) — télécharge
  un fichier `island365-sauvegarde-AAAA-MM-JJ.json` contenant tous les
  profils et parties de cet appareil. À faire de temps en temps, ou avant de
  changer de téléphone.
- **📂 Restaurer une sauvegarde** (sur l'écran de choix du mode) — réimporte
  un fichier exporté précédemment, sur ce même appareil ou un autre.
  Pratique pour réinstaller la PWA sur un nouvel iPhone sans rien perdre.

## Structure du projet

```
index.html            squelette HTML (écran d'accueil, HUD, panneaux)
vite.config.js         base relative + configuration PWA (manifest, service worker)
public/
  icons/                icônes PWA (192/512/maskable)
  apple-touch-icon.png    icône pour l'écran d'accueil iOS
src/
  main.js              entrée : boot, wiring de l'écran d'accueil, boucle de jeu
  styles.css           tout le CSS (HUD, panneaux, écran d'accueil)
  storage.js           localStorage derrière l'interface get/set/delete/list
  backup.js             export / import manuel de la sauvegarde (fichier JSON)
  state.js             état de sauvegarde (freshState, currentDayIndex, save/load)
  profiles.js          profils multiples + migration de l'ancienne sauvegarde
  config.js             constantes : boutiques/quartiers, missions, collectibles,
                          apparence, repères du monde
  rng.js                RNG déterministe (seed fixe) pour un décor stable
  character.js          buildCharacterMesh(appearance) + créateur de personnage
  players.js             entités joueur, joystick/clavier, mouvement, caméra
  missions.js             mission du jour, interactions boutique/bateau/reach
  ui.js                   HUD, panneaux, minimap, toasts, écran d'accueil
  world/
    runtime.js            état runtime partagé (scène, joueurs actifs...)
    terrain.js            terrainInfo(), forme de l'île, terrain principal
    sky.js / ocean.js     ciel en dégradé, océan animé
    decor.js               palmiers/pins/arbres/rochers/fleurs + dispersion
    village.js              boutiques numérotées par quartier
    islets.js                 5 îlots secrets
    landmarks.js               cascade, entrée de mine, quai + bateau
    collectibles.js             objets à collectionner (spawn, ramassage)
```

Cette découpe suit les sections du prototype original — chaque fonction a
gardé son nom pour rester facile à comparer.

## Fonctionnalités

- Île procédurale (forme irrégulière, plage / prairie avec rivières et ponts
  / village / forêt + mine / jungle / montagne + cascade + grotte secrète),
  décor généré avec un RNG à seed fixe (disposition stable d'une session à
  l'autre).
- 5 îlots secrets accessibles en bateau depuis le quai.
- 48 boutiques numérotées réparties en 4 quartiers (conçu pour scaler
  jusqu'à 365 sans changer la logique — voir Pistes futures).
- Cycle de 12 missions du jour (livraison en boutique ou "reach" un lieu),
  qui tourne selon le jour réel écoulé depuis la création du profil (jour 1
  = création du profil), avec un bouton debug "jour suivant" dans le HUD.
- Créateur de personnage low-poly 100% généré par code (aucun modèle 3D
  chargé) : peau, coiffure, couleur de cheveux, yeux, haut/bas, chapeau.
- Profils multiples indépendants, solo ou duo (coopératif, un seul appareil,
  caméra partagée), avec reprise automatique du dernier profil utilisé.
- Joystick tactile + clavier (ZQSD/flèches), déplacement toujours relatif à
  l'orientation de la caméra.
- Sauvegarde automatique (debounce ~800 ms) à chaque changement d'état, plus
  export/import manuel en secours (voir "Ne pas perdre sa progression").
- Installable en PWA sur iPhone/Android, mises à jour automatiques, jouable
  hors connexion une fois installée.

## Pistes futures (hors-scope de cette passe)

- **Vrai multijoueur réseau** (deux appareils, une partie partagée en
  direct) : nécessiterait un serveur (WebSocket / Colyseus / Supabase
  Realtime) pour synchroniser positions et inventaire, et une base de
  données partagée à la place de `localStorage`. Chantier séparé.
- Passage de 48 à 365 boutiques réellement modélisées.
- Rédaction de 365 missions uniques plutôt qu'un cycle de 12.

## Tester sur mobile

Le joystick tactile et les panneaux coulissants sont les points les plus
sensibles au portage : teste sur un vrai téléphone (Safari iOS et Chrome
Android), pas seulement en responsive desktop, avant de considérer une
modification comme terminée.
