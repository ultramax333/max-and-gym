# Faire auditer max&gym par ChatGPT

## Audit automatisé par Codex pendant le projet

Lorsqu’un problème apparaît, lancer le contenu de `RUN_PROJECT_AUDIT.txt`.

Cette commande appelle `CODEX_TASKS/90_DIAGNOSTIC_AUDIT.md` en mode diagnostic. Codex doit alors :

1. préserver les preuves;
2. reproduire le problème;
3. comparer avec le dernier checkpoint accepté;
4. tester séparément le build, le routage, le service worker, IndexedDB, les transactions, les timers, le générateur, les médias et l’interface selon le symptôme;
5. créer un test qui échoue, lorsque c’est possible;
6. produire `docs/reports/incidents/<incident>-root-cause.md`;
7. s’arrêter sans modifier le produit.

Une correction est autorisée uniquement lorsque la demande contient explicitement `MODE=FIX`. Elle doit rester minimale, préserver les données et ajouter un test de non-régression.


## Pour auditer une demande de fusion

Fournis :

1. le lien du dépôt;
2. le numéro de la demande de fusion;
3. le fichier `docs/reports/<task>-checkpoint.md`;
4. le rapport `project-audit.md`;
5. les captures d’écran;
6. le checkpoint visé;
7. le message exact de Codex.

Demande :

```text
Audite cette demande de fusion de max&gym par rapport à AGENTS.md,
au checkpoint concerné, aux tests d’acceptation et à la matrice de
traçabilité. Cherche les risques de perte de données, les changements
hors périmètre, les erreurs de migration, les dépendances serveur ou
UI interdites, les appels réseau, les problèmes PWA, les violations
de licence et les tests manquants. Donne un verdict: accepter,
demander des corrections ou refuser.
```

## Pour isoler un bug

Fournis :

- identifiant d’erreur;
- version de l’application;
- Git SHA;
- export `max-and-gym-diagnostics-...zip`;
- étapes exactes;
- comportement attendu;
- comportement observé;
- téléphone/navigateur;
- présence ou non du réseau;
- dernier checkpoint connu comme fonctionnel.

Demande :

```text
Analyse le diagnostic max&gym. Classe la cause probable entre build,
routing, service worker/cache, base IndexedDB/migration, transaction
d’entraînement, timer, générateur, média/stockage, sauvegarde/import
ou rendu UI. Donne la preuve, les hypothèses restantes, le test
automatisé à ajouter, le changement minimal et les contrôles à
relancer. Ne propose pas de vider la base de données.
```

## Pour comparer deux versions

Fournis les deux Git SHA ou tags de checkpoint et demande :

```text
Compare ces deux checkpoints et identifie le plus petit ensemble de
commits pouvant avoir introduit le défaut. Propose une stratégie de
git bisect, les états à reproduire et le test de non-régression.
```

## Données à ne pas transmettre

L’export diagnostic est conçu pour être anonymisé. Ne transmets pas :

- sauvegarde personnelle `.maxgym`;
- photos;
- notes;
- mesures;
- détails d’entraînement réels;

sauf décision explicite et nécessaire.
