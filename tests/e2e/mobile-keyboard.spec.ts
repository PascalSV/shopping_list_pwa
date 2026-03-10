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

test('tab bar hides while mobile search input is focused and returns on blur', async ({ browser }) => {
    test.setTimeout(60000);

    const context = await createMobileAuthedContext(browser);
    const page = await context.newPage();

    const listId = await createListViaApi(page, 'Keyboard Hide Test');
    await page.goto('/list/' + listId);

    const container = page.locator('.container.has-search');
    const tabBar = page.locator('#tab-bar');
    const searchInput = page.locator('#search-input');

    await expect(tabBar).toBeVisible();
    await expect(container).not.toHaveClass(/keyboard-open/);

    await searchInput.click();
    await expect(container).toHaveClass(/keyboard-open/);

    await searchInput.evaluate((element: HTMLInputElement) => element.blur());
    await expect(container).not.toHaveClass(/keyboard-open/);
    await expect(tabBar).toBeVisible();

    await context.close();
});
