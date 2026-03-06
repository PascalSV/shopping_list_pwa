import { html } from 'hono/html';
import type { ShoppingItem, ShoppingList } from '../types';

export const LoginForm = (props: {
    error?: string;
}) => {
    let errorMessage = '';
    if (props.error === 'invalid') {
        errorMessage = 'Invalid username or password';
    } else if (props.error === 'missing') {
        errorMessage = 'Please enter both username and password';
    } else if (props.error === 'server') {
        errorMessage = 'Server error. Please try again.';
    }

    return html`
    <div style="max-width: 420px; margin: 4rem auto; padding: 0 1rem;">
        <div style="margin-bottom: 2rem; text-align: center;">
            <img src="/icons/icon-192.png" alt="Shopping List" style="width: 96px; height: 96px; margin: 0 auto 1.5rem; display: block; border-radius: 20px; box-shadow: 0 8px 24px rgba(10, 33, 63, 0.15);" />
            <h2 style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">Shopping List</h2>
            <p style="color: var(--text-secondary); font-size: 0.95rem;">Sign in to access your lists</p>
        </div>

        <div style="background: linear-gradient(145deg, rgba(255, 255, 255, 0.55) 0%, rgba(232, 243, 255, 0.45) 100%); padding: 2rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); border: 1px solid var(--border-strong); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);">
            <form method="post" action="/login">
                ${errorMessage ? html`<div style="margin-bottom: 0.9rem; padding: 0.65rem 0.8rem; border-radius: 0.65rem; background: rgba(255, 69, 58, 0.12); border: 1px solid rgba(255, 69, 58, 0.35); color: #8a1e1a; font-weight: 600; font-size: 0.92rem;">${errorMessage}</div>` : ''}

                <div class="form-group">
                    <label for="username">User</label>
                    <select id="username" name="username" required>
                        <option value="PascalSV">PascalSV</option>
                        <option value="ClaudiaSV">ClaudiaSV</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <div style="position: relative;">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            autocomplete="current-password"
                            placeholder="Enter your password"
                            style="padding-right: 2.5rem;"
                        />
                        <button
                            type="button"
                            id="togglePassword"
                            style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; padding: 0.5rem; display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 1.2rem; transition: all 0.3s ease; opacity: 0.8; hover:opacity: 1;"
                            tabindex="-1"
                        >
                            <svg id="eyeIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
                <script>
                    const openEyeSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
                    const closedEyeSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
                    let isPasswordVisible = false;
                    
                    document.getElementById('togglePassword').addEventListener('click', function(e) {
                        e.preventDefault();
                        const passwordInput = document.getElementById('password');
                        isPasswordVisible = !isPasswordVisible;
                        passwordInput.type = isPasswordVisible ? 'text' : 'password';
                        this.innerHTML = isPasswordVisible ? closedEyeSvg : openEyeSvg;
                    });
                </script>

                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    Sign In
                </button>
            </form>
        </div>
    </div>
`;
};

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
}) => {
    return html`
        <div class="lists-management">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">Your Lists</h2>
                <div style="display: flex; gap: 0.55rem; align-items: center;">
                    <a href="/logout" class="btn btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center;">
                        Logout
                    </a>
                </div>
            </div>

            ${props.lists.length === 0 ? html`
                <div class="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 80px; height: 80px; margin: 0 auto 1rem; opacity: 0.3;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <div style="margin-bottom: 2rem;">No lists yet. Create your first shopping list!</div>
                </div>
            ` : html`
                <div class="lists-grid" id="lists-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
                    ${props.lists.map(list => html`
                        <div class="list-card" data-list-id="${list.id}" style="background: linear-gradient(145deg, rgba(255, 255, 255, 0.55) 0%, rgba(232, 243, 255, 0.45) 100%); padding: 1.5rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-md); border: 1px solid var(--border-strong); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; position: relative;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                <h3 class="list-name" style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0; flex: 1; word-break: break-word; cursor: pointer;">${list.name}</h3>
                                <div style="display: flex; gap: 0.5rem; opacity: 0.7;">
                                    <button class="icon-btn-edit" style="background: transparent; border: none; cursor: pointer; padding: 0.5rem; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 1rem; transition: all 0.2s;" title="Edit list name">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button class="icon-btn-delete" style="background: transparent; border: none; cursor: pointer; padding: 0.5rem; display: flex; align-items: center; justify-content: center; color: var(--danger); font-size: 1rem; transition: all 0.2s;" title="Delete list">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div style="flex: 1;"></div>
                            <div style="padding-top: 0.75rem; color: var(--text-secondary); font-size: 0.875rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s; text-decoration: none;" onclick="window.location.href = '/list/${list.id}'">
                                Open list
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                        </div>
                    `)}
                </div>
            `}

            <div style="display: flex; justify-content: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                <button 
                    class="btn btn-primary"
                    hx-get="/list/create"
                    hx-target="body"
                    hx-swap="beforeend"
                    style="display: inline-flex; align-items: center; gap: 0.75rem;"
                >
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Create New List
                </button>
            </div>
        </div>

        <!-- Delete Confirmation Modal (styled like Create List dialog) -->
        <div id="deleteModal" class="form-container" style="display: none;">
            <form id="deleteModalForm">
                <h2>Delete List</h2>
                <p id="deleteMessage" style="color: var(--text-secondary); margin: 0 0 1.5rem 0; line-height: 1.5;"></p>
                <div class="form-actions">
                    <button id="confirmDeleteBtn" type="button" class="btn btn-danger">
                        Delete
                    </button>
                    <button id="cancelDeleteBtn" type="button" class="btn btn-secondary">
                        Cancel
                    </button>
                </div>
            </form>
        </div>

        <script>
            let pendingDeleteListId = null;
            const deleteModal = document.getElementById('deleteModal');
            const deleteMessage = document.getElementById('deleteMessage');
            const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
            const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

            cancelDeleteBtn.addEventListener('click', () => {
                deleteModal.style.display = 'none';
                pendingDeleteListId = null;
            });

            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    deleteModal.style.display = 'none';
                    pendingDeleteListId = null;
                }
            });

            confirmDeleteBtn.addEventListener('click', () => {
                if (pendingDeleteListId) {
                    fetch('/api/lists/' + pendingDeleteListId, { method: 'DELETE' })
                    .then(r => {
                        if (r.ok) {
                            const card = document.querySelector('[data-list-id="' + pendingDeleteListId + '"]');
                            card.remove();
                            deleteModal.style.display = 'none';
                            pendingDeleteListId = null;
                        } else {
                            alert('Failed to delete list');
                            deleteModal.style.display = 'none';
                            pendingDeleteListId = null;
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        alert('Error deleting list');
                        deleteModal.style.display = 'none';
                        pendingDeleteListId = null;
                    });
                }
            });

            document.addEventListener('click', function(e) {
                const editBtn = e.target.closest('.icon-btn-edit');
                const deleteBtn = e.target.closest('.icon-btn-delete');
                
                if (editBtn) {
                    e.stopPropagation();
                    const card = editBtn.closest('.list-card');
                    const nameEl = card.querySelector('.list-name');
                    const listId = card.dataset.listId;
                    const currentName = nameEl.textContent;
                    
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = currentName;
                    input.style.cssText = 'font-size: 1.25rem; font-weight: 700; color: var(--text-primary); border: 2px solid var(--primary); border-radius: 0.375rem; padding: 0.5rem; width: 100%;';
                    
                    nameEl.replaceWith(input);
                    input.focus();
                    input.select();
                    
                    function saveNewName() {
                        const newName = input.value.trim();
                        if (newName && newName !== currentName) {
                            fetch('/api/lists/' + listId, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ name: newName })
                            })
                            .then(r => {
                                if (r.ok) {
                                    nameEl.textContent = newName;
                                    input.replaceWith(nameEl);
                                } else {
                                    alert('Failed to update list name');
                                    input.replaceWith(nameEl);
                                }
                            })
                            .catch(err => {
                                console.error(err);
                                alert('Error updating list name');
                                input.replaceWith(nameEl);
                            });
                        } else {
                            input.replaceWith(nameEl);
                        }
                    }
                    
                    input.addEventListener('blur', saveNewName);
                    input.addEventListener('keydown', (ev) => {
                        if (ev.key === 'Enter') saveNewName();
                        if (ev.key === 'Escape') input.replaceWith(nameEl);
                    });
                }
                
                if (deleteBtn) {
                    e.stopPropagation();
                    const card = deleteBtn.closest('.list-card');
                    const listId = card.dataset.listId;
                    const listName = card.querySelector('.list-name').textContent;
                    
                    pendingDeleteListId = listId;
                    deleteMessage.textContent = 'Are you sure you want to delete "' + listName + '"? This action cannot be undone.';
                    deleteModal.style.display = 'flex';
                }
            });
        </script>
    `;
};

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


