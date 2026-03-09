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

test('list rename is reflected on second device UI', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const contextA = await createAuthedContext(browser);
    const contextB = await createAuthedContext(browser);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');

    const listId = await createListViaApi(pageA, 'Family Groceries');
    await pageA.goto('/list/' + listId);
    await expect(pageA.locator('#scrolling-title')).toHaveText('Family Groceries');

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

    const listId = await createListViaApi(pageA, 'Meal Planning');
    await pageA.goto('/list/' + listId);
    await expect(pageA.locator('#scrolling-title')).toHaveText('Meal Planning');

    await pageA.goto('/list/' + listId + '/edit');
    await pageA.locator('#listName').fill('Home');
    await pageA.locator('form button[type="submit"]').first().click();
    await expect(pageA.locator('#scrolling-title')).toHaveText('Home');

    await pageA.locator('#search-input').fill('Chicken');
    await pageA.locator('#search-input').press('Enter');
    await expect(pageA.locator('.item').filter({ hasText: 'Chicken' })).toBeVisible();

    await pageA.locator('#search-input').fill('Rice');
    await pageA.locator('#search-input').press('Enter');
    await expect(pageA.locator('.item').filter({ hasText: 'Rice' })).toBeVisible();

    await pageB.goto('/list/' + listId);
    await expect(pageB.locator('#scrolling-title')).toHaveText('Home', { timeout: 10000 });
    await expect(pageB.locator('.item').filter({ hasText: 'Chicken' })).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('.item').filter({ hasText: 'Rice' })).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
});
