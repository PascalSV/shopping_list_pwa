import { test, expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });
test.setTimeout(180000);

const AUTH_COOKIE_VALUE = 'pascal123';
const COOKIE = {
    name: 'shopping_auth',
    value: AUTH_COOKIE_VALUE,
    url: 'http://127.0.0.1:8787'
};

type Device = {
    name: string;
    context: BrowserContext;
    page: Page;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const itemLocator = (page: Page, itemName: string) => {
    const exactName = new RegExp('^' + escapeRegExp(itemName) + '$');
    return page.locator('.item').filter({
        has: page.locator('.item-name', { hasText: exactName })
    }).first();
};

async function cleanupAllLists(request: APIRequestContext): Promise<void> {
    const headers = {
        Cookie: `shopping_auth=${AUTH_COOKIE_VALUE}`,
        'Content-Type': 'application/json'
    };

    const listsResponse = await request.get('/api/lists', { headers });
    expect(listsResponse.ok()).toBeTruthy();

    const lists = await listsResponse.json() as Array<{ id: string }>;
    for (const list of lists) {
        await request.delete('/api/lists/' + list.id, { headers });
    }
}

async function createDevice(browser: Browser, name: string): Promise<Device> {
    const context = await browser.newContext();
    await context.addCookies([COOKIE]);
    const page = await context.newPage();
    return { name, context, page };
}

async function createList(page: Page, listName: string): Promise<string> {
    await page.goto('/');
    await expect(page.locator('.lists-management')).toBeVisible({ timeout: 15000 });

    await page.locator('button[hx-get="/list/create"]').first().click();
    await expect(page.locator('#listName')).toBeVisible({ timeout: 10000 });
    await page.locator('#listName').fill(listName);
    await page.locator('form button[type="submit"]').first().click();

    await expect(page.locator('#scrolling-title')).toHaveText(listName, { timeout: 15000 });

    const listId = await page.locator('#scrolling-title').getAttribute('data-list-id');
    if (!listId) {
        throw new Error('Expected list id to be present after list creation');
    }

    return listId;
}

async function openListById(page: Page, listId: string, expectedTitle?: string): Promise<void> {
    await page.goto('/list/' + listId);
    await expect(page.locator('#scrolling-title')).toBeVisible({ timeout: 20000 });

    if (expectedTitle) {
        await expect(page.locator('#scrolling-title')).toHaveText(expectedTitle, { timeout: 20000 });
    }
}

async function addItem(page: Page, itemName: string): Promise<void> {
    await expect(page.locator('#search-input')).toBeVisible({ timeout: 10000 });
    await page.locator('#search-input').fill(itemName);
    await page.locator('#search-input').press('Enter');
    await expect(itemLocator(page, itemName)).toBeVisible({ timeout: 20000 });
}

async function findItemId(page: Page, itemName: string): Promise<string> {
    const row = itemLocator(page, itemName);
    await expect(row).toBeVisible({ timeout: 20000 });
    const itemId = await row.getAttribute('data-item-id');
    if (!itemId) {
        throw new Error(`Expected item id for ${itemName}`);
    }
    return itemId;
}

async function renameListOnline(page: Page, listId: string, newName: string): Promise<void> {
    await page.goto('/list/' + listId + '/edit');
    await expect(page.locator('#listName')).toBeVisible({ timeout: 10000 });
    await page.locator('#listName').fill(newName);
    await page.locator('form .form-actions button[type="submit"]').first().click();
    await page.waitForURL('**/list/' + listId, { timeout: 15000 });
    await expect(page.locator('#scrolling-title')).toHaveText(newName, { timeout: 20000 });
}

async function queueListRenameOffline(page: Page, listId: string, newName: string): Promise<void> {
    await page.goto('/list/' + listId + '/edit');
    await expect(page.locator('#listName')).toBeVisible({ timeout: 10000 });
    await page.locator('#listName').fill(newName);
    await page.locator('form .form-actions button[type="submit"]').first().click();
    await page.waitForTimeout(1000);
}

async function primeEditView(page: Page, listId: string): Promise<void> {
    await page.goto('/list/' + listId + '/edit');
    await expect(page.locator('#listName')).toBeVisible({ timeout: 10000 });
    await page.goto('/list/' + listId);
    await expect(page.locator('#search-input')).toBeVisible({ timeout: 10000 });
}

async function expectItems(page: Page, shouldExist: string[], shouldNotExist: string[]): Promise<void> {
    for (const itemName of shouldExist) {
        await expect(itemLocator(page, itemName)).toBeVisible({ timeout: 30000 });
    }

    for (const itemName of shouldNotExist) {
        await expect(itemLocator(page, itemName)).not.toBeVisible({ timeout: 30000 });
    }
}

test('three users stay consistent under concurrent and offline conditions', async ({ browser, request }) => {
    await cleanupAllLists(request);

    const userA = await createDevice(browser, 'Alex');
    const userB = await createDevice(browser, 'Bianca');
    const userC = await createDevice(browser, 'Chris');

    const devices = [userA, userB, userC];

    try {
        console.log('=== Phase 1: Create shared list and open on all devices ===');

        const initialListName = 'Triad Sync List';
        const listId = await createList(userA.page, initialListName);

        await Promise.all([
            openListById(userB.page, listId, initialListName),
            openListById(userC.page, listId, initialListName)
        ]);

        console.log('=== Phase 2: Concurrent item creation by three users ===');

        await Promise.all([
            addItem(userA.page, 'Alpha Apples'),
            addItem(userB.page, 'Bravo Bread'),
            addItem(userC.page, 'Charlie Cheese')
        ]);

        await Promise.all([
            addItem(userA.page, 'Delta Eggs'),
            addItem(userB.page, 'Echo Milk'),
            addItem(userC.page, 'Foxtrot Flour')
        ]);

        const baselineItems = ['Alpha Apples', 'Bravo Bread', 'Charlie Cheese', 'Delta Eggs', 'Echo Milk', 'Foxtrot Flour'];
        for (const device of devices) {
            await openListById(device.page, listId, initialListName);
            await expectItems(device.page, baselineItems, []);
        }

        console.log('=== Phase 3: Online rename while other users add items ===');

        // All three users: one renames list, two add items concurrently
        await Promise.all([
            renameListOnline(userA.page, listId, 'Triad Sync List v2'),
            addItem(userB.page, 'Golf Garlic'),
            addItem(userC.page, 'Hotel Honey')
        ]);

        console.log('=== Phase 4: Verify all devices see current state ===');

        const onlineItems = ['Alpha Apples', 'Bravo Bread', 'Charlie Cheese', 'Delta Eggs', 'Echo Milk', 'Foxtrot Flour', 'Golf Garlic', 'Hotel Honey'];
        for (const device of devices) {
            await openListById(device.page, listId, 'Triad Sync List v2');
            await expectItems(device.page, onlineItems, []);
        }

        console.log('=== Phase 5: One user offline with queued rename, others continue online ===');

        await primeEditView(userB.page, listId);

        // Slow down userC to simulate degraded network
        const degradedApiRoute = async (route: any) => {
            await wait(800);
            await route.continue();
        };

        await userC.context.route('**/api/**', degradedApiRoute);

        // User B goes fully offline
        await userB.context.setOffline(true);

        // Queue a rename on B while offline
        await queueListRenameOffline(userB.page, listId, 'Triad Sync List Offline');

        // A adds an item while B is offline
        // C adds an item with degraded network
        await Promise.all([
            (async () => {
                await openListById(userA.page, listId);
                await addItem(userA.page, 'India Ink');
            })(),
            (async () => {
                await openListById(userC.page, listId);
                await addItem(userC.page, 'Kilo Ketchup');
            })()
        ]);

        console.log('=== Phase 6: Bring offline user back online and verify convergence ===');

        await userB.context.setOffline(false);
        await wait(8000); // Wait for queue to process and polling to gather new state
        await userC.context.unroute('**/api/**', degradedApiRoute);

        // Force refresh all devices to ensure they have latest state
        for (const device of devices) {
            await device.page.reload();
        }

        // All devices should now see:
        // - All items: original 6 + Golf Garlic + Hotel Honey + India Ink + Kilo Ketchup

        for (const device of devices) {
            // Verify list
            await openListById(device.page, listId);

            // Items that definitely should be there
            const guaranteedItems = ['Alpha Apples', 'Bravo Bread', 'Charlie Cheese', 'Delta Eggs', 'Echo Milk', 'Foxtrot Flour', 'Golf Garlic', 'Hotel Honey', 'India Ink', 'Kilo Ketchup'];

            for (const item of guaranteedItems) {
                await expect(itemLocator(device.page, item)).toBeVisible({ timeout: 20000 });
            }
        }

        console.log('=== 3-device sync scenario completed successfully ===');
    } finally {
        await Promise.all(devices.map(async (device) => {
            await device.context.close();
        }));
    }
});
