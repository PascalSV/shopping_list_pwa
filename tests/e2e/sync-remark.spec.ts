import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('item remark added and changed is reflected on second device', async ({ browser, request }) => {
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

    // Create list and item
    await pageA.getByRole('button', { name: 'New List' }).click();
    await pageA.locator('#listName').waitFor({ state: 'visible' });
    await pageA.locator('#listName').fill('Kitchen Supply');
    await pageA.getByRole('button', { name: 'Create List' }).click();

    await expect(pageA.getByRole('heading', { level: 2, name: 'Kitchen Supply' })).toBeVisible();

    await pageA.locator('#search-input').fill('Olive Oil');
    await pageA.locator('#search-input').press('Enter');

    await expect(pageA.getByText('Olive Oil')).toBeVisible();

    // Navigate to device B and verify item is visible
    await pageB.goto('/');
    await pageB.locator('.list-row').filter({ hasText: 'Kitchen Supply' }).first().click();
    await expect(pageB.getByText('Olive Oil')).toBeVisible({ timeout: 10000 });

    // Device A: Get item and extract its ID to navigate to edit page directly
    const itemWithRemark = pageA.locator('.item').filter({ hasText: 'Olive Oil' });
    const itemId = await itemWithRemark.first().getAttribute('data-item-id');
    const listId = await itemWithRemark.first().getAttribute('data-list-id');

    // Navigate to edit page
    await pageA.goto(`/item/${itemId}/edit?listId=${listId}`);

    // Wait for edit dialog to appear
    await expect(pageA.locator('#itemName')).toBeVisible({ timeout: 5000 });

    // Fill in remark
    await pageA.locator('#itemRemark').fill('Extra Virgin, 500ml bottle');
    await pageA.getByRole('button', { name: 'Update' }).click();

    // Verify remark appears on device A
    await expect(pageA.getByText('Extra Virgin, 500ml bottle')).toBeVisible();

    // Device B: Wait for polling to update the remark
    await expect(pageB.getByText('Extra Virgin, 500ml bottle')).toBeVisible({ timeout: 10000 });

    // Device A: Reload to go back to list view
    await pageA.goto(`/list/${listId}`);

    // Change the remark (navigate to edit page again)
    await pageA.goto(`/item/${itemId}/edit?listId=${listId}`);

    await expect(pageA.locator('#itemRemark')).toBeVisible({ timeout: 5000 });

    await pageA.locator('#itemRemark').clear();
    await pageA.locator('#itemRemark').fill('on sale this week');
    await pageA.getByRole('button', { name: 'Update' }).click();

    // Verify remark changed on device A
    await expect(pageA.getByText('on sale this week')).toBeVisible();

    // Device B: Wait for polling to update the remark
    await expect(pageB.getByText('on sale this week')).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
});
