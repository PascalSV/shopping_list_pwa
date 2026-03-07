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

async function createMobileAuthedContext(browser: any) {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 }
    });
    await context.addCookies([{ name: 'shopping_auth', value: 'pascal123', url: 'http://127.0.0.1:8787' }]);
    return context;
}

async function createListWithItems(page: any, listName: string, items: string[]) {
    await page.goto('/');
    await page.locator('button[hx-get="/list/create"]').click();
    await page.locator('#listName').fill(listName);
    await page.locator('form button[type="submit"]').first().click();
    await expect(page.locator('#scrolling-title')).toHaveText(listName);

    const searchInput = page.locator('#search-input');
    for (const item of items) {
        await searchInput.fill(item);
        await searchInput.press('Enter');
        await expect(page.locator('.item').filter({ hasText: item })).toBeVisible();
        await page.waitForTimeout(120);
    }
}

test('list content is scrollable', async ({ browser, request }) => {
    test.setTimeout(90000);
    await cleanupLists(request);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    await createListWithItems(page, 'Scrolling Test List', [
        'Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5',
        'Item 6', 'Item 7', 'Item 8', 'Item 9', 'Item 10'
    ]);

    const contentContainer = page.locator('.content');

    const dimensions = await contentContainer.evaluate((el: HTMLElement) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        scrollTop: el.scrollTop
    }));

    expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);

    const initialScroll = await contentContainer.evaluate((el: HTMLElement) => el.scrollTop);
    expect(initialScroll).toBe(0);

    await contentContainer.evaluate((el: HTMLElement) => {
        el.scrollTop = Math.min(80, el.scrollHeight - el.clientHeight);
    });
    await page.waitForTimeout(120);

    const afterDown = await contentContainer.evaluate((el: HTMLElement) => el.scrollTop);
    expect(afterDown).toBeGreaterThan(initialScroll);

    await contentContainer.evaluate((el: HTMLElement) => {
        el.scrollTop = el.scrollHeight - el.clientHeight;
    });
    await page.waitForTimeout(120);

    const atBottom = await contentContainer.evaluate((el: HTMLElement) => el.scrollTop);
    const maxScroll = await contentContainer.evaluate((el: HTMLElement) => el.scrollHeight - el.clientHeight);
    expect(Math.abs(atBottom - maxScroll)).toBeLessThan(2);

    await contentContainer.evaluate((el: HTMLElement) => {
        el.scrollTop = 0;
    });
    await page.waitForTimeout(120);

    const atTop = await contentContainer.evaluate((el: HTMLElement) => el.scrollTop);
    expect(atTop).toBe(0);

    await context.close();
});

test('scrolling does not trigger edit dialog', async ({ browser, request }) => {
    test.setTimeout(90000);
    await cleanupLists(request);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    await createListWithItems(page, 'Edit Dialog Test List', [
        'Item A', 'Item B', 'Item C', 'Item D', 'Item E', 'Item F',
        'Item G', 'Item H', 'Item I', 'Item J', 'Item K', 'Item L'
    ]);

    const contentContainer = page.locator('.content');

    const scrollable = await contentContainer.evaluate((el: HTMLElement) => el.scrollHeight > el.clientHeight);
    expect(scrollable).toBe(true);

    await contentContainer.evaluate((el: HTMLElement) => {
        el.scrollTop = Math.min(120, el.scrollHeight - el.clientHeight);
    });
    await page.waitForTimeout(100);

    const scrollAfterMove = await contentContainer.evaluate((el: HTMLElement) => el.scrollTop);
    expect(scrollAfterMove).toBeGreaterThan(0);

    const editNameVisible = await page.locator('#itemName').isVisible().catch(() => false);
    const editRemarkVisible = await page.locator('#itemRemark').isVisible().catch(() => false);
    expect(editNameVisible).toBe(false);
    expect(editRemarkVisible).toBe(false);

    await context.close();
});
