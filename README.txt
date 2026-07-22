ScaffR200 PRO V7.3 — correction définitive de la rotation 3D

Principale correction :
- La caméra n’utilise plus OrbitControls.
- La rotation est gérée directement par le canvas WebGL.
- Un doigt ou le clic gauche fait pivoter la scène.
- Le pincement à deux doigts contrôle le zoom.
- Le déplacement à deux doigts déplace la cible de la caméra.
- La molette contrôle le zoom sur ordinateur.
- Le canvas capture le pointeur pendant tout le geste.
- Les couches d’interface ne peuvent plus bloquer la rotation.
- Le panneau Inspection est fermé par défaut et repliable.
- Un double-clic permet d’inspecter une pièce sans perturber la rotation.

Les fonctions de géométrie, les dépassements, le faîtage et les diagonales
de la V7.2 sont conservés.

Migration automatique depuis V7.2, V7.1, V7.0 et les versions antérieures.

La scène Three.js est chargée depuis jsDelivr et nécessite une connexion Internet.
