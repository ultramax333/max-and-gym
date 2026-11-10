import {expect, Page, test} from '@playwright/test';

async function bootstrap(page: Page) {
    await page.goto('./');
    await expect(page).toHaveURL(/#\/onboarding/);
    await page.evaluate(() => {
        localStorage.setItem('userName', 'Default User');
        localStorage.setItem('onboardingCompleted', 'true');
        localStorage.setItem('lang', 'en');
    });
    await page.goto('./#/train/local-videos');
    await expect(page.getByRole('heading', {name: 'Your videos', exact: true})).toBeVisible();
}
/** Generated in the isolated test browser, never actual personal footage. */
async function syntheticClip(page: Page): Promise<Buffer> {
    const bytes = await page.evaluate(async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 180;
        const context = canvas.getContext('2d')!;
        context.fillStyle = '#15181B'; context.fillRect(0, 0, 320, 180);
        context.fillStyle = '#C8F36B'; context.font = '20px sans-serif'; context.fillText('Synthetic test video', 40, 90);
        const stream = canvas.captureStream(10);
        const recorder = new MediaRecorder(stream, {mimeType: 'video/webm;codecs=vp8'});
        const blob = await new Promise<Blob>(resolve => {
            const chunks: Blob[] = [];
            recorder.ondataavailable = event => {if (event.data.size) chunks.push(event.data);};
            recorder.onstop = () => resolve(new Blob(chunks, {type: 'video/webm'}));
            recorder.start();
            setTimeout(() => {context.fillRect(0, 0, 4, 4);}, 100);
            setTimeout(() => recorder.stop(), 350);
        });
        stream.getTracks().forEach(track => track.stop());
        return Array.from(new Uint8Array(await blob.arrayBuffer()));
    });
    return Buffer.from(bytes);
}
async function noOverflow(page: Page) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
}
test('personal video batches sort into Abs, preserve difficulty and play offline @offline @visual', async ({page, context}, testInfo) => {
    await bootstrap(page);
    const clip = await syntheticClip(page);
    await page.getByLabel('Choose local videos').setInputFiles([
        {name: 'Synthetic abs.webm', mimeType: 'video/webm', buffer: clip},
        {name: 'Synthetic back.webm', mimeType: 'video/webm', buffer: clip},
    ]);
    await expect(page.getByRole('status').filter({hasText: '2 of 2 videos imported'})).toBeVisible();
    await expect(page.getByText('2 to sort', {exact: true})).toBeVisible();
    const first = page.getByRole('article', {name: 'Synthetic abs', exact: true});
    await first.getByRole('button', {name: 'Edit details'}).click();
    await page.getByRole('checkbox', {name: 'Abs / core', exact: true}).check();
    await page.getByRole('checkbox', {name: 'Back', exact: true}).check();
    await page.getByRole('combobox', {name: /^Difficulty/}).click();
    await page.getByRole('option', {name: '4 / 5 — Hard', exact: true}).click();
    await page.getByLabel('Duration (minutes)', {exact: true}).fill('15');
    await page.getByRole('button', {name: 'Save video details'}).click();
    await expect(page.getByText('1 to sort', {exact: true})).toBeVisible();
    await page.getByRole('combobox', {name: /^Body area/}).click();
    await page.getByRole('option', {name: 'Abs / core', exact: true}).click();
    await expect(page.getByRole('article')).toHaveCount(1);
    await page.getByRole('button', {name: 'More filters', exact: true}).click();
    await page.getByRole('combobox', {name: /^Difficulty filter/}).click();
    await page.getByRole('option', {name: '4 / 5 — Hard', exact: true}).click();
    await page.getByRole('combobox', {name: /^Video duration/}).click();
    await page.getByRole('option', {name: 'Up to 15 min', exact: true}).click();
    await expect(page.getByRole('article')).toHaveCount(1);
    await page.reload();
    await expect(page.getByRole('article', {name: 'Synthetic abs', exact: true})).toBeVisible();
    await expect(page.getByRole('combobox', {name: 'Difficulty for Synthetic abs'})).toContainText('4 / 5');
    await noOverflow(page);
    await page.screenshot({path: testInfo.outputPath('personal-abs-videos.png')});
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await page.getByRole('button', {name: 'Watch', exact: true}).click();
    const player = page.locator('video');
    await expect(player).toHaveAttribute('src', /^blob:/);
    await player.evaluate(async (element: HTMLVideoElement) => {element.muted = true; await element.play();});
    await expect.poll(() => player.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0);
    const source = await player.getAttribute('src');
    await page.getByRole('combobox', {name: /^Difficulty/}).click();
    await page.getByRole('option', {name: '5 / 5 — Very hard', exact: true}).click();
    await expect(page.getByRole('combobox', {name: /^Difficulty/})).toContainText('5 / 5');
    await expect(player).toHaveAttribute('src', source!);
    await noOverflow(page);
    await page.screenshot({path: testInfo.outputPath('personal-video-offline-player.png')});
    await page.getByRole('button', {name: 'Back to video library', exact: true}).click();
    await expect(page.getByRole('combobox', {name: 'Difficulty for Synthetic abs'})).toContainText('5 / 5');
});

test('a missing restored video can be reattached without losing its tags; deletion is confirmed', async ({page}) => {
    await bootstrap(page);
    const clip = await syntheticClip(page);
    await page.getByLabel('Choose local videos').setInputFiles({name: 'Synthetic restore.webm', mimeType: 'video/webm', buffer: clip});
    await expect(page.getByRole('article')).toHaveCount(1);
    await page.getByRole('button', {name: 'Edit details'}).click();
    await page.getByRole('checkbox', {name: 'Abs / core', exact: true}).check();
    await page.getByRole('combobox', {name: /^Difficulty/}).click();
    await page.getByRole('option', {name: '3 / 5 — Moderate', exact: true}).click();
    await page.getByRole('button', {name: 'Save video details'}).click();
    await expect(page.getByRole('heading', {name: 'Your videos', exact: true})).toBeVisible();
    // Simulate a restored reference in this anonymous test profile only.
    await page.evaluate(async () => {
        const request = <T,>(r: IDBRequest<T>) => new Promise<T>((resolve, reject) => {r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);});
        const database = await request(indexedDB.open('weightlog'));
        const read = database.transaction('appMeta', 'readonly');
        const entry = await request(read.objectStore('appMeta').get('localWorkoutVideos:v1'));
        const videos = JSON.parse(entry.value);
        videos[0].assetId = crypto.randomUUID();
        const write = database.transaction('appMeta', 'readwrite');
        write.objectStore('appMeta').put({...entry, value: JSON.stringify(videos)});
        await new Promise<void>((resolve, reject) => {write.oncomplete = () => resolve(); write.onerror = () => reject(write.error);});
        database.close();
    });
    await page.reload();
    await expect(page.getByRole('button', {name: 'Watch', exact: true})).toBeDisabled();
    await expect(page.getByText(/The file is not on this device/)).toBeVisible();
    await page.getByRole('button', {name: 'Edit details'}).click();
    await page.getByLabel('Reattach video file').setInputFiles({name: 'Synthetic restore.webm', mimeType: 'video/webm', buffer: clip});
    await expect(page.getByRole('status').filter({hasText: 'File reattached'})).toBeVisible();
    await page.getByRole('button', {name: 'Back to video library', exact: true}).click();
    await expect(page.getByRole('button', {name: 'Watch', exact: true})).toBeEnabled();
    await expect(page.getByRole('combobox', {name: 'Difficulty for Synthetic restore'})).toContainText('3 / 5');
    await page.getByRole('button', {name: 'Delete', exact: true}).click();
    await page.getByRole('button', {name: 'Keep video', exact: true}).click();
    await expect(page.getByRole('article')).toHaveCount(1);
    await page.getByRole('button', {name: 'Delete', exact: true}).click();
    await page.getByRole('button', {name: 'Delete imported copy', exact: true}).click();
    await expect(page.getByRole('heading', {name: 'No personal videos yet'})).toBeVisible();
});
