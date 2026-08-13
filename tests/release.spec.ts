import {expect, Page, test} from '@playwright/test';
import {readFileSync} from 'node:fs';

const packageVersion = (JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {version: string}).version;

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
    await expect(page.getByText(packageVersion, {exact: true})).toBeVisible();
    await expect(page.getByText('8 / 2', {exact: true})).toBeVisible();
    await expect(page.getByText('deterministic-v5 / 5', {exact: true})).toBeVisible();
    await assertNoHorizontalOverflow(page);
});

test('@a11y phone routes have headings, named controls and no overflow', async ({page}) => {
    await bootstrapAnonymousProfile(page);
    for (const route of ['/', '/train', '/train/core-videos', '/programs', '/programs/generate', '/progress', '/library', '/settings', '/apps', '/history', '/diagnostics']) {
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

test('Pixel 9a quick generator previews a coherent local session with photos', async ({page}) => {
    await bootstrapAnonymousProfile(page);
    await page.goto('./#/programs/generate');
    await expect(page.getByRole('heading', {name: 'Workout generator'})).toBeVisible();
    await expect(page.getByLabel('Body area')).toBeVisible();
    await expect(page.getByLabel('Duration')).toBeVisible();
    await expect(page.getByLabel('Recovery between sets')).toBeVisible();
    await page.getByRole('button', {name: 'Generate session'}).click();
    await expect(page.getByText('SESSION READY', {exact: true})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Start this session'})).toBeVisible();
    await expect(page.getByRole('img')).not.toHaveCount(0);
    await expect(page.getByRole('button', {name: 'Replace exercise'}).first()).toBeVisible();
    await assertNoHorizontalOverflow(page);
});

test('Pixel 9a training screen keeps every action reachable and the 45-minute arm workout shows local photos', async ({page}) => {
    await bootstrapAnonymousProfile(page);
    await page.goto('./#/workout/active');
    await page.getByRole('button', {name: 'Start'}).click();
    await page.goto('./#/train');
    await expect(page.getByText(/^v\d+\.\d+\.\d+ · build (?:\d+|local)$/)).toBeVisible();
    const main = page.locator('main');
    const lastCard = page.getByRole('heading', {name: 'Core video classes'});
    const dimensions = await main.evaluate((element) => ({clientHeight: element.clientHeight, scrollHeight: element.scrollHeight}));
    if (dimensions.scrollHeight > dimensions.clientHeight) {
        await main.hover();
        await page.mouse.wheel(0, 1200);
        await expect.poll(() => main.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    } else {
        await expect(lastCard).toBeInViewport();
    }
    await lastCard.scrollIntoViewIfNeeded();
    await expect(lastCard).toBeVisible();

    await page.getByRole('heading', {name: 'Arms · 45 min'}).click();
    await expect(page.getByRole('dialog', {name: 'Start Arms · 45 min?'})).toBeVisible();
    await page.getByRole('button', {name: 'Start arm workout'}).click();
    await expect(page.getByText('0/15 sets completed')).toBeVisible();
    const workoutPlan = page.getByRole('heading', {name: 'Workout plan · 5 exercises'}).locator('..');
    for (const exerciseName of ['Dumbbell Bicep Curl', 'Dumbbell One-Arm Triceps Extension', 'Hammer Curls', 'Decline Dumbbell Triceps Extension', 'Concentration Curls']) {
        await expect(workoutPlan.getByText(exerciseName, {exact: true})).toBeVisible();
    }
    await expect(page.getByRole('heading', {name: 'Dumbbell Bicep Curl'})).toBeVisible();
    await expect(page.getByRole('heading', {name: 'How to move'})).toBeVisible();
    await expect(page.getByRole('img', {name: 'Dumbbell Bicep Curl starting position'})).toBeVisible();
    await expect(page.getByRole('img', {name: 'Dumbbell Bicep Curl finishing position'})).toBeVisible();
    await expect(page.getByRole('button', {name: /use .* kg as default/i})).toBeVisible();
    await page.getByRole('button', {name: 'Switch here'}).first().click();
    await expect(page.getByRole('status')).toContainText('Exercise changed');
    await expect(page.getByRole('heading', {name: 'Dumbbell One-Arm Triceps Extension'})).toBeVisible();
    const activeMain = page.locator('main');
    const activeDimensions = await activeMain.evaluate((element) => ({clientHeight: element.clientHeight, scrollHeight: element.scrollHeight}));
    expect(activeDimensions.scrollHeight).toBeGreaterThan(activeDimensions.clientHeight);
    await activeMain.hover();
    await page.mouse.wheel(0, 1600);
    await expect.poll(() => activeMain.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(page.getByRole('button', {name: 'Finish workout'})).toBeVisible();
});

test('core video library remains local until a professional class is opened', async ({page}) => {
    await bootstrapAnonymousProfile(page);
    await page.goto('./#/train/core-videos');
    await expect(page.getByRole('heading', {name: 'Professional video classes'})).toBeVisible();
    await expect(page.getByText('5 classes · 0 added by you')).toBeVisible();
    const first = page.getByRole('link', {name: 'Open on YouTube'}).first();
    await expect(first).toHaveAttribute('href', /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/);
    await expect(first).toHaveAttribute('target', '_blank');
    await expect(first).toHaveAttribute('rel', /noopener/);
    await assertNoHorizontalOverflow(page);
});

test('a stale completed-set pointer recovers to the next set after reload', async ({page}) => {
    await bootstrapAnonymousProfile(page);
    await page.goto('./#/workout/active');
    await page.getByRole('button', {name: 'Start'}).click();
    await page.getByRole('button', {name: 'Complete set'}).click();
    await expect(page.getByText('1/6 sets completed')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Set 2'})).toBeVisible();

    await page.evaluate(async () => {
        const request = <T,>(value: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
            value.onsuccess = () => resolve(value.result);
            value.onerror = () => reject(value.error);
        });
        const database = await request(indexedDB.open('weightlog'));
        const read = database.transaction(['workoutSession', 'performedSet'], 'readonly');
        const sessions = await request(read.objectStore('workoutSession').getAll()) as Array<{id: string; status: string; currentSetId: string}>;
        const sets = await request(read.objectStore('performedSet').getAll()) as Array<{id: string; sessionId: string; status: string}>;
        const session = sessions.find((entry) => entry.status === 'active');
        const completed = sets.find((entry) => entry.sessionId === session?.id && entry.status === 'completed');
        if (!session || !completed) throw new Error('The stale-pointer fixture could not be created.');
        const write = database.transaction('workoutSession', 'readwrite');
        write.objectStore('workoutSession').put({...session, currentSetId: completed.id});
        await new Promise<void>((resolve, reject) => {
            write.oncomplete = () => resolve();
            write.onerror = () => reject(write.error);
            write.onabort = () => reject(write.error);
        });
        database.close();
    });

    await page.reload();
    await expect(page.getByText('1/6 sets completed')).toBeVisible();
    await expect(page.getByRole('heading', {name: 'Set 2'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Complete set'})).toBeVisible();
});

test('active workout route and expired rest timer recover after a process-style root launch', async ({page}) => {
    await bootstrapAnonymousProfile(page);
    await page.goto('./#/workout/active');
    await page.getByRole('button', {name: 'Start'}).click();
    await page.getByRole('button', {name: 'Complete set'}).click();
    await expect(page.getByText('1/6 sets completed')).toBeVisible();

    await page.evaluate(async () => {
        const request = <T,>(value: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
            value.onsuccess = () => resolve(value.result);
            value.onerror = () => reject(value.error);
        });
        const database = await request(indexedDB.open('weightlog'));
        const read = database.transaction('restTimer', 'readonly');
        const timers = await request(read.objectStore('restTimer').getAll()) as Array<{id: string; status: string}>;
        const timer = timers.find((entry) => entry.status === 'running');
        if (!timer) throw new Error('The running rest timer fixture is missing.');
        const write = database.transaction('restTimer', 'readwrite');
        write.objectStore('restTimer').put({...timer, endsAt: new Date(Date.now() + 300).toISOString()});
        await new Promise<void>((resolve, reject) => {
            write.oncomplete = () => resolve();
            write.onerror = () => reject(write.error);
            write.onabort = () => reject(write.error);
        });
        database.close();
    });

    await page.goto('./#/');
    await page.reload();
    await expect(page).toHaveURL(/#\/workout\/active/);
    await expect(page.getByRole('heading', {name: 'Set 2'})).toBeVisible();
    await expect.poll(() => page.evaluate(async () => {
        const request = <T,>(value: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
            value.onsuccess = () => resolve(value.result);
            value.onerror = () => reject(value.error);
        });
        const database = await request(indexedDB.open('weightlog'));
        const read = database.transaction('restTimer', 'readonly');
        const timers = await request(read.objectStore('restTimer').getAll()) as Array<{status: string}>;
        database.close();
        return timers.at(-1)?.status;
    })).toBe('completed');

    await expect(page.getByText('REST', {exact: true})).toHaveCount(0);
    await assertNoHorizontalOverflow(page);
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
    for (const route of ['/', '/train', '/programs', '/programs/generate', '/workout/active', '/progress', '/library', '/settings', '/apps', '/backup', '/diagnostics']) {
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
    for (const route of ['/library', '/train/core-videos', '/progress/photos', '/backup', '/diagnostics']) await page.goto(`./#${route}`);
    expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});
