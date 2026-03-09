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

test('edit item remark is displayed correctly in edit form', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const context = await createAuthedContext(browser);
    const page = await context.newPage();

    const listId = await createListViaApi(page, 'Test List');
    await page.goto('/list/' + listId);
    await expect(page.locator('#scrolling-title')).toHaveText('Test List');

    // Add an item with a remark
    const itemName = 'Milk';
    const remarkText = 'Organic, 2% fat';

    await page.locator('#search-input').fill(itemName);
    await page.locator('#search-input').press('Enter');
    await expect(page.locator('.item').filter({ hasText: itemName })).toBeVisible();

    // Get the item ID and navigate to edit
    const itemRow = page.locator('.item').filter({ hasText: itemName }).first();
    const itemId = await itemRow.getAttribute('data-item-id');
    if (!itemId) {
        throw new Error('Expected item id for ' + itemName);
    }

    // Edit the item to add a remark
    await page.goto('/item/' + itemId + '/edit?listId=' + listId);
    await expect(page.locator('#itemName')).toBeVisible();
    await expect(page.locator('#itemName')).toHaveValue(itemName);

    // Add remark and save
    await page.locator('#itemRemark').fill(remarkText);
    await page.locator('form button[type="submit"]').first().click();

    // Navigate back to list to verify remark was saved
    await expect(page.locator('#scrolling-title')).toHaveText('Test List', { timeout: 10000 });
    await expect(page.locator('.item-remark').filter({ hasText: remarkText })).toBeVisible({ timeout: 10000 });

    // Now open edit again and verify the remark is displayed in the form
    await page.goto('/item/' + itemId + '/edit?listId=' + listId);
    await expect(page.locator('#itemName')).toBeVisible();
    await expect(page.locator('#itemName')).toHaveValue(itemName);

    // Verify remark is displayed in the edit form
    const remarkInput = page.locator('#itemRemark');
    await expect(remarkInput).toBeVisible();
    await expect(remarkInput).toHaveValue(remarkText);

    await context.close();
});

test('edit item remark with special characters is displayed correctly', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const context = await createAuthedContext(browser);
    const page = await context.newPage();

    const listId = await createListViaApi(page, 'Special Chars List');
    await page.goto('/list/' + listId);
    await expect(page.locator('#scrolling-title')).toHaveText('Special Chars List');

    // Add an item with a remark containing special characters
    const itemName = 'Cheese';
    const remarkWithSpecialChars = 'It\'s "fresh" & delicious (great deal!)';

    await page.locator('#search-input').fill(itemName);
    await page.locator('#search-input').press('Enter');
    await expect(page.locator('.item').filter({ hasText: itemName })).toBeVisible();

    const itemRow = page.locator('.item').filter({ hasText: itemName }).first();
    const itemId = await itemRow.getAttribute('data-item-id');
    if (!itemId) {
        throw new Error('Expected item id for ' + itemName);
    }

    // Edit to add special character remark
    await page.goto('/item/' + itemId + '/edit?listId=' + listId);
    await expect(page.locator('#itemName')).toBeVisible();
    await expect(page.locator('#itemName')).toHaveValue(itemName);

    // Add remark with special characters
    await page.locator('#itemRemark').fill(remarkWithSpecialChars);
    await page.locator('form button[type="submit"]').first().click();

    // Verify the remark was saved corectly
    await expect(page.locator('#scrolling-title')).toHaveText('Special Chars List', { timeout: 10000 });
    // The remark should be visible (special chars will be rendered as text content, not in attribute)
    await expect(page.locator('.item-remark')).toContainText('"fresh"', { timeout: 10000 });

    // Open edit again and verify special characters are preserved in the form
    await page.goto('/item/' + itemId + '/edit?listId=' + listId);
    await expect(page.locator('#itemName')).toBeVisible();

    // Verify the remark with special characters is preserved
    // Note: HTML entities in attributes (&#39;, &quot;, &amp;) are normal and get decoded by the browser
    const remarkInput = page.locator('#itemRemark');
    await expect(remarkInput).toBeVisible();
    // Get the input value via JavaScript to ensure proper encoding handling
    const inputValue = await remarkInput.inputValue();
    expect(inputValue).toBe(remarkWithSpecialChars);

    await context.close();
});

test('edit item without remark shows empty remark field', async ({ browser, request }) => {
    test.setTimeout(60000);
    await cleanupLists(request);

    const context = await createAuthedContext(browser);
    const page = await context.newPage();

    const listId = await createListViaApi(page, 'Test List');
    await page.goto('/list/' + listId);
    await expect(page.locator('#scrolling-title')).toHaveText('Test List');

    // Add an item without a remark
    const itemName = 'Bread';

    await page.locator('#search-input').fill(itemName);
    await page.locator('#search-input').press('Enter');
    await expect(page.locator('.item').filter({ hasText: itemName })).toBeVisible();

    // Get the item ID and navigate to edit
    const itemRow = page.locator('.item').filter({ hasText: itemName }).first();
    const itemId = await itemRow.getAttribute('data-item-id');
    if (!itemId) {
        throw new Error('Expected item id for ' + itemName);
    }

    // Edit the item - remark field should be empty
    await page.goto('/item/' + itemId + '/edit?listId=' + listId);
    await expect(page.locator('#itemName')).toBeVisible();
    await expect(page.locator('#itemName')).toHaveValue(itemName);

    // Verify remark field is empty
    const remarkInput = page.locator('#itemRemark');
    await expect(remarkInput).toBeVisible();
    const inputValue = await remarkInput.inputValue();
    expect(inputValue).toBe('');

    // Add a remark and save
    const newRemark = 'Whole grain, 2 loaves';
    await page.locator('#itemRemark').fill(newRemark);
    await page.locator('form button[type="submit"]').first().click();

    // Navigate back to list
    await expect(page.locator('#scrolling-title')).toHaveText('Test List', { timeout: 10000 });

    // Open edit again and verify the remark is displayed
    await page.goto('/item/' + itemId + '/edit?listId=' + listId);
    const finalRemarkValue = await page.locator('#itemRemark').inputValue();
    expect(finalRemarkValue).toBe(newRemark);

    await context.close();
});
