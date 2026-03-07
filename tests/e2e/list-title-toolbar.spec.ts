import { test, expect, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

async function ensureLoggedIn(page: Page) {
    const createListButton = page.getByRole('button', { name: 'Create New List' });
    if (await createListButton.isVisible().catch(() => false)) {
        return;
    }

    const passwordInput = page.locator('#password');
    if (await passwordInput.isVisible().catch(() => false)) {
        await page.locator('#username').selectOption('PascalSV');
        await passwordInput.fill('pascal123');
        await page.getByRole('button', { name: 'Sign In' }).click();
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

    await page.getByRole('button', { name: 'Create New List' }).click();
    await page.locator('#listName').waitFor({ state: 'visible' });
    await page.locator('#listName').fill(listName);
    await page.getByRole('button', { name: 'Create List' }).click();

    await expect(page.locator('#scrolling-title')).toHaveText(listName);
    await expect(page.locator('#toolbar-title')).toBeHidden();

    const searchInput = page.locator('#search-input');
    for (let i = 1; i <= 14; i += 1) {
        const itemName = 'Title Item ' + i;
        await searchInput.fill(itemName);
        await searchInput.press('Enter');
        await expect(page.getByText(itemName)).toBeVisible();
        await page.waitForTimeout(120);
    }

    await page.locator('#content').evaluate((el: HTMLElement) => {
        el.scrollTop += 16;
    });
    await page.waitForTimeout(120);

    await expect(page.locator('#toolbar-title')).toBeVisible();

    const largeTitleStillVisible = await page.evaluate(() => {
        const toolbar = document.getElementById('list-toolbar');
        const scrollingTitle = document.getElementById('scrolling-title');

        if (!toolbar || !scrollingTitle) {
            return false;
        }

        const toolbarRect = toolbar.getBoundingClientRect();
        const titleRect = scrollingTitle.getBoundingClientRect();
        return titleRect.bottom > (toolbarRect.bottom + 2);
    });

    expect(largeTitleStillVisible).toBe(true);

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
