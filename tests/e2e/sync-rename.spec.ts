import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('list rename is reflected on second device UI', async ({ browser, request }) => {
    const cleanupHeaders = {
        'Cookie': 'shopping_auth=pascal123',
        'Content-Type': 'application/json'
    };

    const listsResponse = await request.get('/api/lists', { headers: cleanupHeaders });
    const lists = await listsResponse.json() as Array<{ id: string }>;
    for (const list of lists) {
        await request.delete('/api/lists/' + list.id, { headers: cleanupHeaders });
    }

    const contextA = await browser.newContext();
    await contextA.addCookies([{ name: 'shopping_auth', value: 'pascal123', domain: 'localhost', path: '/' }]);

    const contextB = await browser.newContext();
    await contextB.addCookies([{ name: 'shopping_auth', value: 'pascal123', domain: 'localhost', path: '/' }]);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');
    await pageB.goto('/');

    await pageA.getByRole('button', { name: 'New List' }).click();
    await pageA.locator('#listName').waitFor({ state: 'visible' });
    await pageA.locator('#listName').fill('Family Groceries');
    await pageA.getByRole('button', { name: 'Create List' }).click();

    await expect(pageA.getByRole('heading', { level: 2, name: 'Family Groceries' })).toBeVisible();

    const firstListId = await pageA.locator('#current-list-title').getAttribute('data-list-id');
    if (!firstListId) {
        throw new Error('Expected current list id to be present after list creation');
    }

    await pageA.goto('/list/' + firstListId + '/edit');
    await pageA.locator('#listName').fill('Family Groceries Renamed');
    await pageA.getByRole('button', { name: 'Update' }).click();

    await expect(pageA.getByRole('heading', { level: 2, name: 'Family Groceries Renamed' })).toBeVisible();

    await pageB.goto('/');
    await pageB.locator('.list-row').filter({ hasText: 'Family Groceries Renamed' }).first().click();
    await expect(pageB.getByRole('heading', { level: 2, name: 'Family Groceries Renamed' })).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
});

test('items added after rename are reflected on second device', async ({ browser, request }) => {
    const cleanupHeaders = {
        Authorization: 'Bearer device_c_token',
        'Content-Type': 'application/json'
    };

    const listsResponse = await request.get('/api/lists', { headers: cleanupHeaders });
    const lists = await listsResponse.json() as Array<{ id: string }>;
    for (const list of lists) {
        await request.delete('/api/lists/' + list.id, { headers: cleanupHeaders });
    }

    const contextA = await browser.newContext();
    await contextA.addCookies([{ name: 'shopping_auth', value: 'pascal123', domain: 'localhost', path: '/' }]);

    const contextB = await browser.newContext();
    await contextB.addCookies([{ name: 'shopping_auth', value: 'pascal123', domain: 'localhost', path: '/' }]);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');

    // Create list
    await pageA.getByRole('button', { name: 'New List' }).click();
    await pageA.locator('#listName').waitFor({ state: 'visible' });
    await pageA.locator('#listName').fill('Meal Planning');
    await pageA.getByRole('button', { name: 'Create List' }).click();

    await expect(pageA.getByRole('heading', { level: 2, name: 'Meal Planning' })).toBeVisible();

    // Rename list
    const secondListId = await pageA.locator('#current-list-title').getAttribute('data-list-id');
    if (!secondListId) {
        throw new Error('Expected current list id to be present after list creation');
    }

    await pageA.goto('/list/' + secondListId + '/edit');
    await pageA.locator('#listName').fill('Weekly Meal Plan');
    await pageA.getByRole('button', { name: 'Update' }).click();

    await expect(pageA.getByRole('heading', { level: 2, name: 'Weekly Meal Plan' })).toBeVisible();

    // Add items to renamed list
    await pageA.locator('#search-input').fill('Chicken');
    await pageA.locator('#search-input').press('Enter');

    await expect(pageA.getByText('Chicken')).toBeVisible();

    await pageA.locator('#search-input').fill('Rice');
    await pageA.locator('#search-input').press('Enter');

    await expect(pageA.getByText('Rice')).toBeVisible();

    // Navigate to device B and verify both renamed list and items are visible
    await pageB.goto('/');
    await pageB.locator('.list-row').filter({ hasText: 'Weekly Meal Plan' }).first().click();

    await expect(pageB.getByRole('heading', { level: 2, name: 'Weekly Meal Plan' })).toBeVisible({ timeout: 10000 });
    await expect(pageB.getByText('Chicken')).toBeVisible({ timeout: 10000 });
    await expect(pageB.getByText('Rice')).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
});
