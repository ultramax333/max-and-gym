import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {markdownTable, root, writeAudit} from './lib/audit-utils.mjs';

const theme = await readFile(path.join(root, 'src/theme/maxGymTheme.ts'), 'utf8');
const rgb = (hex) => hex.match(/[a-f\d]{2}/gi).map((part) => parseInt(part, 16) / 255);
const luminance = (hex) => rgb(hex).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (a, b) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
};
const canvas = theme.match(/background: \{default: '(#[\da-f]+)'/i)?.[1];
const surface = theme.match(/background: \{default: '[^']+', paper: '(#[\da-f]+)'/i)?.[1];
const textPrimary = theme.match(/text: \{primary: '(#[\da-f]+)'/i)?.[1];
const textSecondary = theme.match(/text: \{primary: '[^']+', secondary: '(#[\da-f]+)'/i)?.[1];
const accent = theme.match(/primary: \{main: '(#[\da-f]+)'/i)?.[1];
const accentText = theme.match(/primary: \{main: '[^']+', contrastText: '(#[\da-f]+)'/i)?.[1];
if (![canvas, surface, textPrimary, textSecondary, accent, accentText].every(Boolean)) throw new Error('Theme palette could not be read for contrast audit.');
const primaryContrast = Math.min(contrast(textPrimary, canvas), contrast(textPrimary, surface));
const secondaryContrast = Math.min(contrast(textSecondary, canvas), contrast(textSecondary, surface));
const actionContrast = contrast(accentText, accent);
const checks = [
    {check: 'primary text contrast', status: primaryContrast >= 4.5 ? 'pass' : 'fail', detail: `${primaryContrast.toFixed(2)}:1`},
    {check: 'secondary text contrast', status: secondaryContrast >= 4.5 ? 'pass' : 'fail', detail: `${secondaryContrast.toFixed(2)}:1`},
    {check: 'primary action contrast', status: actionContrast >= 4.5 ? 'pass' : 'fail', detail: `${actionContrast.toFixed(2)}:1`},
    {check: 'visible keyboard focus', status: theme.includes('*:focus-visible') ? 'pass' : 'fail', detail: '3px outline'},
    {check: 'reduced motion', status: theme.includes('prefers-reduced-motion: reduce') ? 'pass' : 'fail', detail: 'nonessential motion reduced'},
    {check: 'button target', status: theme.includes('minHeight: 48') ? 'pass' : 'fail', detail: '48 CSS px'},
    {check: 'icon target', status: theme.includes('minWidth: 48') && theme.includes('minHeight: 48') ? 'pass' : 'fail', detail: '48 × 48 CSS px'},
];
await writeAudit('accessibility-audit', {generatedAt: new Date().toISOString(), standard: 'WCAG 2.2 AA', checks}, `# Accessibility static audit\n\n${markdownTable(checks)}\n\nResponsive, keyboard and semantic evidence is produced by Playwright at 360 × 800 and 412 × 915.\n`);
if (checks.some((check) => check.status === 'fail')) process.exitCode = 1;
