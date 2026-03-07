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

test('item add is reflected on second device UI', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const contextA = await createAuthedContext(browser);
    const contextB = await createAuthedContext(browser);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');

    await pageA.locator('button[hx-get="/list/create"]').click();
    await pageA.locator('#listName').fill('Shopping List');
    await pageA.locator('form button[type="submit"]').first().click();
    await expect(pageA.locator('#scrolling-title')).toHaveText('Shopping List');

    const listId = await pageA.locator('#scrolling-title').getAttribute('data-list-id');
    if (!listId) {
        throw new Error('Expected list id after creation');
    }

    await pageA.locator('#search-input').fill('Milk');
    await pageA.locator('#search-input').press('Enter');
    await expect(pageA.locator('.item').filter({ hasText: 'Milk' })).toBeVisible();

    await pageB.goto('/list/' + listId);
    await expect(pageB.locator('#scrolling-title')).toHaveText('Shopping List', { timeout: 10000 });
    await expect(pageB.locator('.item').filter({ hasText: 'Milk' })).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
});

test('item delete is reflected on second device UI', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const contextA = await createAuthedContext(browser);
    const contextB = await createAuthedContext(browser);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');

    await pageA.locator('button[hx-get="/list/create"]').click();
    await pageA.locator('#listName').fill('Todo List');
    await pageA.locator('form button[type="submit"]').first().click();
    await expect(pageA.locator('#scrolling-title')).toHaveText('Todo List');

    const listId = await pageA.locator('#scrolling-title').getAttribute('data-list-id');
    if (!listId) {
        throw new Error('Expected list id after creation');
    }

    await pageA.locator('#search-input').fill('Task 1');
    await pageA.locator('#search-input').press('Enter');
    await expect(pageA.locator('.item').filter({ hasText: 'Task 1' })).toBeVisible();

    await pageB.goto('/list/' + listId);
    await expect(pageB.locator('.item').filter({ hasText: 'Task 1' })).toBeVisible({ timeout: 10000 });

    await pageA.locator('.item').filter({ hasText: 'Task 1' }).first().click();
    await expect(pageA.locator('.item').filter({ hasText: 'Task 1' })).not.toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('.item').filter({ hasText: 'Task 1' })).not.toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
});
