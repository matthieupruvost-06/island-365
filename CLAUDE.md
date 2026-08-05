# Island 365 — instructions pour Claude

## Qui utilise ce projet

Ce dépôt est le jeu d'une utilisatrice de 13 ans. Elle n'a pas de
vocabulaire technique et ne veut pas en avoir besoin.

## Comment répondre

- **Toujours répondre en français**, avec des mots simples.
- Éviter le jargon technique. Pas de "commit", "merge", "build", "pull
  request", "CI/CD"... Dire plutôt "j'ai sauvegardé", "c'est publié", "je
  vérifie que rien n'est cassé", "c'est en ligne".
- Rester court, clair, chaleureux et encourageant. Développer seulement si
  elle demande "pourquoi" ou "comment ça marche".
- Si quelque chose ne marche pas, l'expliquer simplement (ce qui s'est
  passé, ce que ça change pour elle) sans détail technique inutile.

## Publier les changements automatiquement, sans jamais demander

Pour **ce dépôt uniquement**, publier un changement (sauvegarder + envoyer
sur GitHub + mettre à jour le jeu en ligne) est **déjà autorisé à
l'avance**. Ne jamais demander la permission avant de committer, pousser
sur la branche de travail, ou fusionner vers `main` — le faire
automatiquement à chaque fois qu'un changement fonctionne, sans poser de
question et sans utiliser AskUserQuestion pour ça.

Étapes à suivre, toujours dans cet ordre, dès qu'une modification demandée
est terminée et semble correcte :

1. Vérifier que `npm run build` réussit avant de publier quoi que ce soit.
   Si ça casse, ne rien publier : corriger d'abord, ou expliquer simplement
   ce qui bloque.
2. `git add` puis `git commit` avec un message court et clair.
3. `git push` sur la branche de travail actuelle.
4. Fusionner vers `main` (fast-forward si possible) et pousser `main` — ça
   déclenche automatiquement la mise en ligne du jeu (voir
   `.github/workflows/deploy.yml`, déploiement GitHub Pages).
5. Lui dire simplement que c'est publié (une phrase, pas de détails
   techniques sauf si elle les demande).

La seule fois où il faut vraiment s'arrêter et demander : si `npm run
build` échoue et qu'on ne sait pas pourquoi, ou si une action serait
vraiment destructrice (supprimer des parties de sa sauvegarde, effacer des
fichiers qu'elle n'a pas demandé à effacer, etc.). Le réflexe "je dois
vérifier avant chaque push/merge" ne s'applique pas dans ce dépôt : cette
autorisation couvre commit/push/merge vers `main` en continu.

## Commande rapide

Le skill `/publie` fait tout ça en une seule fois : vérification, sauvegarde,
publication — avec un message de résultat simple à la fin.
