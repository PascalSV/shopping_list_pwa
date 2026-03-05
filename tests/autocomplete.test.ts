import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { unstable_dev, type UnstableDevWorker } from 'wrangler';
import { v4 as uuidv4 } from 'uuid';

describe('Autocomplete Functionality', () => {
    let worker: UnstableDevWorker;
    let testListId: string;

    const deviceHeaders = {
        'Authorization': 'Bearer test_device',
        'Content-Type': 'application/json'
    };

    beforeAll(async () => {
        worker = await unstable_dev('src/worker/index.ts', {
            experimental: { disableExperimentalWarning: true },
            local: true
        });
    });

    afterAll(async () => {
        await worker.stop();
    });

    beforeEach(async () => {
        // Clean up: delete all lists
        const response = await worker.fetch('http://localhost/api/lists', {
            headers: deviceHeaders
        });
        const lists = await response.json() as Array<{ id: string }>;

        for (const list of lists) {
            await worker.fetch('http://localhost/api/lists/' + list.id, {
                method: 'DELETE',
                headers: deviceHeaders
            });
        }

        // Create a test list
        const createResponse = await worker.fetch('http://localhost/api/lists', {
            method: 'POST',
            headers: deviceHeaders,
            body: JSON.stringify({ name: 'Test Shopping List' })
        });
        const createdList = await createResponse.json() as { id: string };
        testListId = createdList.id;
    });

    it('should return empty suggestions when query is empty', async () => {
        const response = await worker.fetch('http://localhost/api/autocomplete?q=', {
            headers: deviceHeaders
        });

        expect(response.status).toBe(200);
        const html = await response.text();
        expect(html).toBe('');
    });

    it('should return empty suggestions when no items match', async () => {
        const response = await worker.fetch('http://localhost/api/autocomplete?q=nonexistent', {
            headers: deviceHeaders
        });

        expect(response.status).toBe(200);
        const html = await response.text();
        expect(html).toBe('');
    });

    it('should return suggestions based on previously added items', async () => {
        // Add some items to populate the history
        await worker.fetch('http://localhost/api/lists/' + testListId + '/items', {
            method: 'POST',
            headers: deviceHeaders,
            body: JSON.stringify({ name: 'Apples' })
        });

        await worker.fetch('http://localhost/api/lists/' + testListId + '/items', {
            method: 'POST',
            headers: deviceHeaders,
            body: JSON.stringify({ name: 'Bananas' })
        });

        await worker.fetch('http://localhost/api/lists/' + testListId + '/items', {
            method: 'POST',
            headers: deviceHeaders,
            body: JSON.stringify({ name: 'Avocado' })
        });

        // Search for items containing 'app'
        const response = await worker.fetch('http://localhost/api/autocomplete?q=app', {
            headers: deviceHeaders
        });

        expect(response.status).toBe(200);
        const html = await response.text();

        // Should contain option elements for matching items
        expect(html).toContain('Apples');
        expect(html).not.toContain('Avocado');
        expect(html).not.toContain('Bananas');
    });

    it('should return suggestions in HTML button format', async () => {
        // Add an item
        await worker.fetch('http://localhost/api/lists/' + testListId + '/items', {
            method: 'POST',
            headers: deviceHeaders,
            body: JSON.stringify({ name: 'Tomatoes' })
        });

        // Search for it
        const response = await worker.fetch('http://localhost/api/autocomplete?q=tom', {
            headers: deviceHeaders
        });

        expect(response.status).toBe(200);
        const html = await response.text();

        // Should return properly formatted button elements
        expect(html).toContain('<button');
        expect(html).toContain('suggestion-btn');
        expect(html).toContain('Tomatoes');
        expect(html).toContain('data-item-name=');
        expect(html).toContain('/>');
    });

    it('should handle case-insensitive search', async () => {
        // Add an item with capital letters
        await worker.fetch('http://localhost/api/lists/' + testListId + '/items', {
            method: 'POST',
            headers: deviceHeaders,
            body: JSON.stringify({ name: 'Chicken Breast' })
        });

        // Search with lowercase
        const response = await worker.fetch('http://localhost/api/autocomplete?q=chicken', {
            headers: deviceHeaders
        });

        expect(response.status).toBe(200);
        const html = await response.text();
        expect(html).toContain('Chicken Breast');
    });

    it('should limit autocomplete results', async () => {
        // Add many items
        const items = [
            'Apple', 'Apricot', 'Avocado', 'Artichoke', 'Asparagus',
            'Almond', 'Anchovy', 'Arugula', 'Amaranth', 'Acorn Squash',
            'Anise', 'Allspice'
        ];

        for (const item of items) {
            await worker.fetch('http://localhost/api/lists/' + testListId + '/items', {
                method: 'POST',
                headers: deviceHeaders,
                body: JSON.stringify({ name: item })
            });
        }

        // Search for 'a'
        const response = await worker.fetch('http://localhost/api/autocomplete?q=a', {
            headers: deviceHeaders
        });

        expect(response.status).toBe(200);
        const html = await response.text();

        // Count the number of option elements (should be limited to 10 by default)
        const optionCount = (html.match(/<option/g) || []).length;
        expect(optionCount).toBeLessThanOrEqual(10);
    });
});
