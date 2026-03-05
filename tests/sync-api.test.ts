import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { unstable_dev } from 'wrangler';

describe('API Sync Route', () => {
    let worker: any;

    const deviceAHeaders = {
        Authorization: 'Bearer device_a_token',
        'Content-Type': 'application/json'
    };

    const deviceBHeaders = {
        Authorization: 'Bearer device_b_token',
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
        const response = await worker.fetch('http://localhost/api/lists', {
            headers: deviceAHeaders
        });
        const lists = await response.json() as Array<{ id: string }>;

        for (const list of lists) {
            await worker.fetch('http://localhost/api/lists/' + list.id, {
                method: 'DELETE',
                headers: deviceAHeaders
            });
        }
    });

    it('sync create operation from device B is visible to device A', async () => {
        const createListResponse = await worker.fetch('http://localhost/api/lists', {
            method: 'POST',
            headers: deviceAHeaders,
            body: JSON.stringify({ name: 'Shared List' })
        });
        expect(createListResponse.status).toBe(201);
        const list = await createListResponse.json() as { id: string };

        const syncResponse = await worker.fetch('http://localhost/api/sync', {
            method: 'POST',
            headers: deviceBHeaders,
            body: JSON.stringify({
                listId: list.id,
                operations: [
                    {
                        type: 'create',
                        data: { name: 'Milk', remark: '2L', position: 'A1' },
                        clientTimestamp: new Date().toISOString()
                    }
                ],
                itemsSnapshot: []
            })
        });

        expect(syncResponse.status).toBe(200);

        const deviceAItemsResponse = await worker.fetch('http://localhost/api/lists/' + list.id + '/items', {
            headers: deviceAHeaders
        });
        expect(deviceAItemsResponse.status).toBe(200);

        const items = await deviceAItemsResponse.json() as Array<{ name: string; remark: string | null }>;
        expect(items.length).toBe(1);
        expect(items[0].name).toBe('Milk');
        expect(items[0].remark).toBe('2L');
    });

    it('sync update uses last-write-wins and returns conflict for older client timestamp', async () => {
        const createListResponse = await worker.fetch('http://localhost/api/lists', {
            method: 'POST',
            headers: deviceAHeaders,
            body: JSON.stringify({ name: 'Conflict List' })
        });
        const list = await createListResponse.json() as { id: string };

        const createItemResponse = await worker.fetch('http://localhost/api/lists/' + list.id + '/items', {
            method: 'POST',
            headers: deviceAHeaders,
            body: JSON.stringify({ name: 'Pasta', remark: '500g' })
        });
        const item = await createItemResponse.json() as { id: string; updated_at: string; name: string };

        const serverUpdateResponse = await worker.fetch('http://localhost/api/lists/' + list.id + '/items/' + item.id, {
            method: 'PATCH',
            headers: deviceAHeaders,
            body: JSON.stringify({ name: 'Pasta Wholegrain', remark: '500g' })
        });
        expect(serverUpdateResponse.status).toBe(200);

        const olderTimestamp = new Date(Date.now() - 60000).toISOString();
        const syncResponse = await worker.fetch('http://localhost/api/sync', {
            method: 'POST',
            headers: deviceBHeaders,
            body: JSON.stringify({
                listId: list.id,
                operations: [
                    {
                        type: 'update',
                        itemId: item.id,
                        data: { name: 'Old Client Update', remark: 'stale' },
                        clientTimestamp: olderTimestamp
                    }
                ],
                itemsSnapshot: []
            })
        });

        expect(syncResponse.status).toBe(200);
        const syncBody = await syncResponse.json() as {
            items: Array<{ id: string; name: string }>;
            conflicts: Array<{ itemId: string }>;
        };

        expect(syncBody.conflicts.length).toBe(1);
        expect(syncBody.conflicts[0].itemId).toBe(item.id);

        const itemsAfterResponse = await worker.fetch('http://localhost/api/lists/' + list.id + '/items', {
            headers: deviceAHeaders
        });
        const itemsAfter = await itemsAfterResponse.json() as Array<{ id: string; name: string }>;
        const updatedItem = itemsAfter.find(it => it.id === item.id);

        expect(updatedItem).toBeDefined();
        expect(updatedItem!.name).toBe('Pasta Wholegrain');
    });

    it('sync delete operation removes item for all devices', async () => {
        const createListResponse = await worker.fetch('http://localhost/api/lists', {
            method: 'POST',
            headers: deviceAHeaders,
            body: JSON.stringify({ name: 'Delete Sync List' })
        });
        const list = await createListResponse.json() as { id: string };

        const createItemResponse = await worker.fetch('http://localhost/api/lists/' + list.id + '/items', {
            method: 'POST',
            headers: deviceAHeaders,
            body: JSON.stringify({ name: 'Butter' })
        });
        const item = await createItemResponse.json() as { id: string };

        const syncResponse = await worker.fetch('http://localhost/api/sync', {
            method: 'POST',
            headers: deviceBHeaders,
            body: JSON.stringify({
                listId: list.id,
                operations: [
                    {
                        type: 'delete',
                        itemId: item.id,
                        clientTimestamp: new Date().toISOString()
                    }
                ],
                itemsSnapshot: []
            })
        });

        expect(syncResponse.status).toBe(200);

        const deviceAItemsResponse = await worker.fetch('http://localhost/api/lists/' + list.id + '/items', {
            headers: deviceAHeaders
        });
        const items = await deviceAItemsResponse.json() as Array<{ id: string }>;

        expect(items.length).toBe(0);
    });
});
