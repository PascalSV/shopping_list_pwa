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

test('item remark added and changed is reflected on second device', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const contextA = await createAuthedContext(browser);
    const contextB = await createAuthedContext(browser);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');

    await pageA.locator('button[hx-get="/list/create"]').click();
    await pageA.locator('#listName').fill('Kitchen Supply');
    await pageA.locator('form button[type="submit"]').first().click();
    await expect(pageA.locator('#scrolling-title')).toHaveText('Kitchen Supply');

    const listId = await pageA.locator('#scrolling-title').getAttribute('data-list-id');
    if (!listId) {
        throw new Error('Expected list id after creation');
    }

    await pageA.locator('#search-input').fill('Olive Oil');
    await pageA.locator('#search-input').press('Enter');
    await expect(pageA.locator('.item').filter({ hasText: 'Olive Oil' })).toBeVisible();

    await pageB.goto('/list/' + listId);
    await expect(pageB.locator('.item').filter({ hasText: 'Olive Oil' })).toBeVisible({ timeout: 10000 });

    const itemRow = pageA.locator('.item').filter({ hasText: 'Olive Oil' }).first();
    const itemId = await itemRow.getAttribute('data-item-id');
    if (!itemId) {
        throw new Error('Expected item id for Olive Oil');
    }

    await pageA.goto('/item/' + itemId + '/edit?listId=' + listId);
    await expect(pageA.locator('#itemName')).toBeVisible({ timeout: 5000 });

    await pageA.locator('#itemRemark').fill('Extra Virgin, 500ml bottle');
    await pageA.locator('form button[type="submit"]').first().click();

    await expect(pageA.locator('.item').filter({ hasText: 'Extra Virgin, 500ml bottle' })).toBeVisible();
    await expect(pageB.locator('.item').filter({ hasText: 'Extra Virgin, 500ml bottle' })).toBeVisible({ timeout: 10000 });

    await pageA.goto('/item/' + itemId + '/edit?listId=' + listId);
    await expect(pageA.locator('#itemRemark')).toBeVisible({ timeout: 5000 });

    await pageA.locator('#itemRemark').clear();
    await pageA.locator('#itemRemark').fill('on sale this week');
    await pageA.locator('form button[type="submit"]').first().click();

    await expect(pageA.locator('.item').filter({ hasText: 'on sale this week' })).toBeVisible();
    await expect(pageB.locator('.item').filter({ hasText: 'on sale this week' })).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
});
