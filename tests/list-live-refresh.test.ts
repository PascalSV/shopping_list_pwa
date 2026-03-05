import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { unstable_dev } from 'wrangler';
import { v4 as uuidv4 } from 'uuid';

describe('List Name Live Refresh Markup', () => {
    let worker: any;

    const deviceA = {
        id: uuidv4(),
        headers: {
            'Authorization': 'Bearer device_a_token',
            'Content-Type': 'application/json'
        }
    };

    const deviceB = {
        id: uuidv4(),
        headers: {
            'Authorization': 'Bearer device_b_token',
            'Content-Type': 'application/json'
        }
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
            headers: deviceA.headers
        });
        const lists = await response.json() as Array<{ id: string }>;

        for (const list of lists) {
            await worker.fetch('http://localhost/api/lists/' + list.id, {
                method: 'DELETE',
                headers: deviceA.headers
            });
        }
    });

    it('renders live-refresh hooks for list title and polling script', async () => {
        const createResponse = await worker.fetch('http://localhost/api/lists', {
            method: 'POST',
            headers: deviceA.headers,
            body: JSON.stringify({ name: 'Weekly Groceries' })
        });

        expect(createResponse.status).toBe(201);
        const created = await createResponse.json() as { id: string; name: string };

        const pageResponse = await worker.fetch('http://localhost/list/' + created.id, {
            headers: deviceB.headers
        });
        expect(pageResponse.status).toBe(200);

        const html = await pageResponse.text();

        expect(html).toContain('id="current-list-title"');
        expect(html).toContain('data-list-id="' + created.id + '"');
        expect(html).toContain('refreshListTitleFromServer');
        expect(html).toContain("fetch('/api/lists', { cache: 'no-store' })");
        expect(html).toContain('window.setInterval(refreshListTitleFromServer, 4000)');
    });

    it('exposes renamed list name via API for other devices', async () => {
        const createResponse = await worker.fetch('http://localhost/api/lists', {
            method: 'POST',
            headers: deviceA.headers,
            body: JSON.stringify({ name: 'Original Name' })
        });

        expect(createResponse.status).toBe(201);
        const created = await createResponse.json() as { id: string; name: string };

        const renameResponse = await worker.fetch('http://localhost/api/lists/' + created.id, {
            method: 'PUT',
            headers: deviceA.headers,
            body: JSON.stringify({ name: 'Home' })
        });
        expect(renameResponse.status).toBe(200);

        const listsForDeviceB = await worker.fetch('http://localhost/api/lists', {
            headers: deviceB.headers
        });
        expect(listsForDeviceB.status).toBe(200);

        const lists = await listsForDeviceB.json() as Array<{ id: string; name: string }>;
        const renamed = lists.find(list => list.id === created.id);

        expect(renamed).toBeDefined();
        expect(renamed!.name).toBe('Home');
    });
});
