# Audit de l'application et des composants — 22 septembre 2026

## Périmètre et verdict

- Mode : DIAGNOSE, audit demandé par le propriétaire ; aucun changement du code produit.
- Révision : `a75368a31d12c04f7e04fef250d1764b2dec9ebf`, branche `feat/personal-equipment-gym-access-v1.12.0`.
- PR #30 ouverte et non fusionnée à la consultation : https://github.com/ultramax333/max-and-gym/pull/30.
- Version affichée : 1.11.4 ; schéma 8 ; export 2 ; seed `fedb-b0eed061e1c8-reviewed-8` ; cache 9.
- Constat : fonctionnement courant solide dans les parcours couverts, mais version non prête à publier sans corrections. Quatre problèmes fonctionnels ont été reproduits, avec une incohérence de version et des défauts de validation supplémentaires.
- Données : profils Chromium neufs, données synthétiques et IndexedDB simulée uniquement. Aucune lecture/modification des séances personnelles du téléphone ; sauvegarde personnelle sans objet pour cet audit isolé.

## Résultats vérifiés

| Contrôle | Résultat |
| --- | --- |
| TypeScript | Passe |
| ESLint du périmètre habituel + `src/gym` | Passe |
| Suite unitaire/composants/migrations | 58 fichiers, 275 tests réussis |
| Build production et smoke GitHub Pages | Passent |
| Parcours Chromium 360 × 800 et 412 × 915 | 34 réussites / 36 ; 2 échecs pour le même sélecteur de badge |
| Hors ligne, reprise séance/timer, remplacement, séries, résumé | Parcours existants réussis sur les deux formats mobiles |
| Présentation desktop | Captures 1440 × 1000 dans le test design ; pas de test sur téléphone physique |
| Catalogue | 307 exercices contrôlés ; 614 images locales ; aucune image invalide |
| Architecture / réseau / assets / accessibilité statique / performance | Passent, avec avertissements d'accès direct aux données dans les anciennes pages |
| Audit Android statique | Passe |
| Audit langue | Échoue sur le `è` de l'adresse officielle `Rue de Genève 8` : faux positif |
| Audit licences local | Échoue : 16 dépendances imbriquées non résolues par l'auditeur ; voir limites ci-dessous |
| CI de la PR | Android APK : succès ; Quality et Chromium : échecs |

Le passage des tests existants ne couvre pas les cas manquants décrits ci-dessous. Quatre assertions diagnostiques supplémentaires échouent comme attendu et rendent trois de ces défauts reproductibles.

## F1 — P1 : la version web recharge pendant une séance

**Fait reproduit.** Sur une copie du build servie sur un port localhost isolé, démarrer une séance, saisir une charge synthétique de `123` sans valider, puis présenter une nouvelle révision du service worker. La page se recharge et retrouve la séance, mais le champ revient à la cible `16`. Les valeurs sont exclusivement des fixtures anonymes.

**Cause.** `vite.config.ts:61–65` impose `autoUpdate`, `skipWaiting` et `clientsClaim`. `PwaContext.tsx` n'intercepte pas le rechargement en présence d'une séance ou d'une écriture. Le code installé de `vite-plugin-pwa` appelle directement `window.location.reload()` lors de l'activation d'une mise à jour. Le test `pwaConfig.test.ts` entérine actuellement ce comportement au lieu de vérifier la protection de séance.

**Portée.** PWA/web uniquement : `disable: isAndroidBuild` désactive ce service worker dans l'APK. Le test prouve la perte d'un brouillon de saisie, pas une perte de séries déjà enregistrées. FM-03 et politique `PWA_UPDATE_STATE_MACHINE.md` concernés.

**Correction minimale.** Différer activation et rechargement tant qu'une séance ou une écriture critique est active ; conserver aussi le brouillon ou demander explicitement sa validation. Couvrir la livraison d'une mise à jour pendant la saisie et pendant la sauvegarde.

## F2 — P1 : les corrections de matériel ne pilotent pas les filtres

**Fait reproduit.** Créer un exercice synthétique initialement `barbell`, corriger son équipement requis en `cable`. Le badge et le regroupement indiquent bien Cables, mais `hasAvailableEquipment(exercise, ['cable'])` retourne faux et le filtre Câble de la bibliothèque ne retrouve pas l'exercice.

**Cause.** `ExerciseCatalogRepository.ts:16–30` fusionne les nouveaux champs d'équipement sans créer de matériel effectif commun. Le filtre de bibliothèque (`:66`) et `selection.ts:55–56` lisent toujours `equipmentTags` d'origine. Le générateur et les alternatives consomment ce dernier prédicat.

**Correction minimale.** Centraliser la résolution du matériel effectif et distinguer matériel de résistance et support auxiliaire. Les corrections de résistance doivent être prises en compte par les filtres, l'éligibilité et les substitutions ; le banc auxiliaire ne doit pas devenir à tort une catégorie de résistance. Garder le matériel principal comme règle de regroupement. Régression introduite avec `a75368a`.

## F3 — P2 : images des exercices personnels absentes pendant la séance

**Fait reproduit.** Un exercice personnalisé possède un Blob `customImage` dans le dépôt. `resolveWorkoutExerciseMedia` retourne néanmoins une liste vide. L'affichage actif utilise ce résultat ; la bibliothèque affiche aussi « No photo » pour les cartes personnelles, et le générateur ne lit que les assets de `media`.

**Cause.** `workoutExerciseMedia.ts:16–23` ne gère que `start-image` et `end-image`. `createCustom` stocke l'image dans `customImage` et initialise `media: []`. Seule la fiche détaillée possède un chemin distinct pour le Blob.

**Correction minimale.** Un composant/hook de média partagé pour catalogue et image personnelle, avec création et libération maîtrisées des URL Blob, état de chargement et fallback. Le réutiliser dans bibliothèque, aperçu, alternatives et séance. Défaut préexistant ; premier commit fautif non recherché.

## F4 — P2 : les erreurs de sauvegarde du matériel ne sont pas expliquées

**Fait reproduit.** Dans un profil de test, faire échouer uniquement l'écriture `exercisePreference.put` avec une erreur synthétique `QuotaExceededError`, puis appuyer sur Save. Une erreur non gérée remonte au navigateur. La boîte reste ouverte et ne montre que son message d'aide initial, sans indication de l'échec.

**Cause.** `EquipmentEditorDialog` (`LibraryPages.tsx:93–121`) appelle la sauvegarde/restauration sans `try/catch`, état d'attente ou message d'erreur. Les préférences salle/affluence ont le même manque dans leurs handlers ; ce dernier chemin est confirmé par lecture, pas par injection navigateur.

**Correction minimale.** État `saving`, boutons protégés contre les clics répétés, message actionnable, diagnostic stable et fermeture seulement après succès. Tester une écriture refusée et la nouvelle tentative. Les échecs de chargement de bibliothèque méritent le même traitement.

## F5 — P2 : identité du générateur incohérente

**Fait reproduit.** `src/generator/types.ts:3` annonce `deterministic-v14` tandis que `src/config/buildIdentity.ts:5` reste sur `deterministic-v13`. Le générateur de l'interface utilise la constante de build : les nouvelles séances sont donc estampillées v13. Diagnostics et manifeste de backup prennent également cette ancienne valeur.

**Correction minimale.** Une seule constante partagée entre domaine, UI, diagnostics et exports ; assertion de cohérence dans les tests. Les tests de domaine importent aujourd'hui la v14, tandis que l'E2E attend encore la v13, ce qui masque l'incohérence. Régression dans `a75368a`.

## F6 — P2 : les contrôles de livraison ne sont pas tous verts

- Deux E2E échouent sur `tests/release.spec.ts:174` : attente exacte `Back-extension bench` contre affichage `★ Back-extension bench`. L'exercice et son badge sont effectivement présents ; ce défaut est dans l'attente du test. Donner à l'icône un traitement décoratif et au badge un nom accessible stable, puis vérifier son sens plutôt que sa décoration.
- L'audit de langue rejette une adresse officielle avec accent (`src/gym/occupancy.ts:8`). Il doit distinguer les noms/adresses des textes d'interface, au lieu de supprimer l'accent de l'adresse ou de désactiver le contrôle globalement.
- CI Quality échoue à `npm run quality`. L'échec local de l'audit langue explique une cause suffisante reproductible ; les logs complets de CI n'ont pas été récupérés, donc le sous-contrôle qui échoue en premier sur GitHub reste à confirmer.
- L'audit licences lit les chemins imbriqués du lockfile npm, alors que cette installation locale utilise une disposition `.pnpm`. Il annonce 16 `UNKNOWN`. Exemple vérifié : Chalk utilisé par ESLint est résolu sous `.pnpm/chalk@4.1.2/...` et son manifeste fournit `MIT`. Cela démontre au moins un faux inconnu ; les 16 n'ont pas été tous vérifiés individuellement. Ne pas interpréter ce rapport comme 16 licences réellement manquantes.

CI publique consultée sans token :

- Quality : https://github.com/ultramax333/max-and-gym/actions/runs/35622597415/job/106409065212
- Chromium : https://github.com/ultramax333/max-and-gym/actions/runs/35622597439/job/106409064481
- Android : https://github.com/ultramax333/max-and-gym/actions/runs/35622597468/job/106409064600

## Composants à perfectionner ensuite

1. **Accès matériel pendant la séance.** Ajouter « Corriger matériel / Accès difficile » à la fiche de l'exercice actif et à son aperçu. Aujourd'hui il faut quitter la séance pour retrouver la fiche de bibliothèque. Réutiliser le même éditeur avec retour clair à la séance.
2. **Salle et affluence.** Montrer un résumé compact à côté du bouton Générer. Les contrôles sont actuellement cachés sous « Equipment and variation » après le champ technique « Variation seed ». Expliquer « estimation locale » et rendre le retour au mode automatique évident ; les choix « now » sont actuellement persistés sans expiration.
3. **Images et cartes cohérentes.** Partager la présentation et la résolution des photos entre les quatre écrans ; permettre un agrandissement simple. Les doubles vues restent utiles, mais apparaissent petites à 360 px. Cette amélioration peut traiter F3 en même temps.
4. **Éditeur équipement.** Conserver le panneau mobile observé sans débordement à 360 px, placer Save comme action principale pleine largeur, et séparer visuellement Restore. L'étoile doit être expliquée comme « matériel principal » ; éviter la confusion avec les favoris.
5. **Bibliothèque.** Rechercher avec un léger délai et ignorer les résultats obsolètes ; éviter de relire/rendre toute la collection à chaque frappe. Distinguer chargement, introuvable et erreur. Découper les éditeurs et les cartes actuellement regroupés dans `LibraryPages.tsx` pour les tester séparément.

Le design sombre, les contrôles de charge/répétitions et la barre de validation sont lisibles sur les captures examinées. Une nouvelle refonte globale n'est pas prioritaire.

## Preuves et commandes reproductibles

Exécutable utilisé : `C:/Users/maxim/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe` (Node 24.19.0). Le lanceur npm n'est pas disponible dans le PATH local ; ses commandes ont été exécutées directement avec Node.

```text
node scripts/doctor.mjs
node node_modules/typescript/bin/tsc --noEmit
node scripts/run-tests.mjs
node scripts/build.mjs
node scripts/bundle-report.mjs
node scripts/smoke-pages.mjs
node scripts/audit-project.mjs
node scripts/audit-network.mjs
node scripts/audit-architecture.mjs
node scripts/audit-accessibility.mjs
node scripts/audit-performance.mjs
node scripts/audit-android-release.mjs
node scripts/audit-exercise-classification.mjs
node scripts/audit-exercise-assets.mjs
node scripts/audit-dependencies.mjs
node scripts/audit-assets.mjs
node scripts/audit-licenses.mjs
node scripts/audit-language.mjs
node artifacts/incidents/2026-09-22-app-audit/run-regressions.mjs
node artifacts/incidents/2026-09-22-app-audit/browser-probes.mjs
node artifacts/incidents/2026-09-22-app-audit/run-browser-matrix.mjs
```

ESLint : arguments du script `lint` de `package.json`, exécutés via `node_modules/eslint/bin/eslint.js`, avec `src/gym` ajouté et `--max-warnings 0` conservé.

Le probe navigateur lance le scénario F1 par défaut ; définir `AUDIT_UI_ONLY=1` lance l'inspection du panneau puis l'injection d'erreur F4. Les scripts sont dans `artifacts/incidents/2026-09-22-app-audit/`, hors code produit. Les quatre assertions de `regressions.test.ts` sont volontairement en échec avant correction.

La première matrice Playwright standard est restée bloquée à la fermeture du serveur Windows ; elle a été interrompue. Une seconde exécution sur le build frais avec serveur géré séparément s'est terminée normalement : 34 pass, 2 fail, zéro flaky, en 112 secondes. Rapport JSON : `artifacts/incidents/2026-09-22-app-audit/browser-results.json`. Captures : `browser-results/` et `equipment-editor-360.png` dans le même dossier.

## Limites, récupération et suite

- Les tests ne certifient pas les alarmes, le retour Android ou l'installateur sur Pixel physique. La compilation Android en CI et ses contrôles statiques passent.
- Aucun effacement de stockage, migration, changement d'export/cache, push, fusion ou déploiement effectué pendant cet audit.
- Les changements préexistants du répertoire de travail sont conservés. Les audits ont régénéré leurs rapports habituels.
- `PROJECT_STATUS.md` est obsolète (Task 00 / version inexistante) ; le doctor affiche également un schéma 3 et « prompt » contrairement au code actuel. Ces résumés doivent être dérivés des vraies constantes pour éviter de fausser les diagnostics futurs.
- Aucun retour arrière de données requis. Avant une livraison corrective, traiter F1/F2, unifier les médias et la version, protéger les sauvegardes et rétablir les contrôles de livraison. Rejouer les nouveaux cas avant publication ; vérifier ensuite le comportement Android sur appareil.
