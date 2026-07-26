# ScaffR200 PRO — GitHub Pages

Base officielle de publication : **V10.1.3 — Phase 1 GitHub**.

## Fichiers à conserver à la racine

- `index.html`
- `core-engine-v10102-20260725.js`
- `service-worker.js`
- `.nojekyll`

## Publication

Dans GitHub : **Settings → Pages → Deploy from a branch → main → /(root) → Save**.

L'adresse du site sera :

`https://sylvain5410.github.io/scaffr200-s/`

Le bandeau de l'application doit afficher :

`Build 10.1.3 GITHUB · 26/07/2026`

## Mise à jour

Remplacer les fichiers à la racine du dépôt puis valider avec **Commit changes**. Le fichier `index.html` désinscrit les anciens service workers et supprime les anciens caches au chargement pour éviter qu'une ancienne version reste affichée.
