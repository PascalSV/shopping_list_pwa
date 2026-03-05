import type { D1Database } from '@cloudflare/workers-types';

export type Env = {
    DB: D1Database;
    SHOPPING_LIST_TOKEN: string;
};

export type HonoContext = {
    Bindings: Env;
    Variables: {
        deviceId: string;
    };
};

export interface ShoppingList {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    created_by_device_id: string;
}

export interface ShoppingItem {
    id: string;
    list_id: string;
    name: string;
    remark: string | null;
    position: string | null;
    completed: boolean;
    created_at: string;
    updated_at: string;
    created_by_device_id: string;
    last_modified_by_device_id: string;
}

export interface ItemHistoryEntry {
    id: string;
    item_name: string;
    last_used_at: string;
}

export interface SyncMetadata {
    device_id: string;
    list_id: string;
    last_sync_at: string;
    list_version: number;
}

export interface SyncOperation {
    type: 'create' | 'update' | 'delete';
    itemId?: string;
    data?: Partial<ShoppingItem>;
    clientTimestamp: string;
}

export interface SyncRequest {
    deviceId: string;
    listId: string;
    operations: SyncOperation[];
    itemsSnapshot: ShoppingItem[];
}

export interface SyncResponse {
    items: ShoppingItem[];
    conflicts: Array<{
        itemId: string;
        serverVersion: ShoppingItem;
        clientVersion: ShoppingItem;
    }>;
    lastSyncAt: string;
}
