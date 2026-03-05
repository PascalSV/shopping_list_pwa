import { Hono } from 'hono';
import type { HonoContext, SyncRequest, SyncResponse, ShoppingItem } from '../types';
import * as db from '../db';

export const syncRoutes = new Hono<HonoContext>();

syncRoutes.post('/sync', async (c) => {
    try {
        const deviceId = c.get('deviceId') as string;
        const { listId, operations } = await c.req.json<SyncRequest>();

        if (!listId) {
            return c.json({ error: 'listId is required' }, 400);
        }

        // Get current server state
        const serverItems = await db.getListItems(c.env.DB, listId);
        const conflicts: SyncResponse['conflicts'] = [];

        // Process each operation with last-write-wins strategy
        for (const operation of operations) {
            try {
                const clientTimestamp = new Date(operation.clientTimestamp);

                switch (operation.type) {
                    case 'create':
                        if (operation.data && operation.data.name) {
                            await db.createItem(
                                c.env.DB,
                                listId,
                                operation.data.name,
                                operation.data.remark || null,
                                operation.data.position || null,
                                deviceId
                            );
                        }
                        break;

                    case 'update':
                        if (operation.itemId && operation.data) {
                            const serverItem = serverItems.find(item => item.id === operation.itemId);

                            if (serverItem) {
                                const serverTimestamp = new Date(serverItem.updated_at);

                                // Last-write-wins: client timestamp > server timestamp
                                if (clientTimestamp > serverTimestamp) {
                                    await db.updateItem(
                                        c.env.DB,
                                        operation.itemId,
                                        operation.data.name,
                                        operation.data.remark,
                                        operation.data.position,
                                        deviceId
                                    );
                                } else {
                                    // Record conflict
                                    const clientVersion = operation.data;
                                    conflicts.push({
                                        itemId: operation.itemId,
                                        serverVersion: serverItem,
                                        clientVersion: clientVersion as ShoppingItem
                                    });
                                }
                            }
                        }
                        break;

                    case 'delete':
                        if (operation.itemId) {
                            await db.deleteItem(c.env.DB, operation.itemId);
                        }
                        break;
                }
            } catch (err) {
                console.error('Error processing operation:', err);
            }
        }

        // Update sync metadata
        await db.updateSyncMetadata(c.env.DB, deviceId, listId);

        // Get updated items
        const updatedItems = await db.getListItems(c.env.DB, listId);

        const response: SyncResponse = {
            items: updatedItems,
            conflicts,
            lastSyncAt: new Date().toISOString()
        };

        return c.json(response);
    } catch (err) {
        console.error('Error during sync:', err);
        return c.json({ error: 'Sync failed' }, 500);
    }
});
