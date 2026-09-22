import {test, expect} from '@playwright/test';
import http from 'node:http';
import path from 'node:path';
import {readFile} from 'node:fs/promises';

// Serve an isolated production build and change only the worker response. No
// personal profile or repository build file is modified by this regression.
test('a waiting web update preserves active drafts until all tabs close', async ({page, context}) => {
    let revision = 1;
    const root = path.resolve('build');
    const mime: Record<string, string> = {'.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json'};
    const server = http.createServer(async (request, response) => {
        try {
            const relative = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname).replace(/^\/max-and-gym\//, '') || 'index.html';
            const file = path.resolve(root, relative);
            if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
            const body = await readFile(file);
            response.writeHead(200, {'Content-Type': mime[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store'});
            response.end(relative === 'sw.js' ? Buffer.concat([body, Buffer.from(`\n// regression revision ${revision}\n`)]) : body);
        } catch { response.writeHead(404).end(); }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${(server.address() as {port: number}).port}/max-and-gym/`;
    try {
        await page.goto(base);
        await expect(page).toHaveURL(/#\/onboarding/);
        await page.evaluate(() => {
            localStorage.setItem('userName', 'Default User');
            localStorage.setItem('onboardingCompleted', 'true');
            localStorage.setItem('lang', 'en');
        });
        await page.goto(`${base}#/workout/active`);
        await page.getByRole('button', {name: 'Start', exact: true}).click();
        const load = page.getByRole('spinbutton', {name: 'Load', exact: true});
        await expect(load).toBeVisible();
        await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
        await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
        await load.fill('123');
        let reloads = 0;
        page.on('framenavigated', frame => { if (frame === page.mainFrame()) reloads++; });
        revision = 2;
        await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
        await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting));
        await page.getByRole('button', {name: 'How to update'}).click();
        await expect(page.getByText('Finish the active workout and any save or import before updating.')).toBeVisible();
        const other = await context.newPage();
        await other.goto(`${base}#/diagnostics`);
        await expect(other.getByRole('button', {name: 'How to update'})).toBeVisible();
        expect(reloads).toBe(0);
        await expect(load).toHaveValue('123');
        expect(await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(true);
        await other.close();
        await page.close();
        const reopened = await context.newPage();
        await reopened.goto(base);
        await reopened.waitForFunction(async () => {
            const worker = await navigator.serviceWorker.getRegistration();
            return Boolean(worker?.active && !worker.waiting);
        });
        await expect(reopened.getByRole('button', {name: 'Complete set', exact: true})).toBeVisible();
        await reopened.close();
    } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
