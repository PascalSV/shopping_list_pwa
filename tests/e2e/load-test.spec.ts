import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('three devices perform heavy concurrent operations with cross-device verification', async ({ browser, request }) => {
    // Clean up any existing data
    const cleanupHeaders = {
        Authorization: 'Bearer load_test_device_a',
        'Content-Type': 'application/json'
    };

    const listsResponse = await request.get('/api/lists', { headers: cleanupHeaders });
    const lists = await listsResponse.json() as Array<{ id: string }>;
    for (const list of lists) {
        await request.delete('/api/lists/' + list.id, { headers: cleanupHeaders });
    }

    // Create three device contexts
    const contextA = await browser.newContext({
        extraHTTPHeaders: { Authorization: 'Bearer load_test_device_a' }
    });
    const contextB = await browser.newContext({
        extraHTTPHeaders: { Authorization: 'Bearer load_test_device_b' }
    });
    const contextC = await browser.newContext({
        extraHTTPHeaders: { Authorization: 'Bearer load_test_device_c' }
    });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    const pageC = await contextC.newPage();

    // All devices start at home
    await pageA.goto('/');
    await pageB.goto('/');
    await pageC.goto('/');

    console.log('=== Phase 1: Device A creates multiple lists ===');

    // Device A creates first list
    await pageA.getByRole('button', { name: 'New List' }).click();
    await pageA.locator('#listName').waitFor({ state: 'visible' });
    await pageA.locator('#listName').fill('Groceries');
    await pageA.getByRole('button', { name: 'Create List' }).click();
    await expect(pageA.getByRole('heading', { level: 2, name: 'Groceries' })).toBeVisible();

    // Go back to lists and create second list
    await pageA.getByRole('button', { name: 'Lists' }).click();
    await pageA.getByRole('button', { name: 'New List' }).click();
    await pageA.locator('#listName').waitFor({ state: 'visible' });
    await pageA.locator('#listName').fill('Hardware Store');
    await pageA.getByRole('button', { name: 'Create List' }).click();
    await expect(pageA.getByRole('heading', { level: 2, name: 'Hardware Store' })).toBeVisible();

    // Go back to lists and create third list
    await pageA.getByRole('button', { name: 'Lists' }).click();
    await pageA.getByRole('button', { name: 'New List' }).click();
    await pageA.locator('#listName').waitFor({ state: 'visible' });
    await pageA.locator('#listName').fill('Pharmacy');
    await pageA.getByRole('button', { name: 'Create List' }).click();
    await expect(pageA.getByRole('heading', { level: 2, name: 'Pharmacy' })).toBeVisible();

    console.log('=== Phase 2: Verify all devices see the lists ===');

    // Device B should see all three lists
    await pageB.goto('/');
    await expect(pageB.locator('.list-row').filter({ hasText: 'Groceries' })).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('.list-row').filter({ hasText: 'Hardware Store' })).toBeVisible();
    await expect(pageB.locator('.list-row').filter({ hasText: 'Pharmacy' })).toBeVisible();

    // Device C should see all three lists
    await pageC.goto('/');
    await expect(pageC.locator('.list-row').filter({ hasText: 'Groceries' })).toBeVisible({ timeout: 10000 });
    await expect(pageC.locator('.list-row').filter({ hasText: 'Hardware Store' })).toBeVisible();
    await expect(pageC.locator('.list-row').filter({ hasText: 'Pharmacy' })).toBeVisible();

    console.log('=== Phase 3: Device A adds items to Groceries list ===');

    // Device A goes to Groceries and adds multiple items rapidly
    await pageA.getByRole('button', { name: 'Lists' }).click();
    await pageA.locator('.list-row').filter({ hasText: 'Groceries' }).first().click();

    const groceryItems = ['Milk', 'Bread', 'Eggs', 'Cheese', 'Butter', 'Apples', 'Bananas', 'Chicken'];
    for (const item of groceryItems) {
        await pageA.locator('#search-input').fill(item);
        await pageA.locator('#search-input').press('Enter');
        await expect(pageA.getByText(item).first()).toBeVisible();
    }

    console.log('=== Phase 4: Device B opens Groceries and verifies items ===');

    // Device B opens Groceries list
    await pageB.locator('.list-row').filter({ hasText: 'Groceries' }).first().click();

    // Verify all items are visible on Device B
    for (const item of groceryItems) {
        await expect(pageB.getByText(item).first()).toBeVisible({ timeout: 10000 });
    }

    console.log('=== Phase 5: Device C adds items to Hardware Store ===');

    // Device C opens Hardware Store and adds items
    await pageC.locator('.list-row').filter({ hasText: 'Hardware Store' }).first().click();

    const hardwareItems = ['Screws', 'Nails', 'Hammer', 'Drill', 'Paint'];
    for (const item of hardwareItems) {
        await pageC.locator('#search-input').fill(item);
        await pageC.locator('#search-input').press('Enter');
        await expect(pageC.getByText(item).first()).toBeVisible();
    }

    console.log('=== Phase 6: Device B adds remarks to items on Groceries ===');

    // Device B is still on Groceries - add remarks to some items via long press
    const milkItem = pageB.locator('.item').filter({ hasText: 'Milk' }).first();
    const milkId = await milkItem.getAttribute('data-item-id');
    const milkListId = await milkItem.getAttribute('data-list-id');

    if (milkId && milkListId) {
        await pageB.goto(`/item/${milkId}/edit?listId=${milkListId}`);
        await pageB.locator('#itemRemark').fill('2% low fat');
        await pageB.getByRole('button', { name: 'Update' }).click();
        await expect(pageB.getByText('2% low fat')).toBeVisible();
    }

    const breadItem = pageB.locator('.item').filter({ hasText: 'Bread' }).first();
    const breadId = await breadItem.getAttribute('data-item-id');

    if (breadId && milkListId) {
        await pageB.goto(`/item/${breadId}/edit?listId=${milkListId}`);
        await pageB.locator('#itemRemark').fill('Whole wheat');
        await pageB.getByRole('button', { name: 'Update' }).click();
        await expect(pageB.getByText('Whole wheat')).toBeVisible();
    }

    console.log('=== Phase 7: Device A verifies remarks are visible ===');

    // Device A should see the remarks added by Device B
    await pageA.waitForTimeout(5000); // Wait for polling to catch up
    await expect(pageA.getByText('2% low fat')).toBeVisible({ timeout: 10000 });
    await expect(pageA.getByText('Whole wheat')).toBeVisible();

    console.log('=== Phase 8: Device C deletes items from Groceries ===');

    // Device C opens Groceries and starts deleting items
    await pageC.getByRole('button', { name: 'Lists' }).click();
    await pageC.locator('.list-row').filter({ hasText: 'Groceries' }).first().click();

    // Wait for items to be visible
    await expect(pageC.getByText('Butter').first()).toBeVisible({ timeout: 10000 });

    // Delete Butter (single click)
    const butterItem = pageC.locator('.item').filter({ hasText: 'Butter' }).first();
    await butterItem.click();
    await pageC.waitForTimeout(500);

    // Delete Apples (single click)
    const applesItem = pageC.locator('.item').filter({ hasText: 'Apples' }).first();
    await applesItem.click();
    await pageC.waitForTimeout(500);

    console.log('=== Phase 9: Device A and B verify deletions ===');

    // Device A should not see deleted items
    await expect(pageA.locator('.item').filter({ hasText: 'Butter' })).not.toBeVisible({ timeout: 10000 });
    await expect(pageA.locator('.item').filter({ hasText: 'Apples' })).not.toBeVisible();

    // Device B should not see deleted items
    await expect(pageB.locator('.item').filter({ hasText: 'Butter' })).not.toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('.item').filter({ hasText: 'Apples' })).not.toBeVisible();

    console.log('=== Phase 10: Device B adds more items to Pharmacy ===');

    // Device B goes to Pharmacy list and adds items
    await pageB.getByRole('button', { name: 'Lists' }).click();
    await pageB.locator('.list-row').filter({ hasText: 'Pharmacy' }).first().click();

    const pharmacyItems = ['Aspirin', 'Band-aids', 'Vitamins', 'Cough syrup'];
    for (const item of pharmacyItems) {
        await pageB.locator('#search-input').fill(item);
        await pageB.locator('#search-input').press('Enter');
        await expect(pageB.getByText(item).first()).toBeVisible();
    }

    console.log('=== Phase 11: Device A verifies Hardware Store items from Device C ===');

    // Device A goes to Hardware Store and verifies items added by Device C
    await pageA.getByRole('button', { name: 'Lists' }).click();
    await pageA.locator('.list-row').filter({ hasText: 'Hardware Store' }).first().click();

    for (const item of hardwareItems) {
        await expect(pageA.getByText(item).first()).toBeVisible({ timeout: 10000 });
    }

    console.log('=== Phase 12: Device C verifies Pharmacy items from Device B ===');

    // Device C goes to Pharmacy and verifies items added by Device B
    await pageC.getByRole('button', { name: 'Lists' }).click();
    await pageC.locator('.list-row').filter({ hasText: 'Pharmacy' }).first().click();

    for (const item of pharmacyItems) {
        await expect(pageC.getByText(item).first()).toBeVisible({ timeout: 10000 });
    }

    console.log('=== Phase 13: Device A renames a list ===');

    // Device A goes back and renames Hardware Store via edit page
    await pageA.getByRole('button', { name: 'Lists' }).click();
    const hardwareStoreListId = await pageA.locator('.list-row').filter({ hasText: 'Hardware Store' }).first().getAttribute('data-list-id');

    if (hardwareStoreListId) {
        await pageA.goto(`/list/${hardwareStoreListId}/edit`);
        await pageA.locator('#listName').fill('Home Depot Shopping');
        await pageA.getByRole('button', { name: 'Update' }).click();
        await expect(pageA.getByRole('heading', { level: 2, name: 'Home Depot Shopping' })).toBeVisible();
    }

    console.log('=== Phase 14: All devices verify the renamed list ===');

    // Device B goes to lists and verifies rename
    await pageB.getByRole('button', { name: 'Lists' }).click();
    await expect(pageB.locator('.list-row').filter({ hasText: 'Home Depot Shopping' })).toBeVisible({ timeout: 10000 });
    await expect(pageB.locator('.list-row').filter({ hasText: 'Hardware Store' })).not.toBeVisible();

    // Device C goes to lists and verifies rename
    await pageC.getByRole('button', { name: 'Lists' }).click();
    await expect(pageC.locator('.list-row').filter({ hasText: 'Home Depot Shopping' })).toBeVisible({ timeout: 10000 });
    await expect(pageC.locator('.list-row').filter({ hasText: 'Hardware Store' })).not.toBeVisible();

    console.log('=== Phase 15: Rapid item additions across devices ===');

    // All three devices add items to different lists simultaneously
    // Device A adds to Groceries
    await pageA.getByRole('button', { name: 'Lists' }).click();
    await pageA.locator('.list-row').filter({ hasText: 'Groceries' }).first().click();

    // Device B adds to Home Depot Shopping
    await pageB.locator('.list-row').filter({ hasText: 'Home Depot Shopping' }).first().click();

    // Device C adds to Pharmacy
    await pageC.locator('.list-row').filter({ hasText: 'Pharmacy' }).first().click();

    // Rapid additions
    const rapidItemsA = ['Yogurt', 'Orange Juice', 'Cereal'];
    const rapidItemsB = ['Tape', 'Glue', 'Sandpaper'];
    const rapidItemsC = ['Toothpaste', 'Shampoo', 'Soap'];

    // Add items in parallel-ish fashion
    await pageA.locator('#search-input').fill(rapidItemsA[0]);
    await pageB.locator('#search-input').fill(rapidItemsB[0]);
    await pageC.locator('#search-input').fill(rapidItemsC[0]);

    await pageA.locator('#search-input').press('Enter');
    await pageB.locator('#search-input').press('Enter');
    await pageC.locator('#search-input').press('Enter');

    // Small wait to let items register
    await pageA.waitForTimeout(300);

    await pageA.locator('#search-input').fill(rapidItemsA[1]);
    await pageB.locator('#search-input').fill(rapidItemsB[1]);
    await pageC.locator('#search-input').fill(rapidItemsC[1]);

    await pageA.locator('#search-input').press('Enter');
    await pageB.locator('#search-input').press('Enter');
    await pageC.locator('#search-input').press('Enter');

    await pageA.waitForTimeout(300);

    await pageA.locator('#search-input').fill(rapidItemsA[2]);
    await pageB.locator('#search-input').fill(rapidItemsB[2]);
    await pageC.locator('#search-input').fill(rapidItemsC[2]);

    await pageA.locator('#search-input').press('Enter');
    await pageB.locator('#search-input').press('Enter');
    await pageC.locator('#search-input').press('Enter');

    // Wait for all additions to complete
    await pageA.waitForTimeout(1000);

    // Verify items are visible on each device with increased timeout
    for (const item of rapidItemsA) {
        await expect(pageA.getByText(item).first()).toBeVisible({ timeout: 8000 });
    }
    for (const item of rapidItemsB) {
        await expect(pageB.getByText(item).first()).toBeVisible({ timeout: 8000 });
    }
    for (const item of rapidItemsC) {
        await expect(pageC.getByText(item).first()).toBeVisible({ timeout: 8000 });
    }

    console.log('=== Phase 16: Cross-device verification of rapid additions ===');

    // Device B verifies Groceries items added by Device A
    await pageB.getByRole('button', { name: 'Lists' }).click();
    await pageB.locator('.list-row').filter({ hasText: 'Groceries' }).first().click();
    for (const item of rapidItemsA) {
        await expect(pageB.getByText(item).first()).toBeVisible({ timeout: 10000 });
    }

    // Device C verifies Home Depot Shopping items added by Device B
    await pageC.getByRole('button', { name: 'Lists' }).click();
    await pageC.locator('.list-row').filter({ hasText: 'Home Depot Shopping' }).first().click();
    for (const item of rapidItemsB) {
        await expect(pageC.getByText(item).first()).toBeVisible({ timeout: 10000 });
    }

    // Device A verifies Pharmacy items added by Device C
    await pageA.getByRole('button', { name: 'Lists' }).click();
    await pageA.locator('.list-row').filter({ hasText: 'Pharmacy' }).first().click();
    for (const item of rapidItemsC) {
        await expect(pageA.getByText(item).first()).toBeVisible({ timeout: 10000 });
    }

    console.log('=== Phase 17: Mass deletion and final verification ===');

    // Device A deletes multiple items from Pharmacy
    const toothpasteItem = pageA.locator('.item').filter({ hasText: 'Toothpaste' }).first();
    await toothpasteItem.click();
    await pageA.waitForTimeout(300);

    const shampooItem = pageA.locator('.item').filter({ hasText: 'Shampoo' }).first();
    await shampooItem.click();
    await pageA.waitForTimeout(300);

    // Device B and C should see the deletions
    await expect(pageB.locator('.item').filter({ hasText: 'Toothpaste' })).not.toBeVisible({ timeout: 10000 });
    await expect(pageC.locator('.item').filter({ hasText: 'Toothpaste' })).not.toBeVisible({ timeout: 10000 });

    await expect(pageB.locator('.item').filter({ hasText: 'Shampoo' })).not.toBeVisible({ timeout: 10000 });
    await expect(pageC.locator('.item').filter({ hasText: 'Shampoo' })).not.toBeVisible({ timeout: 10000 });

    console.log('=== Phase 18: Final state verification across all devices ===');

    // All devices go back to lists page and verify final state
    await pageA.getByRole('button', { name: 'Lists' }).click();
    await pageB.getByRole('button', { name: 'Lists' }).click();
    await pageC.getByRole('button', { name: 'Lists' }).click();

    // All devices should see the three lists
    const expectedLists = ['Groceries', 'Home Depot Shopping', 'Pharmacy'];

    for (const device of [pageA, pageB, pageC]) {
        for (const listName of expectedLists) {
            await expect(device.locator('.list-row').filter({ hasText: listName })).toBeVisible({ timeout: 10000 });
        }
    }

    console.log('=== Load test completed successfully ===');

    await contextA.close();
    await contextB.close();
    await contextC.close();
});
