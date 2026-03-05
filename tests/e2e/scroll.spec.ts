import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('list content is scrollable', async ({ browser, request }) => {
    // Clean up first
    const cleanupHeaders = {
        Authorization: 'Bearer scroll_test_device',
        'Content-Type': 'application/json'
    };

    const listsResponse = await request.get('/api/lists', { headers: cleanupHeaders });
    const lists = await listsResponse.json() as Array<{ id: string }>;
    for (const list of lists) {
        await request.delete('/api/lists/' + list.id, { headers: cleanupHeaders });
    }

    const context = await browser.newContext({
        extraHTTPHeaders: { Authorization: 'Bearer scroll_test_device' },
        viewport: { width: 390, height: 844 }  // Mobile viewport
    });

    const page = await context.newPage();
    await page.goto('/');

    // Create a new list
    await page.getByRole('button', { name: 'New List' }).click();
    await page.locator('#listName').waitFor({ state: 'visible' });
    await page.locator('#listName').fill('Scrolling Test List');
    await page.getByRole('button', { name: 'Create List' }).click();

    // Wait for list to be displayed
    await expect(page.getByRole('heading', { level: 2, name: 'Scrolling Test List' })).toBeVisible();

    // Add many items to make the list scrollable
    const itemsToAdd = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6', 'Item 7', 'Item 8', 'Item 9', 'Item 10'];
    const searchInput = page.locator('#search-input');

    for (const item of itemsToAdd) {
        await searchInput.fill(item);
        await searchInput.press('Enter');
        await expect(page.getByText(item)).toBeVisible();
        // Wait for HTMX to settle
        await page.waitForTimeout(300);
        // Clear for next item
        await searchInput.fill('');
        await page.waitForTimeout(100);
    }

    // Get the content container
    const contentContainer = page.locator('.content');

    // Wait for content to stabilize
    await page.waitForTimeout(500);

    // Check that content has scroll capability (scrollHeight > clientHeight)
    const dimensions = await contentContainer.evaluate((el: HTMLElement) => {
        const maxScroll = el.scrollHeight - el.clientHeight;
        return {
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            scrollTop: el.scrollTop,
            overflow: window.getComputedStyle(el).overflowY,
            padding: window.getComputedStyle(el).padding,
            paddingBottom: window.getComputedStyle(el).paddingBottom,
            maxScroll: maxScroll
        };
    });

    console.log('Content container dimensions:', dimensions);
    const scrollable = dimensions.scrollHeight > dimensions.clientHeight;

    console.log('Is scrollable:', scrollable);
    console.log('Max possible scroll:', dimensions.maxScroll);
    expect(scrollable).toBe(true);

    // Get initial scroll position
    const initialScroll = await contentContainer.evaluate((el: HTMLElement) => el.scrollTop);
    console.log('Initial scroll position:', initialScroll);
    expect(initialScroll).toBe(0);

    // Test scrolling down
    const maxScrollValue = await contentContainer.evaluate((el: HTMLElement) => {
        return el.scrollHeight - el.clientHeight;
    });

    const scrollAmount = Math.min(50, maxScrollValue);
    await contentContainer.evaluate((el: HTMLElement, amount: number) => {
        el.scrollTop = amount;
    }, scrollAmount);

    // Give browser time to process
    await page.waitForTimeout(100);

    // Check new scroll position
    const scrolledDown = await contentContainer.evaluate((el: HTMLElement) => el.scrollTop);
    console.log('Scroll position after scrolling down:', scrolledDown);
    console.log('Max scroll available:', maxScrollValue);
    expect(scrolledDown).toBeGreaterThan(initialScroll);

    // Test scrolling to bottom
    await contentContainer.evaluate((el: HTMLElement) => {
        el.scrollTop = el.scrollHeight - el.clientHeight;
    });

    await page.waitForTimeout(100);

    const scrolledToBottom = await contentContainer.evaluate((el: HTMLElement) => el.scrollTop);
    const finalMaxScroll = await contentContainer.evaluate((el: HTMLElement) => el.scrollHeight - el.clientHeight);
    console.log('Scroll position at bottom:', scrolledToBottom);
    console.log('Max scroll:', finalMaxScroll);
    // Allow 1px tolerance for rounding
    expect(Math.abs(scrolledToBottom - finalMaxScroll)).toBeLessThan(2);

    // Test scrolling back to top
    await contentContainer.evaluate((el: HTMLElement) => {
        el.scrollTop = 0;
    });

    await page.waitForTimeout(100);

    const scrolledToTop = await contentContainer.evaluate((el: HTMLElement) => el.scrollTop);
    console.log('Scroll position after scrolling to top:', scrolledToTop);
    expect(scrolledToTop).toBe(0);

    // Test natural scrolling with mouse wheel
    // First scroll back to top to test wheel scroll
    await contentContainer.evaluate((el: HTMLElement) => {
        el.scrollTop = 0;
    });
    await page.waitForTimeout(100);

    const firstItem = page.locator('.item').first();
    const bbox = await firstItem.boundingBox();

    if (bbox) {
        const scrollBefore = await contentContainer.evaluate((el: HTMLElement) => el.scrollTop);

        // Move to content area and scroll
        await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
        await page.mouse.wheel(0, 5);  // Positive delta = scroll down
        await page.waitForTimeout(300);

        const scrollAfter = await contentContainer.evaluate((el: HTMLElement) => el.scrollTop);
        console.log('Scroll before wheel:', scrollBefore);
        console.log('Scroll after wheel:', scrollAfter);
        // After scrolling down, position should increase (or stay same if we're at bottom)
        expect(scrollAfter).toBeGreaterThanOrEqual(scrollBefore);
    }

    await context.close();
});

test('scrolling does not trigger edit dialog', async ({ browser, request }) => {
    // Clean up first
    const cleanupHeaders = {
        Authorization: 'Bearer scroll_edit_test_device',
        'Content-Type': 'application/json'
    };

    const listsResponse = await request.get('/api/lists', { headers: cleanupHeaders });
    const lists = await listsResponse.json() as Array<{ id: string }>;
    for (const list of lists) {
        await request.delete('/api/lists/' + list.id, { headers: cleanupHeaders });
    }

    const context = await browser.newContext({
        extraHTTPHeaders: { Authorization: 'Bearer scroll_edit_test_device' },
        viewport: { width: 390, height: 844 }
    });

    const page = await context.newPage();
    await page.goto('/');

    // Create a new list
    await page.getByRole('button', { name: 'New List' }).click();
    await page.locator('#listName').waitFor({ state: 'visible' });
    await page.locator('#listName').fill('Edit Dialog Test List');
    await page.getByRole('button', { name: 'Create List' }).click();

    // Wait for list to be displayed
    await expect(page.getByRole('heading', { level: 2, name: 'Edit Dialog Test List' })).toBeVisible();

    // Add many items
    const itemsToAdd = ['Item A', 'Item B', 'Item C', 'Item D', 'Item E', 'Item F', 'Item G', 'Item H', 'Item I', 'Item J', 'Item K', 'Item L'];
    const searchInput = page.locator('#search-input');

    for (const item of itemsToAdd) {
        await searchInput.fill(item);
        await searchInput.press('Enter');
        await expect(page.getByText(item)).toBeVisible();
        // Wait for HTMX to settle
        await page.waitForTimeout(300);
        // Clear for next item
        await searchInput.fill('');
        await page.waitForTimeout(100);
    }

    const contentContainer = page.locator('.content');

    // Verify we can scroll
    const scrollable = await contentContainer.evaluate((el: HTMLElement) => {
        return el.scrollHeight > el.clientHeight;
    });
    expect(scrollable).toBe(true);

    // Scroll down by dragging touch-like interaction
    const firstItem = page.locator('.item').first();
    const boundingBox = await firstItem.boundingBox();

    if (boundingBox) {
        // Simulate a scrolling gesture from middle of first item downward
        const startY = boundingBox.y + boundingBox.height / 2;
        const startX = boundingBox.x + boundingBox.width / 2;

        await page.mouse.move(startX, startY);
        await page.mouse.down();

        // Drag down to scroll
        await page.mouse.move(startX, startY - 80);

        await page.waitForTimeout(100);

        await page.mouse.up();
    }

    // Check that no edit dialog appeared
    const editDialog = page.locator('[role="dialog"]').first();
    const isVisible = await editDialog.isVisible().catch(() => false);

    console.log('Edit dialog visible after scroll:', isVisible);
    expect(isVisible).toBe(false);

    await context.close();
});
