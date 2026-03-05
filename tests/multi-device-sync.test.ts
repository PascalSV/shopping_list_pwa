import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { unstable_dev, type UnstableDevWorker } from 'wrangler';
import { v4 as uuidv4 } from 'uuid';

describe('Multi-Device List Synchronization', () => {
    let worker: UnstableDevWorker;

    // Simulate two different devices with different tokens
    const deviceA = {
        id: uuidv4(),
        token: 'device_a_token',
        headers: {
            'Authorization': 'Bearer device_a_token',
            'Content-Type': 'application/json'
        }
    };

    const deviceB = {
        id: uuidv4(),
        token: 'device_b_token',
        headers: {
            'Authorization': 'Bearer device_b_token',
            'Content-Type': 'application/json'
        }
    };

    beforeAll(async () => {
        // Start the worker for testing
        worker = await unstable_dev('src/worker/index.ts', {
            experimental: { disableExperimentalWarning: true },
            local: true
        });
    });

    afterAll(async () => {
        await worker.stop();
    });

    beforeEach(async () => {
        // Clean up: delete all lists before each test
        const response = await worker.fetch('http://localhost/api/lists', {
            headers: deviceA.headers
        });
        const lists = await response.json() as Array<{ id: string }>;

        for (const list of lists) {
            await worker.fetch(`http://localhost/api/lists/${list.id}`, {
                method: 'DELETE',
                headers: deviceA.headers
            });
        }
    });

    describe('List Creation Synchronization', () => {
        it('should allow Device B to see a list created by Device A', async () => {
            // Device A creates a list
            const createResponse = await worker.fetch('http://localhost/api/lists', {
                method: 'POST',
                headers: deviceA.headers,
                body: JSON.stringify({ name: 'Groceries from Device A' })
            });

            expect(createResponse.status).toBe(201);
            const createdList = await createResponse.json() as { id: string; name: string };
            expect(createdList.name).toBe('Groceries from Device A');
            expect(createdList.id).toBeDefined();

            // Device B fetches all lists
            const deviceBResponse = await worker.fetch('http://localhost/api/lists', {
                headers: deviceB.headers
            });

            expect(deviceBResponse.status).toBe(200);
            const deviceBLists = await deviceBResponse.json() as Array<{ id: string; name: string }>;

            // Device B should see the list created by Device A
            expect(deviceBLists.length).toBe(1);
            expect(deviceBLists[0].id).toBe(createdList.id);
            expect(deviceBLists[0].name).toBe('Groceries from Device A');
        });

        it('should allow both devices to create lists and see each other\'s lists', async () => {
            // Device A creates a list
            const deviceAResponse = await worker.fetch('http://localhost/api/lists', {
                method: 'POST',
                headers: deviceA.headers,
                body: JSON.stringify({ name: 'Device A Shopping List' })
            });

            expect(deviceAResponse.status).toBe(201);
            const listA = await deviceAResponse.json() as { id: string; name: string };

            // Device B creates a list
            const deviceBResponse = await worker.fetch('http://localhost/api/lists', {
                method: 'POST',
                headers: deviceB.headers,
                body: JSON.stringify({ name: 'Device B Shopping List' })
            });

            expect(deviceBResponse.status).toBe(201);
            const listB = await deviceBResponse.json() as { id: string; name: string };

            // Device A fetches all lists
            const deviceAListsResponse = await worker.fetch('http://localhost/api/lists', {
                headers: deviceA.headers
            });
            const deviceALists = await deviceAListsResponse.json() as Array<{ id: string; name: string }>;

            // Device B fetches all lists
            const deviceBListsResponse = await worker.fetch('http://localhost/api/lists', {
                headers: deviceB.headers
            });
            const deviceBLists = await deviceBListsResponse.json() as Array<{ id: string; name: string }>;

            // Both devices should see both lists
            expect(deviceALists.length).toBe(2);
            expect(deviceBLists.length).toBe(2);

            // Verify Device A sees both lists
            const deviceAListIds = deviceALists.map(l => l.id).sort();
            expect(deviceAListIds).toContain(listA.id);
            expect(deviceAListIds).toContain(listB.id);

            // Verify Device B sees both lists
            const deviceBListIds = deviceBLists.map(l => l.id).sort();
            expect(deviceBListIds).toContain(listA.id);
            expect(deviceBListIds).toContain(listB.id);
        });
    });

    describe('List Rename Synchronization', () => {
        it('should allow Device B to see a list renamed by Device A', async () => {
            // Device A creates a list
            const createResponse = await worker.fetch('http://localhost/api/lists', {
                method: 'POST',
                headers: deviceA.headers,
                body: JSON.stringify({ name: 'Original Name' })
            });

            const createdList = await createResponse.json() as { id: string; name: string };
            const listId = createdList.id;

            // Device A renames the list
            const renameResponse = await worker.fetch(`http://localhost/api/lists/${listId}`, {
                method: 'PUT',
                headers: deviceA.headers,
                body: JSON.stringify({ name: 'Renamed by Device A' })
            });

            expect(renameResponse.status).toBe(200);
            const renamedList = await renameResponse.json() as { id: string; name: string };
            expect(renamedList.name).toBe('Renamed by Device A');

            // Device B fetches the list
            const deviceBResponse = await worker.fetch('http://localhost/api/lists', {
                headers: deviceB.headers
            });

            const deviceBLists = await deviceBResponse.json() as Array<{ id: string; name: string }>;
            const listOnDeviceB = deviceBLists.find(l => l.id === listId);

            // Device B should see the renamed list
            expect(listOnDeviceB).toBeDefined();
            expect(listOnDeviceB!.name).toBe('Renamed by Device A');
        });

        it('should reflect multiple renames across devices', async () => {
            // Device A creates a list
            const createResponse = await worker.fetch('http://localhost/api/lists', {
                method: 'POST',
                headers: deviceA.headers,
                body: JSON.stringify({ name: 'Initial Name' })
            });

            const createdList = await createResponse.json() as { id: string; name: string };
            const listId = createdList.id;

            // Device A renames the list
            await worker.fetch(`http://localhost/api/lists/${listId}`, {
                method: 'PUT',
                headers: deviceA.headers,
                body: JSON.stringify({ name: 'First Rename' })
            });

            // Device B renames the list
            await worker.fetch(`http://localhost/api/lists/${listId}`, {
                method: 'PUT',
                headers: deviceB.headers,
                body: JSON.stringify({ name: 'Second Rename' })
            });

            // Device A fetches the list and should see Device B's rename
            const deviceAResponse = await worker.fetch('http://localhost/api/lists', {
                headers: deviceA.headers
            });

            const deviceALists = await deviceAResponse.json() as Array<{ id: string; name: string }>;
            const listOnDeviceA = deviceALists.find(l => l.id === listId);

            expect(listOnDeviceA).toBeDefined();
            expect(listOnDeviceA!.name).toBe('Second Rename');

            // Device B should also see the final name
            const deviceBResponse = await worker.fetch('http://localhost/api/lists', {
                headers: deviceB.headers
            });

            const deviceBLists = await deviceBResponse.json() as Array<{ id: string; name: string }>;
            const listOnDeviceB = deviceBLists.find(l => l.id === listId);

            expect(listOnDeviceB).toBeDefined();
            expect(listOnDeviceB!.name).toBe('Second Rename');
        });

        it('should handle concurrent operations from multiple devices', async () => {
            // Both devices create lists simultaneously
            const [responseA, responseB] = await Promise.all([
                worker.fetch('http://localhost/api/lists', {
                    method: 'POST',
                    headers: deviceA.headers,
                    body: JSON.stringify({ name: 'Concurrent List A' })
                }),
                worker.fetch('http://localhost/api/lists', {
                    method: 'POST',
                    headers: deviceB.headers,
                    body: JSON.stringify({ name: 'Concurrent List B' })
                })
            ]);

            expect(responseA.status).toBe(201);
            expect(responseB.status).toBe(201);

            const listA = await responseA.json() as { id: string; name: string };
            const listB = await responseB.json() as { id: string; name: string };

            // Verify both lists were created with unique IDs
            expect(listA.id).not.toBe(listB.id);

            // Both devices should see both lists
            const [deviceAListsResponse, deviceBListsResponse] = await Promise.all([
                worker.fetch('http://localhost/api/lists', { headers: deviceA.headers }),
                worker.fetch('http://localhost/api/lists', { headers: deviceB.headers })
            ]);

            const deviceALists = await deviceAListsResponse.json() as Array<{ id: string }>;
            const deviceBLists = await deviceBListsResponse.json() as Array<{ id: string }>;

            expect(deviceALists.length).toBe(2);
            expect(deviceBLists.length).toBe(2);
        });
    });

    describe('List Deletion Synchronization', () => {
        it('should allow Device B to see a list deleted by Device A', async () => {
            // Device A creates a list
            const createResponse = await worker.fetch('http://localhost/api/lists', {
                method: 'POST',
                headers: deviceA.headers,
                body: JSON.stringify({ name: 'List to Delete' })
            });

            const createdList = await createResponse.json() as { id: string; name: string };
            const listId = createdList.id;

            // Verify both devices see the list
            let deviceBResponse = await worker.fetch('http://localhost/api/lists', {
                headers: deviceB.headers
            });
            let deviceBLists = await deviceBResponse.json() as Array<{ id: string }>;
            expect(deviceBLists.length).toBe(1);

            // Device A deletes the list
            const deleteResponse = await worker.fetch(`http://localhost/api/lists/${listId}`, {
                method: 'DELETE',
                headers: deviceA.headers
            });

            expect(deleteResponse.status).toBe(200);

            // Device B should no longer see the list
            deviceBResponse = await worker.fetch('http://localhost/api/lists', {
                headers: deviceB.headers
            });
            deviceBLists = await deviceBResponse.json() as Array<{ id: string }>;
            expect(deviceBLists.length).toBe(0);
        });
    });
});
