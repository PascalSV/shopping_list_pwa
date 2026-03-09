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

test('long press on item opens edit dialog', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    const listId = await createListViaApi(page, 'Long Press Test');
    await page.goto('/list/' + listId);
    await expect(page.locator('#scrolling-title')).toHaveText('Long Press Test');

    // Add an item
    const itemName = 'Test Item';
    await page.locator('#search-input').fill(itemName);
    await page.locator('#search-input').press('Enter');
    
    const itemLocator = page.locator('.item').filter({ hasText: itemName });
    await expect(itemLocator).toBeVisible();

    // Get the bounding box for the item
    const box = await itemLocator.boundingBox();
    if (!box) {
        throw new Error('Could not get bounding box for item');
    }

    // Simulate a long press using touchscreen
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    
    // Touch down and hold
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(600); // Long press duration (500ms + buffer)
    await page.mouse.up();

    // Verify edit dialog is visible
    await expect(page.locator('#itemName')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('#itemRemark')).toBeVisible();
    await expect(page.locator('#itemName')).toHaveValue(itemName);

    await context.close();
});

test('long press on item with touchstart/touchend opens edit dialog', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    const listId = await createListViaApi(page, 'Touch Event Test');
    await page.goto('/list/' + listId);
    await expect(page.locator('#scrolling-title')).toHaveText('Touch Event Test');

    // Add an item
    const itemName = 'Touch Test Item';
    await page.locator('#search-input').fill(itemName);
    await page.locator('#search-input').press('Enter');
    
    const itemLocator = page.locator('.item').filter({ hasText: itemName });
    await expect(itemLocator).toBeVisible();

    // Simulate touch events directly
    await itemLocator.evaluate((el) => {
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
    await page.waitForTimeout(600);

    // Dispatch touchend
    await itemLocator.evaluate((el) => {
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

    // Verify edit dialog is visible
    await expect(page.locator('#itemName')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('#itemRemark')).toBeVisible();
    await expect(page.locator('#itemName')).toHaveValue(itemName);

    await context.close();
});

test('quick tap on item deletes it (not long press)', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    const listId = await createListViaApi(page, 'Quick Tap Test');
    await page.goto('/list/' + listId);
    await expect(page.locator('#scrolling-title')).toHaveText('Quick Tap Test');

    // Add an item
    const itemName = 'Quick Tap Item';
    await page.locator('#search-input').fill(itemName);
    await page.locator('#search-input').press('Enter');
    
    const itemLocator = page.locator('.item').filter({ hasText: itemName });
    await expect(itemLocator).toBeVisible();

    // Quick tap (not long press)
    await itemLocator.click();
    await page.waitForTimeout(100);

    // Verify edit dialog is NOT visible (quick tap should delete, not edit)
    const editFormVisible = await page.locator('#itemName').isVisible().catch(() => false);
    expect(editFormVisible).toBe(false);

    // Verify item was deleted
    await page.waitForTimeout(500);
    const itemStillExists = await itemLocator.isVisible().catch(() => false);
    expect(itemStillExists).toBe(false);

    await context.close();
});
