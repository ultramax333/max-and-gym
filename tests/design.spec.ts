import {expect, test} from '@playwright/test';

test('modern interface keeps navigation, exercise controls and complete backup accessible @visual @a11y', async ({page, context}, testInfo) => {
    await context.grantPermissions(['notifications']);
    await page.goto('./');
    await expect(page).toHaveURL(/#\/onboarding/);
    await page.evaluate(() => {
        localStorage.setItem('userName', 'Default User');
        localStorage.setItem('onboardingCompleted', 'true');
        localStorage.setItem('lang', 'en');
    });
    const routes = [['/', 'Ready to train'], ['/train', 'Choose your workout'], ['/programs/generate', 'Workout generator'], ['/programs', 'Your training plans'], ['/library', 'Library'], ['/progress', 'A clear view of your consistency'], ['/settings', 'Settings']];
    for (const [route, heading] of routes) {
        await page.goto(`./#${route}`);
        await expect(page.getByRole('heading', {level: 1, name: heading, exact: true})).toBeVisible();
        if (route === '/library') {
            await expect(page.getByRole('heading', {level: 2}).first()).toBeVisible();
            expect(await page.locator('button button').count()).toBe(0);
            await expect(page.getByRole('button', {name: 'Add to favourites'}).first()).toBeVisible();
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        expect(overflow).toBe(false);
        await page.screenshot({path: testInfo.outputPath(`design-${route.replaceAll('/', '-') || 'home'}.png`)});
    }
    await page.getByRole('button', {name: /Backup & Import/}).click();
    await expect(page).toHaveURL(/#\/backup$/);
    await expect(page.getByRole('heading', {name: 'Personal .maxgym backup'})).toBeVisible();

    await page.goto('./#/train');
    await page.getByRole('heading', {name: 'Arms · 45 min', exact: true}).click();
    await page.getByRole('button', {name: 'Start workout', exact: true}).click();
    const photosLoaded = () => page.locator('main img').evaluateAll((images) => images.length > 0 && images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0));
    await expect.poll(photosLoaded).toBe(true);
    const load = page.getByRole('spinbutton', {name: 'Load', exact: true});
    const reps = page.getByRole('spinbutton', {name: 'Repetitions', exact: true});
    await load.scrollIntoViewIfNeeded();
    const loadBox = await load.boundingBox();
    const repsBox = await reps.boundingBox();
    expect(loadBox).not.toBeNull();
    expect(repsBox).not.toBeNull();
    expect(Math.abs(loadBox!.y - repsBox!.y)).toBeLessThan(5);
    expect(repsBox!.x + repsBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await reps.fill('5');
    await expect(reps).toHaveValue('5');
    await expect(page.getByRole('button', {name: 'Complete set', exact: true})).toBeVisible();
    await page.screenshot({path: testInfo.outputPath('design-active.png')});
    await page.getByRole('button', {name: 'Complete set', exact: true}).click();
    await expect(page.getByRole('button', {name: 'Pause rest'})).toBeVisible();
    await expect.poll(photosLoaded).toBe(true);
    await page.screenshot({path: testInfo.outputPath('design-rest.png')});

    await page.setViewportSize({width: 1440, height: 1000});
    await page.goto('./#/train');
    await expect(page.getByRole('heading', {name: 'Choose your workout'})).toBeVisible();
    await page.screenshot({path: testInfo.outputPath('design-desktop.png')});
});
