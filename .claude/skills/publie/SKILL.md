---
name: publie
description: Sauvegarde et met en ligne tout ce qui a été fait sur le jeu Island 365, en une seule fois et sans jamais demander de confirmation. Utilise ce skill dès que l'utilisatrice tape /publie, ou dès qu'elle demande en français simple de "publier", "mettre à jour le jeu", "envoyer les changements", "mettre en ligne" ou une formule équivalente pour ce dépôt. Ne jamais utiliser AskUserQuestion ni les mots techniques (commit, merge, build, push) dans la réponse finale à l'utilisatrice.
---

# Publier Island 365

Ce skill existe pour une seule raison : l'utilisatrice de ce dépôt a 13 ans,
ne connaît pas le vocabulaire Git, et le `CLAUDE.md` du dépôt autorise déjà
à l'avance de sauvegarder/publier automatiquement pour ce projet. Le rôle de
ce skill est de dérouler cette autorisation de façon fiable, toujours dans
le même ordre, sans jamais s'arrêter pour demander la permission — sauf
dans les deux cas prévus à l'étape 5.

Exécute ces étapes dans l'ordre, sans sauter d'étape.

## 1. Y a-t-il quelque chose à publier ?

```
git status --short
```

S'il n'y a aucun changement (rien à committer, la branche de travail est
déjà à jour avec `origin` et déjà fusionnée dans `main`), arrête-toi ici et
dis-le simplement : "Tout est déjà à jour, il n'y a rien de nouveau à
publier." Ne va pas plus loin.

## 2. Vérifier que rien n'est cassé

```
npm run build
```

C'est l'étape de sécurité : ne jamais publier un jeu qui ne démarre pas.

- **Si ça réussit** : continue à l'étape 3.
- **Si ça échoue** : ne publie rien. Regarde l'erreur, et :
  - si la cause est évidente et sans risque à corriger (faute de syntaxe,
    import manquant, etc.), corrige-la, relance `npm run build`, et
    recommence cette étape jusqu'à ce que ça passe ;
  - si tu ne comprends pas la cause ou que la correction n'est pas
    évidente, c'est le seul cas où tu peux t'arrêter et expliquer le
    problème simplement, sans jargon ("il y a un souci dans telle partie du
    jeu, je ne sais pas encore le réparer tout seul").

## 3. Sauvegarder les changements

```
git add -A
git commit -m "<message court et clair>"
git push -u origin <branche-de-travail-actuelle>
```

Le message de commit doit résumer en une phrase ce qui a changé (regarde
`git status`/`git diff` pour le déduire) — pas besoin de le montrer à
l'utilisatrice, c'est juste pour l'historique.

## 4. Mettre en ligne

La mise en ligne se déclenche automatiquement quand `main` reçoit les
changements (voir `.github/workflows/deploy.yml`, déploiement GitHub
Pages) — donc il faut faire arriver la branche de travail sur `main` :

```
git fetch origin main
git merge-base --is-ancestor origin/main HEAD && echo FAST_FORWARD_OK
```

- **Si `FAST_FORWARD_OK` s'affiche** (le cas normal, main n'a pas bougé
  depuis) :
  ```
  git push origin <branche-de-travail-actuelle>:main
  ```
- **Sinon** (main a reçu d'autres changements entre-temps) : fais un vrai
  merge au lieu d'un push direct — `git fetch origin main`, puis
  `git merge origin/main` sur la branche de travail. S'il y a un vrai
  conflit que tu ne peux pas résoudre sans changer le sens de ce qui a été
  fait, c'est le deuxième cas où tu peux t'arrêter et demander : explique
  simplement qu'il y a deux versions différentes du même endroit et
  demande laquelle garder. Sinon, résous, commit, et pousse vers `main`
  normalement.

## 5. Le dire simplement

Termine toujours par une phrase courte, chaleureuse, dans le style d'une
conversation avec une ado — jamais les mots "commit", "merge", "build",
"push", "déployer". Dire à la place des choses comme :

> C'est publié ! 🎉 Le jeu va se mettre à jour tout seul sur ton téléphone
> dans quelques minutes.

Si tu as dû corriger un souci à l'étape 2 avant de publier, tu peux le
mentionner en une phrase simple ("j'ai réparé un petit bug avant de
publier"), sans détail technique.
