import type { D1Database } from '@cloudflare/workers-types';
import { ShoppingList, ShoppingItem, ItemHistoryEntry, SyncMetadata } from './types';
import { v4 as uuidv4 } from 'uuid';

export async function getList(db: D1Database, listId: string): Promise<ShoppingList | null> {
    const result = await db.prepare('SELECT * FROM lists WHERE id = ?').bind(listId).first();
    return result as ShoppingList | null;
}

export async function getAllLists(db: D1Database): Promise<ShoppingList[]> {
    const result = await db.prepare('SELECT * FROM lists ORDER BY updated_at DESC').all();
    return (result.results || []) as unknown as ShoppingList[];
}

export async function createList(db: D1Database, name: string, deviceId: string): Promise<ShoppingList> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(
        'INSERT INTO lists (id, name, created_at, updated_at, created_by_device_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, name, now, now, deviceId).run();

    return {
        id,
        name,
        created_at: now,
        updated_at: now,
        created_by_device_id: deviceId
    };
}

export async function updateList(db: D1Database, listId: string, name: string): Promise<ShoppingList | null> {
    const now = new Date().toISOString();

    await db.prepare(
        'UPDATE lists SET name = ?, updated_at = ? WHERE id = ?'
    ).bind(name, now, listId).run();

    return getList(db, listId);
}

export async function deleteList(db: D1Database, listId: string): Promise<void> {
    await db.prepare('DELETE FROM lists WHERE id = ?').bind(listId).run();
}

export async function getListItems(db: D1Database, listId: string): Promise<ShoppingItem[]> {
    const result = await db.prepare(
        'SELECT * FROM items WHERE list_id = ? AND completed = 0 ORDER BY position, name'
    ).bind(listId).all();

    return (result.results as any[]).map(item => ({
        ...item,
        completed: Boolean(item.completed)
    })) as ShoppingItem[];
}

export async function getItem(db: D1Database, itemId: string): Promise<ShoppingItem | null> {
    const result = await db.prepare('SELECT * FROM items WHERE id = ?').bind(itemId).first();
    if (!result) return null;

    return {
        ...result as any,
        completed: Boolean((result as any).completed)
    } as ShoppingItem;
}

export async function createItem(
    db: D1Database,
    listId: string,
    name: string,
    remark: string | null,
    position: string | null,
    deviceId: string
): Promise<ShoppingItem> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.prepare(
        'INSERT INTO items (id, list_id, name, remark, position, completed, created_at, updated_at, created_by_device_id, last_modified_by_device_id) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)'
    ).bind(id, listId, name, remark, position, now, now, deviceId, deviceId).run();

    // Upsert into items_history for autocomplete
    await db.prepare(
        'INSERT INTO items_history (id, item_name, last_used_at) VALUES (?, ?, ?) ON CONFLICT(item_name) DO UPDATE SET last_used_at = ?'
    ).bind(uuidv4(), name, now, now).run();

    return {
        id,
        list_id: listId,
        name,
        remark,
        position,
        completed: false,
        created_at: now,
        updated_at: now,
        created_by_device_id: deviceId,
        last_modified_by_device_id: deviceId
    };
}

export async function updateItem(
    db: D1Database,
    itemId: string,
    name?: string,
    remark?: string | null,
    position?: string | null,
    deviceId?: string
): Promise<ShoppingItem | null> {
    const item = await getItem(db, itemId);
    if (!item) return null;

    const now = new Date().toISOString();
    const updates = {
        name: name ?? item.name,
        remark: remark !== undefined ? remark : item.remark,
        position: position !== undefined ? position : item.position,
        updated_at: now,
        last_modified_by_device_id: deviceId ?? item.last_modified_by_device_id
    };

    await db.prepare(
        'UPDATE items SET name = ?, remark = ?, position = ?, updated_at = ?, last_modified_by_device_id = ? WHERE id = ?'
    ).bind(updates.name, updates.remark, updates.position, updates.updated_at, updates.last_modified_by_device_id, itemId).run();

    return getItem(db, itemId);
}

export async function toggleItem(db: D1Database, itemId: string, deviceId: string): Promise<ShoppingItem | null> {
    const item = await getItem(db, itemId);
    if (!item) return null;

    const now = new Date().toISOString();
    const newCompleted = !item.completed;

    await db.prepare(
        'UPDATE items SET completed = ?, updated_at = ?, last_modified_by_device_id = ? WHERE id = ?'
    ).bind(newCompleted ? 1 : 0, now, deviceId, itemId).run();

    return getItem(db, itemId);
}

export async function deleteItem(db: D1Database, itemId: string): Promise<void> {
    await db.prepare('DELETE FROM items WHERE id = ?').bind(itemId).run();
}

export async function searchAutocomplete(db: D1Database, query: string, limit: number = 10): Promise<ItemHistoryEntry[]> {
    const result = await db.prepare(
        'SELECT * FROM items_history WHERE item_name LIKE ? ORDER BY last_used_at DESC LIMIT ?'
    ).bind(`%${query}%`, limit).all();

    return (result.results || []) as unknown as ItemHistoryEntry[];
}

export async function getSyncMetadata(db: D1Database, deviceId: string, listId: string): Promise<SyncMetadata | null> {
    const result = await db.prepare(
        'SELECT * FROM sync_metadata WHERE device_id = ? AND list_id = ?'
    ).bind(deviceId, listId).first();

    return result as SyncMetadata | null;
}

export async function updateSyncMetadata(
    db: D1Database,
    deviceId: string,
    listId: string
): Promise<void> {
    const now = new Date().toISOString();

    await db.prepare(
        'INSERT INTO sync_metadata (device_id, list_id, last_sync_at, list_version) VALUES (?, ?, ?, 0) ON CONFLICT(device_id, list_id) DO UPDATE SET last_sync_at = ?, list_version = list_version + 1'
    ).bind(deviceId, listId, now, now).run();
}
