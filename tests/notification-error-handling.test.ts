import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { unstable_dev, type UnstableDevWorker } from 'wrangler';

describe('409 Conflict Error Handling', () => {
    let worker: UnstableDevWorker;

    const authHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': 'shopping_auth=pascal123'
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
        // Clean up any existing lists
        const response = await worker.fetch('http://localhost/api/lists', {
            headers: authHeaders
        });

        if (response.ok) {
            const lists = await response.json() as Array<{ id: string }>;
            for (const list of lists) {
                await worker.fetch(`http://localhost/api/lists/${list.id}`, {
                    method: 'DELETE',
                    headers: authHeaders
                });
            }
        }
    });

    it('should return 409 when trying to add duplicate item to list', async () => {
        // First, create a list
        const createListResponse = await worker.fetch('http://localhost/api/lists', {
            method: 'POST',
            headers: authHeaders,
            body: new URLSearchParams({ name: 'Test List' })
        });

        expect(createListResponse.status).toBe(201);
        const list = await createListResponse.json() as { id: string };

        // Add an item to the list
        const addItemResponse = await worker.fetch(`http://localhost/api/lists/${list.id}/items`, {
            method: 'POST',
            headers: authHeaders,
            body: new URLSearchParams({ name: 'Bananen' })
        });

        expect(addItemResponse.status).toBe(201);

        // Try to add the same item again - should return 409
        const duplicateItemResponse = await worker.fetch(`http://localhost/api/lists/${list.id}/items`, {
            method: 'POST',
            headers: authHeaders,
            body: new URLSearchParams({ name: 'Bananen' })
        });

        expect(duplicateItemResponse.status).toBe(409);

        const errorResponse = await duplicateItemResponse.json() as { error: string };
        expect(errorResponse.error).toBe('Item already exists in this list');

        // Cleanup
        await worker.fetch(`http://localhost/api/lists/${list.id}`, {
            method: 'DELETE',
            headers: authHeaders
        });
    });

    it('should return 409 for duplicate items regardless of case', async () => {
        // Create a list
        const createListResponse = await worker.fetch('http://localhost/api/lists', {
            method: 'POST',
            headers: authHeaders,
            body: new URLSearchParams({ name: 'Case Test List' })
        });

        const list = await createListResponse.json() as { id: string };

        // Add an item
        await worker.fetch(`http://localhost/api/lists/${list.id}/items`, {
            method: 'POST',
            headers: authHeaders,
            body: new URLSearchParams({ name: 'Bananen' })
        });

        // Try to add same item with different case
        const duplicateResponse = await worker.fetch(`http://localhost/api/lists/${list.id}/items`, {
            method: 'POST',
            headers: authHeaders,
            body: new URLSearchParams({ name: 'BANANEN' })
        });

        expect(duplicateResponse.status).toBe(409);

        // Cleanup
        await worker.fetch(`http://localhost/api/lists/${list.id}`, {
            method: 'DELETE',
            headers: authHeaders
        });
    });

    it('should successfully add different items to the same list', async () => {
        // Create a list
        const createListResponse = await worker.fetch('http://localhost/api/lists', {
            method: 'POST',
            headers: authHeaders,
            body: new URLSearchParams({ name: 'Multiple Items List' })
        });

        const list = await createListResponse.json() as { id: string };

        // Add first item
        const firstItemResponse = await worker.fetch(`http://localhost/api/lists/${list.id}/items`, {
            method: 'POST',
            headers: authHeaders,
            body: new URLSearchParams({ name: 'Bananen' })
        });
        expect(firstItemResponse.status).toBe(201);

        // Add second different item - should succeed
        const secondItemResponse = await worker.fetch(`http://localhost/api/lists/${list.id}/items`, {
            method: 'POST',
            headers: authHeaders,
            body: new URLSearchParams({ name: 'Äpfel' })
        });
        expect(secondItemResponse.status).toBe(201);

        // Cleanup
        await worker.fetch(`http://localhost/api/lists/${list.id}`, {
            method: 'DELETE',
            headers: authHeaders
        });
    });
});
