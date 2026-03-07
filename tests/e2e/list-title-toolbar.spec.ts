import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

async function ensureLoggedIn(page: Page) {
    const createListButton = page.locator('button[hx-get="/list/create"]');
    if (await createListButton.isVisible().catch(() => false)) {
        return;
    }

    const passwordInput = page.locator('#password');
    if (await passwordInput.isVisible().catch(() => false)) {
        await page.locator('#username').selectOption('PascalSV');
        await passwordInput.fill('pascal123');
        await page.locator('button[type="submit"]').first().click();
    }

    await expect(createListButton).toBeVisible();
}

test('toolbar title appears early and scrolling title never overlays toolbar', async ({ browser }) => {
    test.setTimeout(90000);

    const context = await browser.newContext({
        viewport: { width: 390, height: 844 }
    });

    const page = await context.newPage();
    await page.goto('/');
    await ensureLoggedIn(page);

    const listName = 'Toolbar Threshold Test ' + Date.now();

    await page.locator('button[hx-get="/list/create"]').click();
    await page.locator('#listName').waitFor({ state: 'visible' });
    await page.locator('#listName').fill(listName);
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.locator('#scrolling-title')).toHaveText(listName);
    await expect(page.locator('#toolbar-title')).toBeHidden();

    const searchInput = page.locator('#search-input');
    for (let i = 1; i <= 14; i += 1) {
        const itemName = 'Title Item ' + i;
        await searchInput.fill(itemName);
        await searchInput.press('Enter');
        await expect(page.locator('.item').filter({ hasText: itemName })).toBeVisible();
        await page.waitForTimeout(120);
    }

    // Scroll enough to make the scrolling title go above the visible content area
    await page.locator('#content').evaluate((el: HTMLElement) => {
        el.scrollTop = 160;
    });
    await page.waitForTimeout(150);

    await expect(page.locator('#toolbar-title')).toBeVisible();

    const largeTitleScrolledAway = await page.evaluate(() => {
        const content = document.getElementById('content');
        const scrollingTitle = document.getElementById('scrolling-title');

        if (!content || !scrollingTitle) {
            return false;
        }

        const contentTop = content.getBoundingClientRect().top;
        const titleRect = scrollingTitle.getBoundingClientRect();
        return titleRect.bottom <= contentTop + 10;
    });

    expect(largeTitleScrolledAway).toBe(true);

    await page.locator('#content').evaluate((el: HTMLElement) => {
        el.scrollTop += 160;
    });
    await page.waitForTimeout(120);

    const titleBleedsIntoToolbar = await page.evaluate(() => {
        const toolbar = document.getElementById('list-toolbar');
        if (!toolbar) {
            return false;
        }

        const r = toolbar.getBoundingClientRect();
        const x = Math.min(window.innerWidth - 2, Math.max(2, r.left + 24));
        const yInsideToolbar = Math.min(window.innerHeight - 2, Math.max(2, r.top + 4));

        const hit = document.elementFromPoint(x, yInsideToolbar);
        return Boolean(hit && hit.closest('#scrolling-title'));
    });

    expect(titleBleedsIntoToolbar).toBe(false);

    await context.close();
});
