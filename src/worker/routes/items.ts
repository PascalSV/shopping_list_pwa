import { Hono } from 'hono';
import type { HonoContext } from '../types';
import * as db from '../db';
import { resolveLocale, t } from '../i18n';
import { ListItemRow } from '../views/components';

export const itemsRoutes = new Hono<HonoContext>();

itemsRoutes.get('/lists/:listId/items', async (c) => {
    const locale = resolveLocale(c.req.header('Accept-Language'));
    try {
        const { listId } = c.req.param();
        const items = await db.getListItems(c.env.DB, listId);
        return c.json(items);
    } catch (err) {
        console.error('Error fetching items:', err);
        return c.json({ error: t(locale, 'Failed to fetch items', 'Eintraege konnten nicht geladen werden') }, 500);
    }
});

itemsRoutes.post('/lists/:listId/items', async (c) => {
    const locale = resolveLocale(c.req.header('Accept-Language'));
    try {
        const { listId } = c.req.param();
        const deviceId = c.get('deviceId') as string;

        // Validate that the list exists
        const list = await db.getList(c.env.DB, listId);
        if (!list) {
            return c.json({ error: t(locale, 'List not found', 'Liste nicht gefunden') }, 404);
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
            return c.json({ error: t(locale, 'Name is required', 'Name ist erforderlich') }, 400);
        }

        // Check if item with same name already exists in this list
        const existingItems = await db.getListItems(c.env.DB, listId);
        const nameLower = name.toLowerCase().trim();
        const duplicate = existingItems.find(item => item.name.toLowerCase().trim() === nameLower);

        if (duplicate) {
            return c.json({ error: t(locale, 'Item already exists in this list', 'Eintrag existiert bereits in dieser Liste') }, 409);
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
        return c.json({ error: t(locale, 'Failed to create item', 'Eintrag konnte nicht erstellt werden') }, 500);
    }
});

itemsRoutes.patch('/lists/:listId/items/:itemId/toggle', async (c) => {
    const locale = resolveLocale(c.req.header('Accept-Language'));
    try {
        const { itemId } = c.req.param();
        const deviceId = c.get('deviceId') as string;

        const item = await db.toggleItem(c.env.DB, itemId, deviceId);

        if (!item) {
            return c.json({ error: t(locale, 'Item not found', 'Eintrag nicht gefunden') }, 404);
        }

        const { listId } = c.req.param();
        // Return HTML fragment for HTMX
        return c.html(ListItemRow(item, listId));
    } catch (err) {
        console.error('Error toggling item:', err);
        return c.json({ error: t(locale, 'Failed to toggle item', 'Eintrag konnte nicht aktualisiert werden') }, 500);
    }
});

itemsRoutes.patch('/lists/:listId/items/:itemId', async (c) => {
    const locale = resolveLocale(c.req.header('Accept-Language'));
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
            return c.json({ error: t(locale, 'Item not found', 'Eintrag nicht gefunden') }, 404);
        }

        // If HTMX request, return HTML fragment
        if (c.req.header('HX-Request')) {
            const { listId } = c.req.param();
            return c.html(ListItemRow(item, listId));
        }

        return c.json(item);
    } catch (err) {
        console.error('Error updating item:', err);
        return c.json({ error: t(locale, 'Failed to update item', 'Eintrag konnte nicht aktualisiert werden') }, 500);
    }
});

itemsRoutes.delete('/lists/:listId/items/:itemId', async (c) => {
    const locale = resolveLocale(c.req.header('Accept-Language'));
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
        return c.json({ error: t(locale, 'Failed to delete item', 'Eintrag konnte nicht geloescht werden') }, 500);
    }
});

