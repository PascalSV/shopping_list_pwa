import { Hono } from 'hono';
import { html } from 'hono/html';
import type { HonoContext } from '../types';
import * as db from '../db';

export const autocompleteRoutes = new Hono<HonoContext>();

autocompleteRoutes.get('/autocomplete', async (c) => {
    try {
        const q = c.req.query('q');

        if (!q || q.length < 1) {
            return c.html('');
        }

        const suggestions = await db.searchAutocomplete(c.env.DB, q);

        if (suggestions.length === 0) {
            return c.html('');
        }

        // Return HTML button elements for suggestions
        const buttons = suggestions.map(s =>
            `<button type="button" class="suggestion-btn" data-item-name="${s.item_name}">${s.item_name}</button>`
        ).join('');
        return c.html(buttons);
    } catch (err) {
        console.error('Error searching autocomplete:', err);
        return c.html('');
    }
});
