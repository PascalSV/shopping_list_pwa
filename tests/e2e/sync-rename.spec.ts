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

async function createAuthedContext(browser: any) {
    const context = await browser.newContext();
    await context.addCookies([{ name: 'shopping_auth', value: 'pascal123', url: 'http://127.0.0.1:8787' }]);
    return context;
}

test('list rename is reflected on second device UI', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const contextA = await createAuthedContext(browser);
    const contextB = await createAuthedContext(browser);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');
    await pageA.locator('button[hx-get="/list/create"]').click();
    await pageA.locator('#listName').fill('Family Groceries');
    await pageA.locator('form button[type="submit"]').first().click();
    await expect(pageA.locator('#scrolling-title')).toHaveText('Family Groceries');

    const listId = await pageA.locator('#scrolling-title').getAttribute('data-list-id');
    if (!listId) {
        throw new Error('Expected list id after creation');
    }

    await pageB.goto('/list/' + listId);
    await expect(pageB.locator('#scrolling-title')).toHaveText('Family Groceries', { timeout: 10000 });

    await pageA.goto('/list/' + listId + '/edit');
    await pageA.locator('#listName').fill('Family Groceries Renamed');
    await pageA.locator('form button[type="submit"]').first().click();

    await expect(pageA.locator('#scrolling-title')).toHaveText('Family Groceries Renamed');
    await expect(pageB.locator('#scrolling-title')).toHaveText('Family Groceries Renamed', { timeout: 10000 });

    await contextA.close();
    await contextB.close();
});

test('items added after rename are reflected on second device', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const contextA = await createAuthedContext(browser);
    const contextB = await createAuthedContext(browser);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');
    await pageA.locator('button[hx-get="/list/create"]').click();
    await pageA.locator('#listName').fill('Meal Planning');
    await pageA.locator('form button[type="submit"]').first().click();
    await expect(pageA.locator('#scrolling-title')).toHaveText('Meal Planning');

    const listId = await pageA.locator('#scrolling-title').getAttribute('data-list-id');
    if (!listId) {
        throw new Error('Expected list id after creation');
    }

    await pageA.goto('/list/' + listId + '/edit');
    await pageA.locator('#listName').fill('Weekly Meal Plan');
    await pageA.locator('form button[type="submit"]').first().click();
    await expect(pageA.locator('#scrolling-title')).toHaveText('Weekly Meal Plan');

    await pageA.locator('#search-input').fill('Chicken');
    await pageA.locator('#search-input').press('Enter');
    await expect(pageA.locator('.item').filter({ hasText: 'Chicken' })).toBeVisible();

    await pageA.locator('#search-input').fill('Rice');
    await pageA.locator('#search-input').press('Enter');
    await expect(pageA.locator('.item').filter({ hasText: 'Rice' })).toBeVisible();

    await pageB.goto('/list/' + listId);
    await expect(pageB.locator('#scrolling-title')).toHaveText('Weekly Meal Plan', { timeout: 10000 });
    await expect(pageB.locator('.item').filter({ hasText: 'Chicken' })).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('.item').filter({ hasText: 'Rice' })).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
});
