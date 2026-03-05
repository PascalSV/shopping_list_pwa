import { html, HtmlEscapedString } from 'hono/html';
import type { ShoppingItem, ShoppingList } from '../types';

export const ListItemRow = (item: ShoppingItem, listId: string) => html`
    <div class="item ${item.completed ? 'completed' : ''}" data-item-id="${item.id}" data-list-id="${listId}" data-item-name="${item.name}">
        <div class="item-content">
            <span class="item-name">${item.name}</span>
            ${item.remark ? html`<span class="item-remark">${item.remark}</span>` : html`<span class="item-remark item-remark-empty"></span>`}
        </div>
    </div>
`;

export const ListView = (props: {
    listId: string;
    listName: string;
    items: ShoppingItem[];
}) => html`
    <div class="list-view">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem;">
            <button 
                class="btn btn-secondary"
                hx-get="/lists"
                hx-target="body"
                hx-swap="innerHTML"
                style="flex: 0 0 auto;"
            >
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 0.25rem;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Lists
            </button>
            <h2 id="current-list-title" data-list-id="${props.listId}" style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); flex: 1;">${props.listName}</h2>
        </div>

        <div class="empty-state" id="empty-state" style="${props.items.length === 0 ? '' : 'display: none;'}">
            <div>You have no more items to shop - well done!</div>
        </div>

        <div id="items-list" class="items-list">
            ${props.items.map(item => ListItemRow(item, props.listId))}
    </div>
`;

export const ListsManagementView = (props: {
    lists: ShoppingList[];
}) => html`
    <div class="lists-management">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">Your Lists</h2>
            <button 
                class="btn btn-primary"
                hx-get="/list/create"
                hx-target="body"
                hx-swap="innerHTML"
            >
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New List
            </button>
        </div>

        ${props.lists.length === 0 ? html`
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 80px; height: 80px; margin: 0 auto 1rem; opacity: 0.3;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div style="margin-bottom: 1rem;">No lists yet. Create your first shopping list!</div>
                <button 
                    class="btn btn-primary"
                    hx-get="/list/create"
                    hx-target="body"
                    hx-swap="innerHTML"
                >
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First List
                </button>
            </div>
        ` : html`
            <div class="lists-list" id="lists-list">
                ${props.lists.map(list => html`
                    <div
                        class="list-row"
                        data-list-id="${list.id}"
                        data-list-name="${list.name}"
                        role="button"
                        tabindex="0"
                        aria-label="Open list ${list.name}"
                    >
                        <div class="list-row-content">
                            <span class="list-row-name">${list.name}</span>
                        </div>
                        <span class="list-row-chevron" aria-hidden="true">›</span>
                    </div>
                `)}
            </div>
        `}
    </div>
`;

export const CreateListForm = () => html`
    <div class="form-container">
        <h2>📝 Create New List</h2>
        <form 
            hx-post="/api/lists"
            hx-swap="none"
            hx-on::after-settle="if(event.detail.xhr.status === 201) { const list = JSON.parse(event.detail.xhr.responseText); window.location.href = '/list/' + list.id; }"
        >
            <div class="form-group">
                <label for="listName">List Name</label>
                <input 
                    type="text" 
                    id="listName" 
                    name="name" 
                    required 
                    placeholder="e.g., Weekly Groceries"
                    autofocus
                />
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" style="flex: 1.5;">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Create List
                </button>
                <button type="button" class="btn btn-secondary" hx-get="/lists" hx-target="body" hx-swap="innerHTML">
                    Cancel
                </button>
            </div>
        </form>
    </div>
`;

export const EditListForm = (props: {
    listId: string;
    listName: string;
}) => html`
    <div class="form-container">
        <h2>✏️ Edit List</h2>
        <form 
            hx-put="/api/lists/${props.listId}"
            hx-swap="none"
            hx-on::after-settle="if(event.detail.xhr.status === 200) window.location.href = '/list/${props.listId}'"
        >
            <div class="form-group">
                <label for="listName">List Name</label>
                <input 
                    type="text" 
                    id="listName" 
                    name="name" 
                    required 
                    value="${props.listName}"
                    autofocus
                />
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Update
                </button>
                <button 
                    type="button" 
                    class="btn btn-danger"
                    hx-delete="/api/lists/${props.listId}"
                    hx-swap="none"
                    hx-confirm="Permanently delete this list? This cannot be undone."
                    hx-on::after-settle="window.location.href = '/lists'"
                >
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                </button>
            </div>
            <button 
                type="button" 
                class="btn btn-secondary"
                hx-get="/lists" 
                hx-target="body" 
                hx-swap="innerHTML"
                style="width: 100%; margin-top: 0.5rem;"
            >
                Cancel
            </button>
        </form>
    </div>
`;

export const EditItemForm = (props: {
    itemId: string;
    listId: string;
    name: string;
    remark: string | null;
}) => html`
    <div class="form-container">
        <h2>✏️ Edit Item</h2>
        <form 
            hx-patch="/api/lists/${props.listId}/items/${props.itemId}"
            hx-swap="none"
            hx-on::after-settle="if(event.detail.xhr.status === 200) window.location.href = '/list/${props.listId}'"
        >
            <div class="form-group">
                <label for="itemName">Item Name</label>
                <input 
                    type="text" 
                    id="itemName" 
                    name="name" 
                    required 
                    value="${props.name}"
                    autofocus
                />
            </div>
            <div class="form-group">
                <label for="itemRemark">Remark</label>
                <input 
                    type="text" 
                    id="itemRemark" 
                    name="remark" 
                    value="${props.remark || ''}"
                    placeholder="Optional note"
                />
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Update
                </button>
                <button 
                    type="button" 
                    class="btn btn-secondary"
                    hx-get="/list/${props.listId}" 
                    hx-target="body" 
                    hx-swap="innerHTML"
                >
                    Cancel
                </button>
            </div>
        </form>
    </div>
`;

export const SearchForm = (props: {
    listId: string;
}) => html`
    <form 
        class="search-form"
        hx-post="/api/lists/${props.listId}/items"
        hx-target="#items-list"
        hx-swap="beforeend"
        hx-on::after-request="if(event.detail.successful) { document.querySelector('#search-input').value = ''; document.querySelector('#suggestions-container').innerHTML = ''; }"
    >
        <input 
            id="search-input"
            type="text" 
            name="name" 
            placeholder="I need..." 
            required 
            autocomplete="off"
        />
        <button type="button" class="btn-icon-clear" onclick="const input = document.querySelector('#search-input'); input.value = ''; document.querySelector('#suggestions-container').innerHTML = ''; input.focus();" title="Clear">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </form>
    <div id="suggestions-container" class="suggestions-container"></div>
`;


