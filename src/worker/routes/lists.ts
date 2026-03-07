import { Hono } from 'hono';
import type { HonoContext } from '../types';
import * as db from '../db';
import { resolveLocale, t } from '../i18n';

export const listsRoutes = new Hono<HonoContext>();

listsRoutes.get('/lists', async (c) => {
    const locale = resolveLocale(c.req.header('Accept-Language'));
    try {
        const lists = await db.getAllLists(c.env.DB);
        return c.json(lists);
    } catch (err) {
        console.error('Error fetching lists:', err);
        return c.json({ error: t(locale, 'Failed to fetch lists', 'Listen konnten nicht geladen werden') }, 500);
    }
});

listsRoutes.post('/lists', async (c) => {
    const locale = resolveLocale(c.req.header('Accept-Language'));
    try {
        const deviceId = c.get('deviceId') as string;

        let name: string;

        // Handle both JSON and form data
        const contentType = c.req.header('Content-Type') || '';
        if (contentType.includes('application/json')) {
            const data = await c.req.json<{ name: string }>();
            name = data.name;
        } else {
            const formData = await c.req.formData();
            name = formData.get('name') as string;
        }

        if (!name) {
            return c.json({ error: t(locale, 'Name is required', 'Name ist erforderlich') }, 400);
        }

        const list = await db.createList(c.env.DB, name, deviceId);
        return c.json(list, 201);
    } catch (err) {
        console.error('Error creating list:', err);
        return c.json({ error: t(locale, 'Failed to create list', 'Liste konnte nicht erstellt werden') }, 500);
    }
});

listsRoutes.put('/lists/:listId', async (c) => {
    const locale = resolveLocale(c.req.header('Accept-Language'));
    try {
        const { listId } = c.req.param();

        let name: string;

        // Handle both JSON and form data
        const contentType = c.req.header('Content-Type') || '';
        if (contentType.includes('application/json')) {
            const data = await c.req.json<{ name: string }>();
            name = data.name;
        } else {
            const formData = await c.req.formData();
            name = formData.get('name') as string;
        }

        if (!name) {
            return c.json({ error: t(locale, 'Name is required', 'Name ist erforderlich') }, 400);
        }

        const list = await db.updateList(c.env.DB, listId, name);
        if (!list) {
            return c.json({ error: t(locale, 'List not found', 'Liste nicht gefunden') }, 404);
        }

        return c.json(list);
    } catch (err) {
        console.error('Error updating list:', err);
        return c.json({ error: t(locale, 'Failed to update list', 'Liste konnte nicht aktualisiert werden') }, 500);
    }
});

listsRoutes.delete('/lists/:listId', async (c) => {
    const locale = resolveLocale(c.req.header('Accept-Language'));
    try {
        const { listId } = c.req.param();
        await db.deleteList(c.env.DB, listId);
        return c.json({ success: true });
    } catch (err) {
        console.error('Error deleting list:', err);
        return c.json({ error: t(locale, 'Failed to delete list', 'Liste konnte nicht geloescht werden') }, 500);
    }
});
