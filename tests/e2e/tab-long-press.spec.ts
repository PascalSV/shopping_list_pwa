import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

async function cleanupLists(request: any) {
    const headers = {
        Cookie: 'shopping_auth=pascal123',
        'Content-Type': 'application/json'
    };

    const listsResponse = await request.get('/api/lists', { headers });
    expect(listsResponse.ok()).toBeTruthy();

    const listsJson = await listsResponse.json();
    const lists = Array.isArray(listsJson) ? (listsJson as Array<{ id: string }>) : [];

    for (const list of lists) {
        await request.delete('/api/lists/' + list.id, { headers });
    }
}

async function createMobileAuthedContext(browser: any) {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true
    });
    await context.addCookies([{ name: 'shopping_auth', value: 'pascal123', url: 'http://127.0.0.1:8787' }]);
    return context;
}

async function createListViaApi(page: any, listName: string): Promise<string> {
    const response = await page.request.post('/api/lists', {
        data: { name: listName }
    });
    expect(response.ok()).toBeTruthy();

    const body = await response.json() as { id?: string };
    if (!body.id) {
        throw new Error('Expected list id after API list creation');
    }

    return body.id;
}

test('long press on tab opens edit dialog', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    const listId = await createListViaApi(page, 'Test List');
    await page.goto('/list/' + listId);
    await expect(page.locator('#scrolling-title')).toHaveText('Test List');

    // Find the tab button for this list
    const tabButton = page.locator('.tab-btn').filter({ hasText: 'Test List' });
    await expect(tabButton).toBeVisible();

    // Get the bounding box for the tab
    const box = await tabButton.boundingBox();
    if (!box) {
        throw new Error('Could not get bounding box for tab button');
    }

    // Simulate a long press using mouse
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(650); // Long press duration (600ms + buffer)
    await page.mouse.up();

    // Verify the rename dialog is visible
    // Looking for the dialog that asks for tab name
    await expect(page.locator('#tab-name-dialog')).toBeVisible({ timeout: 2000 });

    await context.close();
});

test('long press on tab with touchstart/touchend opens dialog', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    const listId = await createListViaApi(page, 'Touch Tab Test');
    await page.goto('/list/' + listId);
    await expect(page.locator('#scrolling-title')).toHaveText('Touch Tab Test');

    // Find the tab button
    const tabButton = page.locator('.tab-btn').filter({ hasText: 'Touch Tab Test' });
    await expect(tabButton).toBeVisible();

    // Simulate touch events directly
    await tabButton.evaluate((el) => {
        const touchStartEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [new Touch({
                identifier: 0,
                target: el,
                clientX: 100,
                clientY: 100,
                screenX: 100,
                screenY: 100,
                pageX: 100,
                pageY: 100,
                radiusX: 2.5,
                radiusY: 2.5,
                rotationAngle: 0,
                force: 1
            })]
        });
        el.dispatchEvent(touchStartEvent);
    });

    // Wait for long press duration
    await page.waitForTimeout(650);

    // Dispatch touchend
    await tabButton.evaluate((el) => {
        const touchEndEvent = new TouchEvent('touchend', {
            bubbles: true,
            cancelable: true,
            changedTouches: [new Touch({
                identifier: 0,
                target: el,
                clientX: 100,
                clientY: 100,
                screenX: 100,
                screenY: 100,
                pageX: 100,
                pageY: 100,
                radiusX: 2.5,
                radiusY: 2.5,
                rotationAngle: 0,
                force: 1
            })]
        });
        el.dispatchEvent(touchEndEvent);
    });

    // Verify the rename dialog is visible
    await expect(page.locator('#tab-name-dialog')).toBeVisible({ timeout: 2000 });

    await context.close();
});

test('long press on unnamed tab opens dialog', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    // Go to home which should have empty tab slots
    await page.goto('/');

    // Find an empty tab (one without a list ID but with default name)
    const emptyTab = page.locator('.tab-btn.empty').first();
    await expect(emptyTab).toBeVisible();

    // Get the bounding box for the tab
    const box = await emptyTab.boundingBox();
    if (!box) {
        throw new Error('Could not get bounding box for empty tab');
    }

    // Simulate a long press
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();

    // Verify the rename dialog opens (to create the list)
    await expect(page.locator('#tab-name-dialog')).toBeVisible({ timeout: 2000 });

    await context.close();
});

test('quick tap on tab does not open dialog', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    const listId = await createListViaApi(page, 'Quick Tap Test');
    await page.goto('/list/' + listId);
    await expect(page.locator('#scrolling-title')).toHaveText('Quick Tap Test');

    // Find the tab button
    const tabButton = page.locator('.tab-btn').filter({ hasText: 'Quick Tap Test' });
    await expect(tabButton).toBeVisible();

    // Remember current URL
    const currentUrl = page.url();

    // Quick tap (< 600ms)
    await tabButton.evaluate((el) => {
        const touchStartEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [new Touch({
                identifier: 0,
                target: el,
                clientX: 100,
                clientY: 100,
                screenX: 100,
                screenY: 100,
                pageX: 100,
                pageY: 100,
                radiusX: 2.5,
                radiusY: 2.5,
                rotationAngle: 0,
                force: 1
            })]
        });
        el.dispatchEvent(touchStartEvent);
    });

    // Wait only 200ms (much less than 600ms threshold)
    await page.waitForTimeout(200);

    await tabButton.evaluate((el) => {
        const touchEndEvent = new TouchEvent('touchend', {
            bubbles: true,
            cancelable: true,
            changedTouches: [new Touch({
                identifier: 0,
                target: el,
                clientX: 100,
                clientY: 100,
                screenX: 100,
                screenY: 100,
                pageX: 100,
                pageY: 100,
                radiusX: 2.5,
                radiusY: 2.5,
                rotationAngle: 0,
                force: 1
            })]
        });
        el.dispatchEvent(touchEndEvent);
    });

    // Wait a bit to ensure no dialog appears
    await page.waitForTimeout(300);

    // Should not have dialog visible
    await expect(page.locator('#tab-name-dialog')).not.toBeVisible();

    // URL should remain the same (not navigating away)
    expect(page.url()).toBe(currentUrl);

    await context.close();
});
