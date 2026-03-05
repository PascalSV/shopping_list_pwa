import { Hono } from 'hono';
import type { HonoContext } from '../types';

export const adminRoutes = new Hono<HonoContext>();

adminRoutes.get('/admin/lists/:listId/activity', async (c) => {
    try {
        const { listId } = c.req.param();

        // Admin endpoint returns item activity log with device tracking
        const result = await c.env.DB.prepare(
            'SELECT id, name, remark, position, created_by_device_id, last_modified_by_device_id, created_at, updated_at FROM items WHERE list_id = ? ORDER BY updated_at DESC'
        ).bind(listId).all();

        return c.json({
            items: result.results,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error fetching admin activity:', err);
        return c.json({ error: 'Failed to fetch activity' }, 500);
    }
});
