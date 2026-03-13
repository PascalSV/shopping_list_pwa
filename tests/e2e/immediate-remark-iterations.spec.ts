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
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true
    });

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

async function addItemAndGetId(page: any, itemName: string): Promise<string> {
    await page.locator('#search-input').fill(itemName);
    await page.locator('#search-input').press('Enter');

    const row = page.locator('.item').filter({ hasText: itemName }).first();
    await expect(row).toBeVisible();

    const itemId = await row.getAttribute('data-item-id');
    if (!itemId) {
        throw new Error('Expected item id for ' + itemName);
    }

    return itemId;
}

async function openEditAndSaveRemark(page: any, listId: string, itemId: string, remark: string) {
    await page.goto('/item/' + itemId + '/edit?listId=' + listId);

    const remarkInput = page.locator('#itemRemark');
    await expect(remarkInput).toBeVisible();
    await expect(remarkInput).toBeFocused();

    await remarkInput.fill(remark);
    await page.locator('form button[type="submit"]').first().click();

    await expect(page).toHaveURL(new RegExp('/list/' + listId + '$'));
}

async function expectRemarkState(page: any, itemName: string, expectedRemark: string) {
    const row = page.locator('.item').filter({ hasText: itemName }).first();
    await expect(row).toBeVisible();

    const remark = row.locator('.item-remark');

    if (!expectedRemark) {
        await expect(remark).toHaveCount(0);
        await expect(row).toHaveClass(/no-remark/);
        return;
    }

    await expect(remark).toContainText(expectedRemark);
}

test('immediate remark editing after adding items works across multiple iterations', async ({ browser, request }) => {
    test.setTimeout(120000);
    await cleanupLists(request);

    const context = await createAuthedContext(browser);
    const page = await context.newPage();

    const listId = await createListViaApi(page, 'Immediate Remark Iterations');
    await page.goto('/list/' + listId);
    await expect(page.locator('#scrolling-title')).toHaveText('Immediate Remark Iterations');

    const scenarios = [
        {
            itemName: 'Iteration Item 1',
            initialRemark: 'milk 2l',
            updatedRemark: 'milk 2l lactose free'
        },
        {
            itemName: 'Iteration Item 2',
            initialRemark: 'wholegrain bread x2',
            updatedRemark: 'wholegrain bread x3 and seeds'
        },
        {
            itemName: 'Iteration Item 3',
            initialRemark: 'quote "special" and ampersand & sign',
            updatedRemark: 'quote updated and punctuation !?'
        },
        {
            itemName: 'Iteration Item 4',
            initialRemark: 'temporary note to clear',
            updatedRemark: ''
        },
        {
            itemName: 'Iteration Item 5',
            initialRemark: 'batch A-17',
            updatedRemark: 'batch B-18'
        }
    ];

    for (let i = 0; i < scenarios.length; i += 1) {
        const scenario = scenarios[i];

        await test.step('iteration ' + (i + 1) + ': add and immediately edit remark for ' + scenario.itemName, async () => {
            const itemId = await addItemAndGetId(page, scenario.itemName);

            await openEditAndSaveRemark(page, listId, itemId, scenario.initialRemark);
            await expectRemarkState(page, scenario.itemName, scenario.initialRemark);

            await openEditAndSaveRemark(page, listId, itemId, scenario.updatedRemark);
            await expectRemarkState(page, scenario.itemName, scenario.updatedRemark);

            // Reload after each iteration to verify persistence on fresh render.
            await page.reload();
            await expect(page.locator('#scrolling-title')).toHaveText('Immediate Remark Iterations');
            await expectRemarkState(page, scenario.itemName, scenario.updatedRemark);
        });
    }

    await context.close();
});
