import { Hono } from 'hono';
import type { HonoContext } from './types';
import { listsRoutes } from './routes/lists';
import { itemsRoutes } from './routes/items';
import { syncRoutes } from './routes/sync';
import { autocompleteRoutes } from './routes/autocomplete';
import { adminRoutes } from './routes/admin';
import * as db from './db';
import { Layout } from './views/layout';
import { ListView, CreateListForm, EditListForm, EditItemForm, ListsManagementView } from './views/components';

const app = new Hono<HonoContext>();

// Default auth token for web app
const DEFAULT_TOKEN = 'default_token';

// Authentication middleware - for both API and page routes
app.use('*', async (c, next) => {
    // Get token from Authorization header or use default
    const token = c.req.header('Authorization')?.replace('Bearer ', '') || DEFAULT_TOKEN;
    c.set('deviceId', token);
    await next();
});

// API Routes
app.route('/api', listsRoutes);
app.route('/api', itemsRoutes);
app.route('/api', syncRoutes);
app.route('/api', autocompleteRoutes);
app.route('/api', adminRoutes);

// Page Routes
app.get('/', async (c) => {
    // Redirect home to lists management page
    return c.redirect('/lists', 302);
});

app.get('/lists', async (c) => {
    try {
        const lists = await db.getAllLists(c.env.DB);
        return c.html(
            Layout({
                title: 'Your Lists',
                lists,
                children: ListsManagementView({
                    lists
                })
            })
        );
    } catch (err) {
        console.error('Error loading lists:', err);
        return c.text('Error loading page', 500);
    }
});

app.get('/list/create', async (c) => {
    try {
        const lists = await db.getAllLists(c.env.DB);
        return c.html(
            Layout({
                title: 'Create List',
                lists,
                children: CreateListForm()
            })
        );
    } catch (err) {
        console.error('Error loading create form:', err);
        return c.text('Error loading form', 500);
    }
});

app.get('/list/:listId', async (c) => {
    try {
        const listId = c.req.param('listId');
        const lists = await db.getAllLists(c.env.DB);
        const list = lists.find(l => l.id === listId);

        if (!list) {
            // If list doesn't exist, switch to first available list or home
            if (lists.length > 0) {
                return c.redirect(`/list/${lists[0].id}`, 302);
            }
            return c.redirect('/', 302);
        }

        const items = await db.getListItems(c.env.DB, listId);

        return c.html(
            Layout({
                title: list.name,
                lists,
                currentListId: listId,
                children: ListView({
                    listId,
                    listName: list.name,
                    items
                })
            })
        );
    } catch (err) {
        console.error('Error loading list:', err);
        return c.text('Error loading list', 500);
    }
});

app.get('/list/:listId/edit', async (c) => {
    try {
        const listId = c.req.param('listId');
        const lists = await db.getAllLists(c.env.DB);
        const list = lists.find(l => l.id === listId);

        if (!list) {
            // If list doesn't exist, switch to first available list or home
            if (lists.length > 0) {
                return c.redirect(`/list/${lists[0].id}`, 302);
            }
            return c.redirect('/', 302);
        }

        return c.html(
            Layout({
                title: 'Edit List',
                lists,
                currentListId: listId,
                children: EditListForm({
                    listId,
                    listName: list.name
                })
            })
        );
    } catch (err) {
        console.error('Error loading edit form:', err);
        return c.text('Error loading form', 500);
    }
});

app.get('/item/:itemId/edit', async (c) => {
    try {
        const itemId = c.req.param('itemId');
        const listId = c.req.query('listId');

        if (!listId) {
            return c.text('List ID required', 400);
        }

        const lists = await db.getAllLists(c.env.DB);
        const item = await db.getItem(c.env.DB, itemId);

        if (!item) {
            return c.text('Item not found', 404);
        }

        return c.html(
            Layout({
                title: 'Edit Item',
                lists,
                currentListId: listId,
                children: EditItemForm({
                    itemId,
                    listId,
                    name: item.name,
                    remark: item.remark
                })
            })
        );
    } catch (err) {
        console.error('Error loading item edit form:', err);
        return c.text('Error loading form', 500);
    }
});

// Static assets - serve from public directory
app.get('/*', async (c, next) => {
    // Try to serve static files if the request path matches
    // This will serve manifest.json, service-worker.js, etc.
    const path = c.req.path;

    // Only try static files for common static paths
    if (path.includes('.') || path.includes('manifest.json') || path.includes('service-worker.js')) {
        try {
            // If ASSETS is available, use it to serve static files
            if ('ASSETS' in c.env) {
                return c.env.ASSETS.fetch(c.req);
            }
        } catch (err) {
            // Fall through to next handler if static file not found
        }
    }

    return await next();
});

// 404
app.all('*', (c) => c.json({ error: 'Not Found' }, 404));

export default app;
