import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {root, walk, writeAudit} from './lib/audit-utils.mjs';

const frenchCopy = /[àâçéèêëîïôùûüÿœæ]|\b(?:absente|accueil|aucun|aucune|ajouter|annuler|archiver|aux|avec|bibliothèque|cette|chargement|choisir|couvre|créer|dans|démarrer|des|données|durée|effacer|enregistrer|entraînement|équipement|exercice|fermer|fichiers|fusionner|grande|hanche|impossible|indisponible|invalide|introuvable|jour|jours|manquante|mesure|mesures|miniature|modifier|ou|ouvrir|poids|pour|prioritaire|prêt|programme|programmes|réglages|remplacer|repos|retour|sauvegarde|séance|séries|stockage|supprimer|terminer|travail|trop|une|valider|vide|vos|votre)\b/giu;
const files = (await walk('src', ['.ts', '.tsx']))
    .filter((file) => !/\.test\.[^.]+$/.test(file))
    .filter((file) => !file.includes(`${path.sep}i18n${path.sep}`));
const findings = [];

for (const file of files) {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    const source = await readFile(file, 'utf8');
    const scanSource = source.replace(/https?:\/\/[^\s'"`]+/g, (url) => ' '.repeat(url.length));
    for (const match of scanSource.matchAll(frenchCopy)) {
        const line = scanSource.slice(0, match.index).split('\n').length;
        findings.push({file: relative, line, text: match[0]});
    }
}

const report = {
    generatedAt: new Date().toISOString(),
    releaseLanguage: 'English',
    scannedFiles: files.length,
    findings,
};
const markdown = `# Release language audit\n\nRelease language: **English**.\n\nScanned production files: **${files.length}**.\n\nFrench-copy findings: **${findings.length}**.\n`;
await writeAudit('language-audit', report, markdown);
if (findings.length) process.exitCode = 1;
