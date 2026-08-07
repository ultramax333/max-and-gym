import {expect, Page, test} from '@playwright/test';
import packageJson from '../package.json';

async function bootstrapAnonymousProfile(page: Page): Promise<void> {
    await page.goto('./');
    await expect(page).toHaveURL(/#\/onboarding/);
    await page.evaluate(() => {
        localStorage.setItem('userName', 'Default User');
        localStorage.setItem('onboardingCompleted', 'true');
        localStorage.setItem('lang', 'en');
        localStorage.setItem('featureLevel', 'advanced');
        localStorage.setItem('useLbs', 'false');
    });
}

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
    const dimensions = await page.evaluate(() => ({viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth}));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
}

test('release identity and subpath routes are available', async ({page}) => {
    await bootstrapAnonymousProfile(page);
    await page.goto('./#/diagnostics');
    await expect(page.getByText(packageJson.version, {exact: true})).toBeVisible();
    await expect(page.getByText('8 / 2', {exact: true})).toBeVisible();
    await expect(page.getByText('deterministic-v1 / 3', {exact: true})).toBeVisible();
    await assertNoHorizontalOverflow(page);
});

test('@a11y phone routes have headings, named controls and no overflow', async ({page}) => {
    await bootstrapAnonymousProfile(page);
    for (const route of ['/', '/programs', '/progress', '/library', '/settings', '/diagnostics']) {
        await page.goto(`./#${route}`);
        await expect(page.locator('main, [role="main"]').first()).toBeVisible();
        await expect(page.locator('h1').first()).toBeVisible();
        await assertNoHorizontalOverflow(page);
        const unnamed = await page.locator('button:not([aria-label])').evaluateAll((buttons) => buttons.filter((button) => !(button.textContent ?? '').trim() && !button.getAttribute('title')).length);
        expect(unnamed).toBe(0);
    }
});

test('@a11y primary workout controls meet the 48px target', async ({page}) => {
    await bootstrapAnonymousProfile(page);
    await page.goto('./#/workout/active');
    const start = page.getByRole('button', {name: /start/i});
    await expect(start).toBeVisible();
    const box = await start.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
    await start.click();
    await expect(page.getByRole('button', {name: /complete set/i})).toBeVisible();
    await assertNoHorizontalOverflow(page);
});

test('Pixel 9a training screen scrolls and the 45-minute arm workout shows local photos', async ({page}) => {
    await bootstrapAnonymousProfile(page);
    await page.goto('./#/train');
    await expect(page.getByText(/^v\d+\.\d+\.\d+ · build (?:\d+|local)$/)).toBeVisible();
    const main = page.locator('main');
    const dimensions = await main.evaluate((element) => ({clientHeight: element.clientHeight, scrollHeight: element.scrollHeight}));
    expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
    await main.hover();
    await page.mouse.wheel(0, 1200);
    await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const lastCard = page.getByRole('heading', {name: 'Warm-up and core'});
    await lastCard.scrollIntoViewIfNeeded();
    await expect(lastCard).toBeVisible();

    await page.getByRole('heading', {name: 'Arms · 45 min'}).click();
    await expect(page.getByRole('heading', {name: 'Dumbbell Bicep Curl'})).toBeVisible();
    await expect(page.getByRole('img', {name: 'Dumbbell Bicep Curl starting position'})).toBeVisible();
    await expect(page.getByRole('img', {name: 'Dumbbell Bicep Curl finishing position'})).toBeVisible();
    const activeMain = page.locator('main');
    const activeDimensions = await activeMain.evaluate((element) => ({clientHeight: element.clientHeight, scrollHeight: element.scrollHeight}));
    expect(activeDimensions.scrollHeight).toBeGreaterThan(activeDimensions.clientHeight);
    await activeMain.hover();
    await page.mouse.wheel(0, 1600);
    await expect.poll(() => activeMain.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(page.getByRole('button', {name: 'Finish workout'})).toBeVisible();
});

test('@offline shell, workout and diagnostics reopen without network', async ({page, context}) => {
    await bootstrapAnonymousProfile(page);
    await page.goto('./#/workout/active');
    await page.getByRole('button', {name: /start/i}).click();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('button', {name: /complete set/i})).toBeVisible();
    await page.goto('./#/diagnostics');
    await expect(page.getByRole('button', {name: /self-test/i})).toBeVisible();
    await assertNoHorizontalOverflow(page);
});

test('@visual representative release screens render at the target viewport', async ({page}, testInfo) => {
    await bootstrapAnonymousProfile(page);
    for (const route of ['/', '/workout/active', '/progress', '/backup', '/diagnostics']) {
        await page.goto(`./#${route}`);
        await expect(page.locator('body')).toBeVisible();
        await page.screenshot({path: testInfo.outputPath(`${route.replaceAll('/', '-') || 'home'}.png`), fullPage: true});
        await assertNoHorizontalOverflow(page);
    }
});

test('representative use contacts only the production origin', async ({page}) => {
    const origins = new Set<string>();
    page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.protocol === 'http:' || url.protocol === 'https:') origins.add(url.origin);
    });
    await bootstrapAnonymousProfile(page);
    for (const route of ['/library', '/progress/photos', '/backup', '/diagnostics']) await page.goto(`./#${route}`);
    expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});
