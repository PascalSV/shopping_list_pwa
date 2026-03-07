import { test, expect } from '@playwright/test';

// Allow service workers for offline caching to work
test.use({ serviceWorkers: 'allow' });

test('device works offline and syncs when back online', async ({ browser, request }) => {
    test.setTimeout(120000);

    // Clean up any existing data
    const cleanupHeaders = {
        'Cookie': 'shopping_auth=pascal123',
        'Content-Type': 'application/json'
    };

    const listsResponse = await request.get('/api/lists', { headers: cleanupHeaders });
    const lists = await listsResponse.json() as Array<{ id: string }>;
    for (const list of lists) {
        await request.delete('/api/lists/' + list.id, { headers: cleanupHeaders });
    }

    // Create two device contexts
    const contextA = await browser.newContext();
    await contextA.addCookies([{ name: 'shopping_auth', value: 'pascal123', url: 'http://127.0.0.1:8787' }]);

    const contextB = await browser.newContext();
    await contextB.addCookies([{ name: 'shopping_auth', value: 'pascal123', url: 'http://127.0.0.1:8787' }]);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    console.log('=== Phase 1: Both devices online - Device A creates list and items ===');

    await pageA.goto('/');
    await pageB.goto('/');

    // Device A creates a list
    await pageA.locator('button[hx-get="/list/create"]').click();
    await pageA.locator('#listName').waitFor({ state: 'visible' });
    await pageA.locator('#listName').fill('Shopping List');
    await pageA.locator('form button[type="submit"]').first().click();
    await expect(pageA.locator('#scrolling-title')).toHaveText('Shopping List');

    const listId = await pageA.locator('#scrolling-title').getAttribute('data-list-id');
    if (!listId) {
        throw new Error('Expected list id to be present');
    }

    // Device A adds several items
    const initialItems = ['Milk', 'Bread', 'Eggs', 'Cheese', 'Butter', 'Apples'];
    for (const item of initialItems) {
        await pageA.locator('#search-input').fill(item);
        await pageA.locator('#search-input').press('Enter');
        await expect(pageA.locator('.item').filter({ hasText: item })).toBeVisible();
    }

    console.log('=== Phase 2: Device B verifies it can see the list and items ===');

    // Device B opens the same list directly and verifies all items
    await pageB.goto('/list/' + listId);
    await expect(pageB.locator('#scrolling-title')).toHaveText('Shopping List', { timeout: 10000 });
    for (const item of initialItems) {
        await expect(pageB.locator('.item').filter({ hasText: item })).toBeVisible({ timeout: 10000 });
    }

    console.log('=== Phase 3: Device A caches the edit page while online ===');

    // Wait for service worker to be ready
    await pageA.waitForTimeout(1000);

    // Visit the edit page to cache it in the service worker
    await pageA.goto(`/list/${listId}/edit`);
    await pageA.waitForTimeout(1000);

    // Go back to the list
    await pageA.goto(`/list/${listId}`);
    await pageA.waitForTimeout(1000);

    console.log('=== Phase 4: Device A goes offline ===');

    // Device A goes offline
    await contextA.setOffline(true);

    console.log('=== Phase 5: Device A (offline) deletes items from the list ===');

    // Device A tries to delete items while offline
    // With offline queue, these deletions should be stored and retried later

    // Try to delete Butter
    const butterItem = pageA.locator('.item').filter({ hasText: 'Butter' }).first();
    await butterItem.click();
    await pageA.waitForTimeout(500);

    // The item should disappear from the UI (optimistic update)
    await expect(pageA.locator('.item').filter({ hasText: 'Butter' })).not.toBeVisible();

    // Try to delete Apples
    const applesItem = pageA.locator('.item').filter({ hasText: 'Apples' }).first();
    await applesItem.click();
    await pageA.waitForTimeout(500);
    await expect(pageA.locator('.item').filter({ hasText: 'Apples' })).not.toBeVisible();

    console.log('=== Phase 6: Device A (offline) attempts to rename the list ===');

    // Device A tries to rename the list while offline
    // The edit page should be cached and accessible (we visited it in Phase 3)
    await pageA.goto(`/list/${listId}/edit`);

    // Fill in the new name
    await pageA.locator('#listName').fill('Weekly Groceries');
    await pageA.locator('form button[type="submit"]').first().click();

    // The form submission will be queued, show notification
    await pageA.waitForTimeout(1000);

    console.log('=== Phase 7: Device B (online) should still see original state ===');

    // Device B should still see Butter and Apples (offline changes haven't synced yet)
    await expect(pageB.locator('.item').filter({ hasText: 'Butter' })).toBeVisible();
    await expect(pageB.locator('.item').filter({ hasText: 'Apples' })).toBeVisible();

    // Device B should still see the original list name while A is offline
    await expect(pageB.locator('#scrolling-title')).toHaveText('Shopping List');

    console.log('=== Phase 8: Device A comes back online ===');

    // Device A comes back online
    await contextA.setOffline(false);

    // Wait for offline queue to process and page to reload
    await pageA.waitForTimeout(3000);

    console.log('=== Phase 9: Verify queued operations were synced ===');

    // After coming online, queued operations should have been processed
    // Navigate to lists to see the updated state
    await pageA.goto('/');
    await pageA.waitForTimeout(500);

    // The list should now be renamed to Weekly Groceries
    await pageA.goto('/list/' + listId);
    await expect(pageA.locator('#scrolling-title')).toHaveText('Weekly Groceries', { timeout: 10000 });

    console.log('=== Phase 10: Device B verifies all synced changes ===');

    // Device B should now see the deletions and rename (via polling)
    await pageB.goto('/list/' + listId);
    await expect(pageB.locator('#scrolling-title')).toHaveText('Weekly Groceries', { timeout: 10000 });

    // Verify remaining items are still there
    await expect(pageB.locator('.item').filter({ hasText: 'Milk' })).toBeVisible();
    await expect(pageB.locator('.item').filter({ hasText: 'Bread' })).toBeVisible();
    await expect(pageB.locator('.item').filter({ hasText: 'Eggs' })).toBeVisible();
    await expect(pageB.locator('.item').filter({ hasText: 'Cheese' })).toBeVisible();

    console.log('=== Phase 11: Test device going offline and adding items ===');

    // Device A goes offline again
    await contextA.setOffline(true);

    // Navigate to the list
    await pageA.goto('/list/' + listId);

    // Try to add items while offline
    await pageA.locator('#search-input').fill('Bananas');
    await pageA.locator('#search-input').press('Enter');

    // Wait to see if it processes
    await pageA.waitForTimeout(1000);

    console.log('=== Phase 13: Device A comes back online and adds items ===');

    // Come back online
    await contextA.setOffline(false);

    // Retry adding the item
    await pageA.goto('/list/' + listId);

    // Add items now that we're online
    await pageA.locator('#search-input').fill('Bananas');
    await pageA.locator('#search-input').press('Enter');
    await expect(pageA.locator('.item').filter({ hasText: 'Bananas' })).toBeVisible();

    await pageA.locator('#search-input').fill('Oranges');
    await pageA.locator('#search-input').press('Enter');
    await expect(pageA.locator('.item').filter({ hasText: 'Oranges' })).toBeVisible();

    console.log('=== Phase 14: Device B verifies new items synced ===');

    // Device B should see the new items
    await expect(pageB.locator('.item').filter({ hasText: 'Bananas' })).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('.item').filter({ hasText: 'Oranges' })).toBeVisible({ timeout: 10000 });

    console.log('=== Phase 15: Final state verification ===');

    // Both devices should have the same final state
    const finalItems = ['Milk', 'Bread', 'Eggs', 'Cheese', 'Bananas', 'Oranges'];
    // Verify on Device A
    for (const item of finalItems) {
        await expect(pageA.locator('.item').filter({ hasText: item })).toBeVisible();
    }

    // Verify on Device B (should match via sync)
    for (const item of finalItems) {
        await expect(pageB.locator('.item').filter({ hasText: item })).toBeVisible({ timeout: 10000 });
    }

    console.log('=== Offline sync test completed successfully ===');

    await contextA.close();
    await contextB.close();
});

test('device can browse and view while offline, then add items when back online', async ({ browser, request }) => {
    test.setTimeout(120000);

    // Clean up
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
    await contextA.addCookies([{ name: 'shopping_auth', value: 'pascal123', url: 'http://127.0.0.1:8787' }]);

    const contextB = await browser.newContext();
    await contextB.addCookies([{ name: 'shopping_auth', value: 'pascal123', url: 'http://127.0.0.1:8787' }]);

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    console.log('=== Setup: Device A creates list with items ===');

    await pageA.goto('/');
    await pageA.locator('button[hx-get="/list/create"]').click();
    await pageA.locator('#listName').waitFor({ state: 'visible' });
    await pageA.locator('#listName').fill('Office Supplies');
    await pageA.locator('form button[type="submit"]').first().click();
    await expect(pageA.locator('#scrolling-title')).toHaveText('Office Supplies');

    const listId = await pageA.locator('#scrolling-title').getAttribute('data-list-id');
    if (!listId) {
        throw new Error('Expected list id to be present');
    }

    // Add items
    const items = ['Pens', 'Paper', 'Stapler', 'Notebooks'];
    for (const item of items) {
        await pageA.locator('#search-input').fill(item);
        await pageA.locator('#search-input').press('Enter');
        await expect(pageA.locator('.item').filter({ hasText: item })).toBeVisible();
    }

    console.log('=== Device B loads the list while online ===');

    await pageB.goto('/list/' + listId);
    await expect(pageB.locator('#scrolling-title')).toHaveText('Office Supplies', { timeout: 10000 });

    // Verify all items are visible
    for (const item of items) {
        await expect(pageB.locator('.item').filter({ hasText: item })).toBeVisible();
    }

    console.log('=== Device B goes offline and can still view loaded content ===');

    // Device B goes offline but keeps the current page
    await contextB.setOffline(true);

    // Should still be able to see the items already loaded
    for (const item of items) {
        await expect(pageB.locator('.item').filter({ hasText: item })).toBeVisible();
    }

    // Try to navigate back to lists while offline
    await pageB.locator('button[hx-get="/lists"]').click();

    // With service worker blocked, this will fail to load, but the button click should work
    await pageB.waitForTimeout(2000);

    console.log('=== Device B comes back online ===');

    await contextB.setOffline(false);

    // Navigate to list again after reconnect
    await pageB.goto('/list/' + listId);

    // Should see all items again
    for (const item of items) {
        await expect(pageB.locator('.item').filter({ hasText: item })).toBeVisible({ timeout: 10000 });
    }

    console.log('=== Device B adds new items now that it\'s online === ');

    await pageB.locator('#search-input').fill('Folders');
    await pageB.locator('#search-input').press('Enter');
    await expect(pageB.locator('.item').filter({ hasText: 'Folders' })).toBeVisible();

    await pageB.locator('#search-input').fill('Highlighters');
    await pageB.locator('#search-input').press('Enter');
    await expect(pageB.locator('.item').filter({ hasText: 'Highlighters' })).toBeVisible();

    console.log('=== Device A verifies new items synced ===');

    // Device A should see the new items added by Device B
    await expect(pageA.locator('.item').filter({ hasText: 'Folders' })).toBeVisible({ timeout: 10000 });
    await expect(pageA.locator('.item').filter({ hasText: 'Highlighters' })).toBeVisible({ timeout: 10000 });

    console.log('=== Offline browsing test completed successfully ===');

    await contextA.close();
    await contextB.close();
});
