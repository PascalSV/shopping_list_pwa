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

test('item add is reflected on second device UI', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const contextA = await createAuthedContext(browser);
    const contextB = await createAuthedContext(browser);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');

    const listId = await createListViaApi(pageA, 'Shopping List');
    await pageA.goto('/list/' + listId);
    await expect(pageA.locator('#scrolling-title')).toHaveText('Shopping List');

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

    const listId = await createListViaApi(pageA, 'Todo List');
    await pageA.goto('/list/' + listId);
    await expect(pageA.locator('#scrolling-title')).toHaveText('Todo List');

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
