import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

async function createMobileAuthedContext(browser: any) {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true
    });

    await context.addCookies([
        { name: 'shopping_auth', value: 'pascal123', url: 'http://127.0.0.1:8787' }
    ]);

    return context;
}

test('settings tab opens settings list page', async ({ browser }) => {
    test.setTimeout(60000);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    await page.goto('/');
    await page.locator('.tab-btn.config').click();

    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.locator('.settings-title')).toBeVisible();
    await expect(page.locator('#theme-mode-trigger')).toBeVisible();

    await context.close();
});

test('theme mode is changed from settings list and persisted', async ({ browser }) => {
    test.setTimeout(60000);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    await page.goto('/settings');

    await page.locator('#theme-mode-trigger').click();
    await page.locator('.setting-select-option[data-theme-mode-option="dark"]').click();

    await expect
        .poll(async () => {
            return page.evaluate(() => {
                const theme = document.documentElement.getAttribute('data-theme');
                const stored = localStorage.getItem('shopping-theme-mode');
                return JSON.stringify({ theme, stored });
            });
        })
        .toBe(JSON.stringify({ theme: 'dark', stored: 'dark' }));

    await page.reload();
    await expect(page.locator('#theme-mode-trigger-label')).toBeVisible();
    await expect(page.locator('#theme-mode-trigger-label')).toContainText(/Dark|Dunkel/);

    await page.locator('#theme-mode-trigger').click();
    await page.locator('.setting-select-option[data-theme-mode-option="system"]').click();

    await expect
        .poll(async () => {
            return page.evaluate(() => {
                const theme = document.documentElement.getAttribute('data-theme');
                const stored = localStorage.getItem('shopping-theme-mode');
                return JSON.stringify({ theme, stored });
            });
        })
        .toBe(JSON.stringify({ theme: null, stored: 'system' }));

    await context.close();
});

test('wake lock setting defaults to on and can be toggled', async ({ browser }) => {
    test.setTimeout(60000);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    await page.goto('/settings');

    await expect(page.locator('#wake-lock-toggle')).toBeVisible();
    await expect(page.locator('#wake-lock-toggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#wake-lock-toggle-label')).toContainText(/On|An/);

    await page.locator('#wake-lock-toggle').click();
    await expect(page.locator('#wake-lock-toggle')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#wake-lock-toggle-label')).toContainText(/Off|Aus/);

    await expect
        .poll(async () => {
            return page.evaluate(() => localStorage.getItem('shopping-wake-lock-enabled'));
        })
        .toBe('false');

    await page.locator('#wake-lock-toggle').click();
    await expect(page.locator('#wake-lock-toggle')).toHaveAttribute('aria-pressed', 'true');

    await expect
        .poll(async () => {
            return page.evaluate(() => localStorage.getItem('shopping-wake-lock-enabled'));
        })
        .toBe('true');

    await context.close();
});
