import { html } from 'hono/html';
import type { ShoppingItem } from '../types';
import type { Locale } from '../i18n';
import { t } from '../i18n';

export const LoginForm = (props: {
    error?: string;
    locale: Locale;
}) => {
    let errorMessage = '';
    if (props.error === 'invalid') {
        errorMessage = t(props.locale, 'Invalid username or password', 'Ungueltiger Benutzername oder Passwort');
    } else if (props.error === 'missing') {
        errorMessage = t(props.locale, 'Please enter both username and password', 'Bitte Benutzername und Passwort eingeben');
    } else if (props.error === 'server') {
        errorMessage = t(props.locale, 'Server error. Please try again.', 'Serverfehler. Bitte erneut versuchen.');
    }

    return html`
    <div style="max-width: 420px; margin: 4rem auto; padding: 0 1rem;">
        <div style="margin-bottom: 2rem; text-align: center;">
            <img src="/icons/icon-192.png" alt="${t(props.locale, 'Pascals Shopping List', 'Pascals Einkaufsliste')}" style="width: 96px; height: 96px; margin: 0 auto 1.5rem; display: block; border-radius: 20px; box-shadow: var(--shadow-lg);" />
            <h2 style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">${t(props.locale, 'Pascals Shopping List', 'Pascals Einkaufsliste')}</h2>
            <p style="color: var(--text-secondary); font-size: 0.95rem;">${t(props.locale, 'Sign in to access your lists', 'Anmelden, um deine Listen zu sehen')}</p>
        </div>

        <div style="background: var(--bg-primary); padding: 2rem; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); border: 1px solid var(--border);">
            <form method="post" action="/login">
                ${errorMessage ? html`<div style="margin-bottom: 0.9rem; padding: 0.65rem 0.8rem; border-radius: 0.65rem; background: #FFEBEE; border: 1px solid var(--error); color: #c62828; font-weight: 600; font-size: 0.92rem;">${errorMessage}</div>` : ''}

                <div class="form-group">
                    <label for="username">${t(props.locale, 'User', 'Benutzer')}</label>
                    <select id="username" name="username" required>
                        <option value="PascalSV">PascalSV</option>
                        <option value="ClaudiaSV">ClaudiaSV</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="password">${t(props.locale, 'Password', 'Passwort')}</label>
                    <div style="position: relative;">
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            autocomplete="current-password"
                            placeholder="${t(props.locale, 'Enter your password', 'Passwort eingeben')}"
                            style="padding-right: 2.5rem;"
                        />
                        <button
                            type="button"
                            id="togglePassword"
                            style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; padding: 0.5rem; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 1.2rem; transition: all 0.1s ease;"
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
                    ${t(props.locale, 'Sign In', 'Anmelden')}
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
    locale: Locale;
}) => html`
    <div class="list-view">
        <h2 id="scrolling-title" class="scrolling-list-title" data-list-id="${props.listId}">${props.listName}</h2>
        <span id="current-list-title" data-list-id="${props.listId}" style="display: none;">${props.listName}</span>

        ${props.items.length === 0 ? html`<div id="empty-message" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1rem; color: var(--text-secondary); text-align: center;">${t(props.locale, 'You have no more items to shop - well done!', 'Du hast keine Eintraege mehr auf der Liste - gut gemacht!')}</div>` : ''}

        <div id="items-list" class="items-list">
            ${props.items.map(item => ListItemRow(item, props.listId))}
        </div>
    </div>
`;

export const EmptyTabView = (props: {
    locale: Locale;
}) => html`
    <div class="list-view" style="display: flex; align-items: center; justify-content: center; min-height: 60vh;">
        <div class="empty-state" style="max-width: 420px; text-align: center;">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 72px; height: 72px; margin: 0 auto 1rem; opacity: 0.3;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <div style="font-size: 1.05rem; color: var(--text-secondary); margin-bottom: 0.55rem;">
                ${t(props.locale, 'Long press one of the first three tabs to name your list.', 'Halte einen der ersten drei Tabs gedrueckt, um deine Liste zu benennen.')}
            </div>
            <div style="font-size: 0.9rem; color: var(--text-tertiary);">
                ${t(props.locale, 'A tab can only be opened after a name is set.', 'Ein Tab kann erst geoeffnet werden, wenn ein Name vergeben wurde.')}
            </div>
        </div>
    </div>
`;

export const CreateListForm = (props: { locale: Locale }) => html`
    <div class="form-container">
        <form 
            hx-post="/api/lists"
            hx-swap="none"
            hx-on::after-settle="if(event.detail.xhr.status === 201) { document.querySelector('.form-container')?.remove(); const list = JSON.parse(event.detail.xhr.responseText); window.location.href = '/list/' + list.id; }"
        >
            <h2>${t(props.locale, 'Create New List', 'Neue Liste erstellen')}</h2>
            <div class="form-group">
                <label for="listName">${t(props.locale, 'List Name', 'Listenname')}</label>
                <input 
                    type="text" 
                    id="listName" 
                    name="name" 
                    required 
                    placeholder="${t(props.locale, 'e.g., Weekly Groceries', 'z. B. Wocheneinkauf')}"
                    autofocus
                />
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" style="flex: 1.5;">
                    ${t(props.locale, 'Create List', 'Liste erstellen')}
                </button>
                <button type="button" class="btn btn-secondary" hx-get="/" hx-target="body" hx-swap="innerHTML">
                    ${t(props.locale, 'Cancel', 'Abbrechen')}
                </button>
            </div>
        </form>
    </div>
`;

export const EditListForm = (props: {
    listId: string;
    listName: string;
    locale: Locale;
}) => html`
    <div class="form-container">
        <form 
            hx-put="/api/lists/${props.listId}"
            hx-swap="none"
            hx-on::after-settle="if(event.detail.xhr.status === 200) { document.querySelector('.form-container')?.remove(); window.location.href = '/list/${props.listId}'; }"
        >
            <h2>${t(props.locale, 'Edit List', 'Liste bearbeiten')}</h2>
            <div class="form-group">
                <label for="listName">${t(props.locale, 'List Name', 'Listenname')}</label>
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
                    ${t(props.locale, 'Update', 'Aktualisieren')}
                </button>
                <button 
                    type="button" 
                    class="btn btn-danger"
                    hx-delete="/api/lists/${props.listId}"
                    hx-swap="none"
                    hx-confirm="${t(props.locale, 'Permanently delete this list? This cannot be undone.', 'Diese Liste endgültig löschen? Das kann nicht rückgängig gemacht werden.')}"
                    hx-on::after-settle="window.location.href = '/'"
                >
                    ${t(props.locale, 'Delete', 'Loeschen')}
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
                ${t(props.locale, 'Cancel', 'Abbrechen')}
            </button>
        </form>
    </div>
`;

export const EditItemForm = (props: {
    itemId: string;
    listId: string;
    name: string;
    remark: string | null;
    locale: Locale;
}) => html`
    <div class="form-container">
        <form 
            hx-patch="/api/lists/${props.listId}/items/${props.itemId}"
            hx-swap="none"
            hx-on::after-settle="if(event.detail.xhr.status === 200) { document.querySelector('.form-container')?.remove(); window.location.href = '/list/${props.listId}'; }"
        >
            <h2>${t(props.locale, 'Edit Item', 'Eintrag bearbeiten')}</h2>
            <div class="form-group">
                <label for="itemName">${t(props.locale, 'Item Name', 'Eintragsname')}</label>
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
                <label for="itemRemark">${t(props.locale, 'Remark', 'Bemerkung')}</label>
                <input 
                    type="text" 
                    id="itemRemark" 
                    name="remark" 
                    value="${props.remark || ''}"
                    placeholder="${t(props.locale, 'Optional note', 'Optionale Notiz')}"
                />
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                    ${t(props.locale, 'Update', 'Aktualisieren')}
                </button>
                <button
                    type="button"
                    class="btn btn-danger"
                    hx-delete="/api/lists/${props.listId}/items/${props.itemId}"
                    hx-swap="none"
                    hx-on::after-settle="if(event.detail.xhr.status === 200) { document.querySelector('.form-container')?.remove(); window.location.href = '/list/${props.listId}'; }"
                >
                    ${t(props.locale, 'Delete', 'Löschen')}
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
                ${t(props.locale, 'Cancel', 'Abbrechen')}
            </button>
        </form>
    </div>
`;

export const SearchForm = (props: {
    listId: string;
    locale: Locale;
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
            placeholder="${t(props.locale, 'I need...', 'Ich brauche...')}" 
            required 
            autocomplete="off"
        />
        <button type="button" class="btn-icon-clear" onclick="const input = document.querySelector('#search-input'); input.value = ''; document.querySelector('#suggestions-container').innerHTML = ''; input.focus();" title="${t(props.locale, 'Clear', 'Leeren')}">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </form>
    <div id="suggestions-container" class="suggestions-container"></div>
`;


