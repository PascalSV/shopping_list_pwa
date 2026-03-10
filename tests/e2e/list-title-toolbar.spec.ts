import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

async function ensureLoggedIn(page: Page) {
    const tabBar = page.locator('#tab-bar');
    if (await tabBar.isVisible().catch(() => false)) {
        return;
    }

    const passwordInput = page.locator('#password');
    if (await passwordInput.isVisible().catch(() => false)) {
        await page.locator('#username').selectOption('PascalSV');
        await passwordInput.fill('pascal123');
        await page.locator('button[type="submit"]').first().click();
    }

    await expect(tabBar).toBeVisible();
}

async function createListViaApi(page: Page, listName: string): Promise<string> {
    const response = await page.request.post('/api/lists', {
        data: { name: listName }
    });
    expect(response.ok()).toBeTruthy();

    const body = await response.json() as { id?: string };
    if (!body.id) {
        throw new Error('Expected list id to be present after API list creation');
    }

    return body.id;
}

test('list title is fixed in header and not part of scrollable content', async ({ browser }) => {
    test.setTimeout(90000);

    const context = await browser.newContext({
        viewport: { width: 390, height: 844 }
    });

    const page = await context.newPage();
    await page.goto('/');
    await ensureLoggedIn(page);

    const listName = 'Toolbar Threshold Test ' + Date.now();

    const listId = await createListViaApi(page, listName);
    await page.goto('/list/' + listId);

    await expect(page.locator('#scrolling-title')).toHaveText(listName);

    const titleInToolbar = await page.evaluate(() => {
        const title = document.getElementById('scrolling-title');
        return Boolean(title && title.closest('#list-toolbar'));
    });
    expect(titleInToolbar).toBe(true);

    const titleInContent = await page.evaluate(() => {
        const content = document.getElementById('content');
        const title = document.getElementById('scrolling-title');
        return Boolean(content && title && content.contains(title));
    });
    expect(titleInContent).toBe(false);

    const initialTitleTop = await page.evaluate(() => {
        const title = document.getElementById('scrolling-title');
        return title ? Math.round(title.getBoundingClientRect().top) : null;
    });
    expect(initialTitleTop).not.toBeNull();

    const searchInput = page.locator('#search-input');
    for (let i = 1; i <= 14; i += 1) {
        const itemName = 'Title Item ' + i;
        await searchInput.fill(itemName);
        await searchInput.press('Enter');
        await expect(page.locator('.item').filter({ hasText: itemName })).toBeVisible();
        await page.waitForTimeout(120);
    }

    await page.locator('#content').evaluate((el: HTMLElement) => {
        el.scrollTop = 260;
    });
    await page.waitForTimeout(150);

    await expect(page.locator('#scrolling-title')).toBeVisible();

    const afterScrollTitleTop = await page.evaluate(() => {
        const title = document.getElementById('scrolling-title');
        return title ? Math.round(title.getBoundingClientRect().top) : null;
    });
    expect(afterScrollTitleTop).not.toBeNull();

    const topDelta = Math.abs((afterScrollTitleTop ?? 0) - (initialTitleTop ?? 0));
    expect(topDelta).toBeLessThanOrEqual(2);

    await context.close();
});
