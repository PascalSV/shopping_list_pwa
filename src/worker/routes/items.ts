import { Hono } from 'hono';
import { html } from 'hono/html';
import type { HonoContext } from '../types';
import * as db from '../db';
import { ListItemRow } from '../views/components';

export const itemsRoutes = new Hono<HonoContext>();

itemsRoutes.get('/lists/:listId/items', async (c) => {
    try {
        const { listId } = c.req.param();
        const items = await db.getListItems(c.env.DB, listId);
        return c.json(items);
    } catch (err) {
        console.error('Error fetching items:', err);
        return c.json({ error: 'Failed to fetch items' }, 500);
    }
});

itemsRoutes.post('/lists/:listId/items', async (c) => {
    try {
        const { listId } = c.req.param();
        const deviceId = c.get('deviceId') as string;

        // Validate that the list exists
        const list = await db.getList(c.env.DB, listId);
        if (!list) {
            return c.json({ error: 'List not found' }, 404);
        }

        let name: string;
        let remark: string | undefined;
        let position: string | undefined;

        // Handle both JSON and form data
        const contentType = c.req.header('Content-Type') || '';
        if (contentType.includes('application/json')) {
            const data = await c.req.json<{ name: string; remark?: string; position?: string }>();
            name = data.name;
            remark = data.remark;
            position = data.position;
        } else {
            const formData = await c.req.formData();
            name = formData.get('name') as string;
            remark = (formData.get('remark') as string) || undefined;
            position = (formData.get('position') as string) || undefined;
        }

        if (!name) {
            return c.json({ error: 'Name is required' }, 400);
        }

        const item = await db.createItem(
            c.env.DB,
            listId,
            name,
            remark || null,
            position || null,
            deviceId
        );

        // If HTMX request, return HTML fragment
        if (c.req.header('HX-Request')) {
            return c.html(ListItemRow(item, listId));
        }

        return c.json(item, 201);
    } catch (err) {
        console.error('Error creating item:', err);
        return c.json({ error: 'Failed to create item' }, 500);
    }
});

itemsRoutes.patch('/lists/:listId/items/:itemId/toggle', async (c) => {
    try {
        const { itemId } = c.req.param();
        const deviceId = c.get('deviceId') as string;

        const item = await db.toggleItem(c.env.DB, itemId, deviceId);

        if (!item) {
            return c.json({ error: 'Item not found' }, 404);
        }

        const { listId } = c.req.param();
        // Return HTML fragment for HTMX
        return c.html(ListItemRow(item, listId));
    } catch (err) {
        console.error('Error toggling item:', err);
        return c.json({ error: 'Failed to toggle item' }, 500);
    }
});

itemsRoutes.patch('/lists/:listId/items/:itemId', async (c) => {
    try {
        const { itemId } = c.req.param();
        const deviceId = c.get('deviceId') as string;

        let name: string | undefined;
        let remark: string | undefined;
        let position: string | undefined;

        // Handle both JSON and form data
        const contentType = c.req.header('Content-Type') || '';
        if (contentType.includes('application/json')) {
            const data = await c.req.json<{ name?: string; remark?: string; position?: string }>();
            name = data.name;
            remark = data.remark;
            position = data.position;
        } else {
            const formData = await c.req.formData();
            name = (formData.get('name') as string) || undefined;
            remark = (formData.get('remark') as string) || undefined;
            position = (formData.get('position') as string) || undefined;
        }

        const item = await db.updateItem(
            c.env.DB,
            itemId,
            name,
            remark,
            position,
            deviceId
        );

        if (!item) {
            return c.json({ error: 'Item not found' }, 404);
        }

        // If HTMX request, return HTML fragment
        if (c.req.header('HX-Request')) {
            const { listId } = c.req.param();
            return c.html(ListItemRow(item, listId));
        }

        return c.json(item);
    } catch (err) {
        console.error('Error updating item:', err);
        return c.json({ error: 'Failed to update item' }, 500);
    }
});

itemsRoutes.delete('/lists/:listId/items/:itemId', async (c) => {
    try {
        const { itemId, listId } = c.req.param();
        await db.deleteItem(c.env.DB, itemId);

        // If HTMX request, return empty response (will remove the element)
        if (c.req.header('HX-Request')) {
            return c.text('');
        }

        return c.json({ success: true });
    } catch (err) {
        console.error('Error deleting item:', err);
        return c.json({ error: 'Failed to delete item' }, 500);
    }
});

