import { html } from 'hono/html';
import type { ShoppingItem, ShoppingList } from '../types';

export const ListItemRow = (item: ShoppingItem, listId: string) => html`
    <div class="item ${item.completed ? 'completed' : ''} ${item.remark ? '' : 'no-remark'}" data-item-id="${item.id}" data-list-id="${listId}" data-item-name="${item.name}">
        <div class="item-content">
            <span class="item-name">${item.name}</span>
            ${item.remark ? html`<span class="item-remark">${item.remark}</span>` : ''}
        </div>
    </div>
`;

export const ListView = (props: {
    listId: string;
    listName: string;
    items: ShoppingItem[];
}) => html`
    <div class="list-view">
        <div id="list-toolbar" class="list-toolbar">
            <button 
                class="btn btn-secondary list-back-btn"
                hx-get="/lists"
                hx-target="body"
                hx-swap="innerHTML"
            >
                My lists
            </button>
            <h2 id="current-list-title" class="list-title" data-list-id="${props.listId}">${props.listName}</h2>
        </div>

        ${props.items.length === 0 ? html`<div id="empty-message" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1rem; color: var(--text-secondary); text-align: center;">You have no more items to shop - well done!</div>` : ''}

        <div id="items-list" class="items-list">
            ${props.items.map(item => ListItemRow(item, props.listId))}
        </div>
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
                hx-swap="beforeend"
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
                    hx-swap="beforeend"
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
        <form 
            hx-post="/api/lists"
            hx-swap="none"
            hx-on::after-settle="if(event.detail.xhr.status === 201) { document.querySelector('.form-container')?.remove(); const list = JSON.parse(event.detail.xhr.responseText); window.location.href = '/list/' + list.id; }"
        >
            <h2>Create New List</h2>
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
        <form 
            hx-put="/api/lists/${props.listId}"
            hx-swap="none"
            hx-on::after-settle="if(event.detail.xhr.status === 200) { document.querySelector('.form-container')?.remove(); window.location.href = '/list/${props.listId}'; }"
        >
            <h2>Edit List</h2>
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
        <form 
            hx-patch="/api/lists/${props.listId}/items/${props.itemId}"
            hx-swap="none"
            hx-on::after-settle="if(event.detail.xhr.status === 200) { document.querySelector('.form-container')?.remove(); window.location.href = '/list/${props.listId}'; }"
        >
            <h2>Edit Item</h2>
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
                    Update
                </button>
                <button
                    type="button"
                    class="btn btn-danger"
                    hx-delete="/api/lists/${props.listId}/items/${props.itemId}"
                    hx-swap="none"
                    hx-confirm="Delete this item?"
                    hx-on::after-settle="if(event.detail.xhr.status === 200) { document.querySelector('.form-container')?.remove(); window.location.href = '/list/${props.listId}'; }"
                >
                    Delete
                </button>
            </div>
            <button
                type="button"
                class="btn btn-secondary"
                hx-get="/list/${props.listId}"
                hx-target="body"
                hx-swap="innerHTML"
                style="width: 100%; margin-top: 0.5rem;"
            >
                Cancel
            </button>
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


