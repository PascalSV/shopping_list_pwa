import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('item add is reflected on second device UI', async ({ browser, request }) => {
    const cleanupHeaders = {
        Authorization: 'Bearer device_a_token',
        'Content-Type': 'application/json'
    };

    const listsResponse = await request.get('/api/lists', { headers: cleanupHeaders });
    const lists = await listsResponse.json() as Array<{ id: string }>;
    for (const list of lists) {
        await request.delete('/api/lists/' + list.id, { headers: cleanupHeaders });
    }

    const contextA = await browser.newContext({
        extraHTTPHeaders: { Authorization: 'Bearer device_a_token' }
    });
    const contextB = await browser.newContext({
        extraHTTPHeaders: { Authorization: 'Bearer device_b_token' }
    });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');
    await pageB.goto('/');

    await pageA.getByRole('button', { name: 'New List' }).click();
    await pageA.locator('#listName').waitFor({ state: 'visible' });
    await pageA.locator('#listName').fill('Shopping List');
    await pageA.getByRole('button', { name: 'Create List' }).click();

    await expect(pageA.getByRole('heading', { level: 2, name: 'Shopping List' })).toBeVisible();

    await pageA.locator('#search-input').fill('Milk');
    await pageA.locator('#search-input').press('Enter');

    await expect(pageA.getByText('Milk')).toBeVisible();

    // pageB navigates to /lists and clicks on the Shopping List to view it
    await pageB.goto('/');
    await pageB.locator('.list-row').filter({ hasText: 'Shopping List' }).first().click();
    await expect(pageB.getByText('Milk')).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
});

test('item delete is reflected on second device UI', async ({ browser, request }) => {
    const cleanupHeaders = {
        Authorization: 'Bearer device_c_token',
        'Content-Type': 'application/json'
    };

    const listsResponse = await request.get('/api/lists', { headers: cleanupHeaders });
    const lists = await listsResponse.json() as Array<{ id: string }>;
    for (const list of lists) {
        await request.delete('/api/lists/' + list.id, { headers: cleanupHeaders });
    }

    const contextA = await browser.newContext({
        extraHTTPHeaders: { Authorization: 'Bearer device_c_token' }
    });
    const contextB = await browser.newContext({
        extraHTTPHeaders: { Authorization: 'Bearer device_d_token' }
    });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');
    await pageB.goto('/');

    await pageA.getByRole('button', { name: 'New List' }).click();
    await pageA.locator('#listName').waitFor({ state: 'visible' });
    await pageA.locator('#listName').fill('Todo List');
    await pageA.getByRole('button', { name: 'Create List' }).click();

    await expect(pageA.getByRole('heading', { level: 2, name: 'Todo List' })).toBeVisible();

    await pageA.locator('#search-input').fill('Task 1');
    await pageA.locator('#search-input').press('Enter');

    await expect(pageA.getByText('Task 1')).toBeVisible();

    await pageB.goto('/');
    await pageB.locator('.list-row').filter({ hasText: 'Todo List' }).first().click();
    await expect(pageB.getByText('Task 1')).toBeVisible({ timeout: 10000 });

    // Delete the item on device A (single click = delete, long press = edit)
    const itemLocator = pageA.locator('.item').filter({ hasText: 'Task 1' }).first();
    await itemLocator.click();

    // Wait a bit for the delete to process
    await pageA.waitForTimeout(500);

    // Verify deletion on device A
    await expect(pageA.locator('.item').filter({ hasText: 'Task 1' })).not.toBeVisible();

    // Wait for polling to reflect deletion on device B
    await expect(pageB.locator('.item').filter({ hasText: 'Task 1' })).not.toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
});
