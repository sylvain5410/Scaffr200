# ScaffR200 V0.1

Prototype PWA mobile pour préparer des chantiers en Comabi R200 Progress acier.

## Fonctions incluses

- Saisie du nombre de travées de 3,00 m
- Saisie du nombre de niveaux de 2,00 m
- Estimation automatique du matériel
- Planchers alu/bois
- Garde-corps classiques
- Diagonales estimées tous les 3 modules
- Plan 2D
- Sauvegarde locale
- Impression / export PDF depuis le navigateur
- Fonctionnement hors connexion après la première ouverture

## Lancer sur ordinateur

Le service worker nécessite un petit serveur local.

Avec Python :

```bash
cd ScaffR200
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080`.

## Publier gratuitement avec GitHub Pages

1. Créer un dépôt GitHub nommé `ScaffR200`.
2. Envoyer tous les fichiers de ce dossier.
3. Ouvrir **Settings > Pages**.
4. Choisir **Deploy from a branch**, branche `main`, dossier `/root`.
5. Ouvrir l’adresse fournie par GitHub.

## Installer sur iPhone

1. Ouvrir l’adresse de l’application dans Safari.
2. Appuyer sur **Partager**.
3. Choisir **Sur l’écran d’accueil**.
4. Valider avec **Ajouter**.

## Avertissement

Les quantités sont des estimations de préparation. Elles ne remplacent pas la notice fabricant, une étude de chantier, une note de calcul ni la validation par une personne compétente. Les amarrages, charges, consoles, bâchage et configurations particulières doivent être vérifiés.
