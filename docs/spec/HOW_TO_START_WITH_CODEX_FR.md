# Démarrer avec Codex sans connaissances techniques

## Ce pack remplace l’ancien

Utilise uniquement le dossier `max-and-gym-repo-files-v2`. Ne mélange pas les anciens fichiers de conception avec cette version.

## 1. Créer le fork

Sur GitHub :

1. ouvre le dépôt `marcsances/repquest`;
2. clique sur **Fork**;
3. choisis ton compte;
4. nomme le dépôt `max-and-gym`;
5. conserve la branche par défaut pour le moment.

## 2. Ajouter ce pack

Décompresse l’archive `max-and-gym-repo-files-v2.zip`.

À la racine du fork :

1. **Add file**;
2. **Upload files**;
3. dépose tous les fichiers et dossiers;
4. message de validation :

```text
docs: add max&gym v2 implementation contract
```

5. valide.

Ne dépose pas le document tout-en-un en plus : il répète les fichiers individuels.

## 3. Connecter Codex

Dans Codex :

1. connecte GitHub;
2. autorise le dépôt `max-and-gym`;
3. ouvre un environnement sur ce dépôt;
4. choisis le mode de modification du code;
5. copie exactement `START_CODEX_TASK.txt`.

## 4. Règle essentielle

Codex doit travailler **une étape à la fois**.

À la fin de chaque étape, il doit :

- ouvrir une demande de fusion;
- fournir un rapport de checkpoint;
- donner les commandes et résultats;
- signaler les risques;
- s’arrêter.

Ne lui demande pas de continuer automatiquement.

## 5. Ce que tu vérifies à chaque checkpoint

Lis le rapport dans `docs/reports/`.

Vérifie :

- tous les contrôles sont-ils passés ?
- y a-t-il une erreur ignorée ?
- la base de données a-t-elle changé ?
- un moyen de retour/récupération est-il indiqué ?
- des captures d’écran sont-elles fournies pour l’interface ?
- des dépendances ou appels réseau ont-ils été ajoutés ?
- du code Workout.cool a-t-il été repris et correctement déclaré ?
- Codex s’est-il limité à la tâche ?

## 6. Ordre à respecter

1. Task 00 — audit.
2. Task 01 — fondation et diagnostics.
3. Task 02 — système visuel.
4. Task 03 — entraînement complet fiable.
5. Task 04 — bibliothèque d’exercices.
6. Task 05 — programmes manuels.
7. Task 06 — générateur et progression.
8. Task 07 — statistiques, photos et sauvegarde.
9. Task 08 — finalisation et publication.

## 7. En cas de problème

Ne vide pas les données du navigateur.

Récupère :

- l’identifiant d’erreur affiché;
- la version et le Git SHA dans Settings → Diagnostics;
- un export de diagnostic;
- les étapes exactes;
- le rapport du dernier checkpoint fonctionnel.

Utilise ensuite `docs/spec/HOW_TO_AUDIT_WITH_CHATGPT_FR.md`.

## 8. Fusion

Ne fusionne une demande que lorsque :

- le checkpoint est complet;
- les contrôles sont verts;
- les limites sont comprises;
- aucun changement inattendu n’apparaît.

Au moindre doute, fournis à ChatGPT le lien de la demande de fusion, le rapport de checkpoint et l’export de diagnostic.
