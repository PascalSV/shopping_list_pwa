import { HtmlEscapedString, html } from 'hono/html';
import type { ShoppingList, ShoppingItem } from '../types';
import { SearchForm } from './components';

export const Layout = (props: {
    title: string;
    lists: ShoppingList[];
    currentListId?: string;
    children: HtmlEscapedString;
}) => html`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#10b981" />
    <meta name="description" content="Offline-first shopping list PWA" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>${props.title}</title>
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
    <link rel="stylesheet" href="/fonts/fonts.css" />
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <style>
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --primary-light: #818cf8;
            --secondary: #8b5cf6;
            --danger: #ef4444;
            --warning: #f59e0b;
            --success: #10b981;
            --bg-primary: #ffffff;
            --bg-secondary: #fafbfc;
            --bg-tertiary: #f3f4f6;
            --text-primary: #0f172a;
            --text-secondary: #475569;
            --text-tertiary: #94a3b8;
            --border: #e2e8f0;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            --radius-sm: 0.375rem;
            --radius-md: 0.5rem;
            --radius-lg: 0.75rem;
            --radius-xl: 1rem;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%);
            color: var(--text-primary);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .container {
            max-width: 680px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: var(--bg-secondary);
            box-shadow: var(--shadow-xl);
        }

        /* Header Styles */
        .header {
            background: transparent;
            color: var(--text-primary);
            padding: 1.25rem 1.5rem;
            box-shadow: none;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header h1 {
            font-size: 1.75rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            letter-spacing: -0.025em;
            color: var(--text-primary);
        }

        .logo {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            border-radius: var(--radius-lg);
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            color: white;
        }

        .btn {
            padding: 0.45rem 0.85rem;
            border: none;
            border-radius: var(--radius-lg);
            cursor: pointer;
            font-weight: 600;
            font-size: 0.85rem;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            justify-content: center;
            white-space: nowrap;
            line-height: 1;
            min-height: 34px;
        }

        .btn-primary {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.82) 0%, rgba(139, 92, 246, 0.82) 100%);
            color: white;
            box-shadow: var(--shadow-sm);
        }

        .btn-primary:hover {
            background: linear-gradient(135deg, rgba(79, 70, 229, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }

        .btn-primary:active {
            transform: translateY(0);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.7);
            color: var(--text-primary);
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.9);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }

        .btn-danger {
            background: rgba(239, 68, 68, 0.82);
            color: white;
            box-shadow: var(--shadow-sm);
        }

        .btn-danger:hover {
            background: rgba(220, 38, 38, 0.9);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }

        .btn-icon {
            padding: 0.65rem;
            width: 42px;
            height: 42px;
            border-radius: var(--radius-lg);
        }

        .btn-icon svg {
            width: 20px;
            height: 20px;
        }

        /* Content Styles */
        .content {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
            padding-bottom: 140px;
            background: var(--bg-secondary);
        }

        /* Footer Styles */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            max-width: 680px;
            margin: 0 auto;
            width: 100%;
            padding: 1rem;
            background: var(--bg-primary);
            border-top: 1px solid var(--border);
            box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06);
            z-index: 50;
        }

        /* Items List */
        .items-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .item {
            display: flex;
            gap: 1rem;
            padding: 1.25rem;
            background: var(--bg-primary);
            border-radius: var(--radius-xl);
            align-items: flex-start;
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border);
            transition: all 0.2s ease;
            position: relative;
            cursor: pointer;
        }

        .item-content {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            width: 100%;
        }

        .item:hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
            border-color: var(--primary);
        }

        .item.completed {
            background: var(--bg-tertiary);
            opacity: 0.8;
        }

        .item-name {
            flex: 1;
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .item-remark {
            font-size: 0.875rem;
            color: var(--text-secondary);
            display: block;
            min-height: 1.25rem;
        }

        .item-remark-empty {
            visibility: hidden;
        }

        /* Forms */
        .add-item-form {
            display: flex;
            gap: 0.75rem;
            background: var(--bg-primary);
            padding: 1.25rem;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border);
            flex-wrap: wrap;
            flex: none;
        }

        .add-item-form input {
            flex: 1;
            min-width: 200px;
            padding: 0.875rem 1.125rem;
            border: 2px solid var(--border);
            border-radius: var(--radius-lg);
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.2s ease;
            background: var(--bg-secondary);
            color: var(--text-primary);
        }

        .add-item-form input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            background: white;
        }

        .add-item-form input::placeholder {
            color: var(--text-tertiary);
        }

        .add-item-form .btn {
            flex: 0;
            min-width: auto;
        }

        /* Search Form in Footer */

        .search-form {
            display: flex;
            gap: 0.5rem;
            background: transparent;
            padding: 0;
            border: none;
            box-shadow: none;
            border-radius: 0;
        }

        .search-form input {
            flex: 1;
            min-width: 0;
            padding: 0.75rem 1rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.2s ease;
            background: var(--bg-primary);
            color: var(--text-primary);
        }

        .search-form input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .search-form input::placeholder {
            color: var(--text-tertiary);
        }

        .suggestions-container {
            position: absolute;
            bottom: calc(100% + 0.35rem);
            left: 1rem;
            right: 1rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 0;
            background: transparent;
            border: none;
            box-shadow: none;
            max-height: 200px;
            overflow-y: auto;
            z-index: 60;
        }

        .suggestions-container:empty {
            display: none;
        }

        .suggestion-btn {
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
            color: white;
            border: none;
            border-radius: var(--radius-lg);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        .suggestion-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        .suggestion-btn:active {
            transform: translateY(0);
        }

        .btn-icon-clear {
            padding: 0.75rem;
            width: 42px;
            height: 42px;
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            background: var(--bg-primary);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
        }

        .btn-icon-clear:hover {
            border-color: var(--primary);
            color: var(--primary);
            transform: translateY(-1px);
            box-shadow: var(--shadow-sm);
        }

        .btn-icon-clear svg {
            width: 20px;
            height: 20px;
            stroke-width: 2;
        }

        /* Notification */
        .notification {
            position: fixed;
            top: 1.5rem;
            right: 1.5rem;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-lg);
            color: white;
            max-width: 360px;
            box-shadow: var(--shadow-xl);
            animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            z-index: 1000;
        }

        .notification.success {
            background: linear-gradient(135deg, var(--success) 0%, var(--primary-dark) 100%);
        }

        .notification.error {
            background: linear-gradient(135deg, var(--danger) 0%, #dc2626 100%);
        }

        .notification.info {
            background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
        }

        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-tertiary);
            font-size: 1.125rem;
        }

        .empty-state svg {
            width: 120px;
            height: 120px;
            margin-bottom: 1.5rem;
            opacity: 0.5;
        }

        /* Offline Badge */
        .offline-badge {
            position: fixed;
            top: 1rem;
            left: 50%;
            transform: translateX(-50%);
            background: var(--warning);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: var(--radius-md);
            font-size: 0.875rem;
            font-weight: 600;
            box-shadow: var(--shadow-md);
            z-index: 999;
            display: none;
            align-items: center;
            gap: 0.5rem;
        }

        .offline-badge.visible {
            display: flex;
            animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideDown {
            from {
                transform: translateX(-50%) translateY(-100px);
                opacity: 0;
            }
            to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }

        .item.optimistic-delete {
            opacity: 0.3;
            pointer-events: none;
        }

        /* HTMX Transitions */
        .htmx-swapping {
            opacity: 0;
            transition: opacity 0.2s ease-out;
        }

        .htmx-settling {
            opacity: 1;
            transition: opacity 0.2s ease-out;
        }

        .htmx-added {
            animation: fadeInUp 0.3s ease-out;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .loading {
            opacity: 0.5;
            pointer-events: none;
        }

        /* SVG Icons */
        .icon {
            width: 20px;
            height: 20px;
            stroke-width: 2;
        }

        /* Responsive */
        @media (max-width: 640px) {
            .container {
                box-shadow: none;
            }

            .header {
                padding: 1rem;
            }

            .header h1 {
                font-size: 1.5rem;
            }

            .content {
                padding: 1rem;
            }

            .search-form {
                gap: 0.25rem;
            }

            .search-form input {
                min-width: 0;
            }
        }

        /* Form Pages */
        .form-container {
            max-width: 480px;
            margin: 2rem auto;
            background: var(--bg-primary);
            padding: 2rem;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-xl);
            border: 1px solid var(--border);
        }

        .form-container h2 {
            margin-bottom: 1.5rem;
            color: var(--text-primary);
            font-size: 1.75rem;
            font-weight: 700;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-secondary);
            font-weight: 500;
            font-size: 0.95rem;
        }

        .form-group input {
            width: 100%;
            padding: 0.875rem 1.125rem;
            border: 2px solid var(--border);
            border-radius: var(--radius-lg);
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.2s ease;
            background: var(--bg-secondary);
        }

        .form-group input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            background: white;
        }

        .form-actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 2rem;
        }

        .form-actions button {
            flex: 1;
        }

        /* Lists Management Page */
        .lists-management {
            max-width: 960px;
            margin: 0 auto;
        }

        .lists-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1rem;
        }

        .list-row {
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: var(--radius-xl);
            padding: 1rem 1.1rem;
            box-shadow: var(--shadow-sm);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            user-select: none;
        }

        .list-row:hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
            border-color: var(--primary);
        }

        .list-row-content {
            display: flex;
            flex-direction: column;
            min-width: 0;
        }

        .list-row-name {
            font-size: 1.05rem;
            font-weight: 600;
            color: var(--text-primary);
            word-break: break-word;
        }

        .list-row-chevron {
            color: var(--text-tertiary);
            font-size: 1.35rem;
            line-height: 1;
            margin-left: 0.75rem;
        }

        .btn-sm {
            padding: 0.35rem 0.65rem;
            font-size: 0.78rem;
            flex: 1;
            min-width: fit-content;
            min-height: 30px;
        }

        .btn-sm .icon {
            width: 16px;
            height: 16px;
        }
    </style>
</head>
<body>
    <div id="offline-badge" class="offline-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
        <span>Offline Mode</span>
    </div>
    <div class="container">
        <div class="header">
            <h1>
                <span class="logo">
                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px;">
                        <path d="M6 12 L10 24 L22 24 L26 12 Z" fill="white" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
                        <path d="M4 10 L6 12 L26 12" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                        <circle cx="11" cy="27" r="2" fill="white"/>
                        <circle cx="21" cy="27" r="2" fill="white"/>
                    </svg>
                </span>
                ShopList
            </h1>
        </div>

        <div class="content" id="content">
            ${props.children}
        </div>

        <div class="footer">
            ${props.currentListId ? SearchForm({ listId: props.currentListId }) : ''}
        </div>
    </div>

    <script>
        // === Offline Queue System ===
        const OFFLINE_QUEUE_KEY = 'shopping-list-offline-queue';
        let isOnline = navigator.onLine;

        // Get queued operations from localStorage
        const getOfflineQueue = () => {
            try {
                const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
                return queue ? JSON.parse(queue) : [];
            } catch (err) {
                console.error('Failed to read offline queue:', err);
                return [];
            }
        };

        // Save queued operations to localStorage
        const saveOfflineQueue = (queue) => {
            try {
                localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
            } catch (err) {
                console.error('Failed to save offline queue:', err);
            }
        };

        // Add operation to offline queue
        const queueOfflineOperation = (operation) => {
            const queue = getOfflineQueue();
            queue.push({
                ...operation,
                timestamp: Date.now()
            });
            saveOfflineQueue(queue);
        };

        // Update offline badge visibility
        const updateOfflineStatus = () => {
            const offlineBadge = document.getElementById('offline-badge');
            if (!offlineBadge) {
                return;
            }

            if (isOnline) {
                offlineBadge.classList.remove('visible');
            } else {
                offlineBadge.classList.add('visible');
            }
        };

        // Process offline queue when back online
        const processOfflineQueue = async () => {
            if (!isOnline) {
                return;
            }

            const queue = getOfflineQueue();
            if (queue.length === 0) {
                return;
            }

            console.log('Processing offline queue:', queue.length, 'operations');

            const failedOperations = [];

            for (const operation of queue) {
                try {
                    const requestOptions = {
                        method: operation.method,
                        headers: operation.headers || { 'Content-Type': 'application/json' }
                    };

                    // Add body for POST/PUT/PATCH requests
                    if (operation.body && (operation.method === 'POST' || operation.method === 'PUT' || operation.method === 'PATCH')) {
                        // If body is object, convert to FormData format (HTMX style)
                        if (typeof operation.body === 'object') {
                            const formData = new URLSearchParams();
                            for (const key in operation.body) {
                                formData.append(key, operation.body[key]);
                            }
                            requestOptions.body = formData.toString();
                            requestOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                        } else {
                            requestOptions.body = operation.body;
                        }
                    }

                    const response = await fetch(operation.url, requestOptions);

                    if (!response.ok) {
                        console.error('Failed to process queued operation:', operation);
                        failedOperations.push(operation);
                    } else {
                        console.log('Successfully processed queued operation:', operation.method, operation.url);
                        
                        // Clean up local storage for this operation
                        if (operation.url.includes('/lists/')) {
                            localStorage.removeItem('offline-list-update-' + operation.url);
                        }
                    }
                } catch (err) {
                    console.error('Error processing queued operation:', err);
                    failedOperations.push(operation);
                }
            }

            // Save only failed operations back to queue
            saveOfflineQueue(failedOperations);

            // Reload the page to show updated data
            if (failedOperations.length < queue.length) {
                showNotification('Offline changes synced successfully', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        };

        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('Connection restored - processing offline queue');
            isOnline = true;
            updateOfflineStatus();
            processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            console.log('Connection lost - entering offline mode');
            isOnline = false;
            updateOfflineStatus();
        });

        // Initialize offline status on page load
        updateOfflineStatus();

        // Handle failed requests for offline queueing
        // Listen for HTMX response errors to queue failed operations
        document.body.addEventListener('htmx:responseError', function(event) {
            // Only queue if we're offline
            if (navigator.onLine) {
                return;
            }

            const detail = event.detail;
            if (!detail || !detail.requestConfig) {
                return;
            }

            const verb = detail.requestConfig.verb;
            const path = detail.requestConfig.path;
            const parameters = detail.requestConfig.parameters;

            // Queue DELETE requests that failed due to offline status
            if (verb === 'DELETE') {
                queueOfflineOperation({
                    method: 'DELETE',
                    url: path,
                    headers: { 'Content-Type': 'application/json' }
                });

                console.log('Queued failed offline DELETE:', path);
                showNotification("Operation queued for when you're back online", 'info');
            }
            // Queue PUT/PATCH requests (updates)
            else if (verb === 'PUT' || verb === 'PATCH') {
                queueOfflineOperation({
                    method: verb,
                    url: path,
                    body: parameters,
                    headers: { 'Content-Type': 'application/json' }
                });

                console.log('Queued failed offline', verb + ':', path);
                showNotification("Changes saved locally and will sync when online", 'info');
                
                // Store the update locally for immediate UI feedback
                if (path.includes('/lists/') && parameters && parameters.name) {
                    localStorage.setItem('offline-list-update-' + path, JSON.stringify(parameters));
                }
            }
            // Queue POST requests (creates)
            else if (verb === 'POST') {
                queueOfflineOperation({
                    method: 'POST',
                    url: path,
                    body: parameters,
                    headers: { 'Content-Type': 'application/json' }
                });

                console.log('Queued failed offline POST:', path);
                showNotification("Changes saved locally and will sync when online", 'info');
            }
        });

        // Helper to show notifications
        const showNotification = (message, type = 'success') => {
            const notification = document.createElement('div');
            notification.className = 'notification ' + type;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        };

        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js').then(
                    registration => {
                        console.log('Service Worker registered:', registration);
                    },
                    error => {
                        console.log('Service Worker registration failed:', error);
                    }
                );
            });
        }

        // Refresh current list title
        const currentTitle = document.getElementById('current-list-title');
        if (currentTitle) {
            const refreshListTitleFromServer = async () => {
                try {
                    const titleListId = currentTitle.getAttribute('data-list-id');
                    if (!titleListId) {
                        return;
                    }

                    const response = await fetch('/api/lists', { cache: 'no-store' });
                    if (!response.ok) {
                        return;
                    }

                    const lists = await response.json();
                    if (!Array.isArray(lists)) {
                        return;
                    }

                    const match = lists.find(list => list.id === titleListId);
                    if (match && typeof match.name === 'string') {
                        currentTitle.textContent = match.name;
                    }
                } catch (err) {
                    console.error('List title refresh failed:', err);
                }
            };

            refreshListTitleFromServer();
            window.setInterval(refreshListTitleFromServer, 4000);
        }

        // Poll items for the current list
        const itemsList = document.getElementById('items-list');
        const currentTitle2 = document.getElementById('current-list-title');

        if (itemsList && currentTitle2) {
            const refreshItemsFromServer = async () => {
                try {
                    const listId = currentTitle2.getAttribute('data-list-id');
                    if (!listId) {
                        return;
                    }

                    const response = await fetch('/api/lists/' + listId + '/items', { cache: 'no-store' });
                    if (!response.ok) {
                        return;
                    }

                    const items = await response.json();
                    if (!Array.isArray(items)) {
                        return;
                    }

                    // Create signature from current items
                    const currentItems = Array.from(itemsList.querySelectorAll('.item'));
                    const currentSignature = currentItems
                        .map(item => item.getAttribute('data-item-id') + ':' + item.getAttribute('data-item-name') + ':' + (item.querySelector('.item-remark')?.textContent?.trim() || ''))
                        .join('|');

                    // Create signature from server items
                    const serverSignature = items
                        .map(item => item.id + ':' + item.name + ':' + (item.remark || ''))
                        .join('|');

                    if (currentSignature === serverSignature) {
                        return;
                    }

                    // Fetch fresh HTML from server
                    const htmlResponse = await fetch('/list/' + listId, { cache: 'no-store' });
                    if (!htmlResponse.ok) {
                        return;
                    }

                    const htmlText = await htmlResponse.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlText, 'text/html');
                    const newItemsList = doc.getElementById('items-list');
                    const newEmptyState = doc.getElementById('empty-state');

                    if (newItemsList) {
                        itemsList.innerHTML = newItemsList.innerHTML;
                        initializeAllItems();
                    }

                    // Update empty state too
                    const emptyState = document.getElementById('empty-state');
                    if (emptyState && newEmptyState) {
                        emptyState.style.display = newEmptyState.style.display;
                    }
                } catch (err) {
                    console.error('Items refresh failed:', err);
                }
            };

            refreshItemsFromServer();
            window.setInterval(refreshItemsFromServer, 4000);
        }

        const searchInput = document.getElementById('search-input');
        const suggestionsContainer = document.getElementById('suggestions-container');
        const searchForm = searchInput ? searchInput.closest('form') : null;

        const clearSuggestions = () => {
            if (suggestionsContainer) {
                suggestionsContainer.innerHTML = '';
            }
        };

        const updateEmptyState = () => {
            const emptyState = document.getElementById('empty-state');
            const itemsList = document.getElementById('items-list');
            if (!emptyState || !itemsList) {
                return;
            }

            const itemCount = itemsList.querySelectorAll('.item').length;
            emptyState.style.display = itemCount === 0 ? 'block' : 'none';
        };

        const initializeItemInteractions = (item) => {
            if (!item || item.dataset.initialized === 'true') {
                return;
            }

            item.dataset.initialized = 'true';

            let longPressTimer;
            let isLongPress = false;

            const handleMouseDown = () => {
                isLongPress = false;
                longPressTimer = setTimeout(() => {
                    isLongPress = true;
                    const itemId = item.dataset.itemId;
                    const listId = item.dataset.listId;
                    const editUrl = '/item/' + itemId + '/edit?listId=' + listId;
                    htmx.ajax('GET', editUrl, {
                        target: 'body',
                        swap: 'innerHTML'
                    });
                }, 500);
            };

            const handleMouseUp = () => {
                clearTimeout(longPressTimer);
                if (isLongPress) {
                    return;
                }

                const itemId = item.dataset.itemId;
                const listId = item.dataset.listId;
                const deleteUrl = '/api/lists/' + listId + '/items/' + itemId;

                // Optimistic update: immediately mark item as being deleted
                if (!isOnline) {
                    // When offline, just add visual feedback and queue the operation
                    item.classList.add('optimistic-delete');
                    
                    // Remove from DOM after animation
                    setTimeout(() => {
                        item.remove();
                        updateEmptyState();
                    }, 200);
                } else {
                    // When online, add optimistic styling but let HTMX handle the deletion
                    item.classList.add('optimistic-delete');
                }

                htmx.ajax('DELETE', deleteUrl, {
                    target: item,
                    swap: 'outerHTML swap:100ms'
                });
            };

            item.addEventListener('mousedown', handleMouseDown);
            item.addEventListener('mouseup', handleMouseUp);
            item.addEventListener('mouseleave', () => clearTimeout(longPressTimer));
            item.addEventListener('touchstart', handleMouseDown);
            item.addEventListener('touchend', handleMouseUp);
        };

        const initializeAllItems = () => {
            const items = document.querySelectorAll('.item[data-item-id]');
            items.forEach(item => initializeItemInteractions(item));
            updateEmptyState();
        };

        const initializeListRowInteractions = (row) => {
            if (!row || row.dataset.initialized === 'true') {
                return;
            }

            row.dataset.initialized = 'true';

            let longPressTimer;
            let isLongPress = false;

            const openList = () => {
                const listId = row.dataset.listId;
                if (!listId) {
                    return;
                }
                window.location.href = '/list/' + listId;
            };

            const openEdit = () => {
                const listId = row.dataset.listId;
                if (!listId) {
                    return;
                }
                window.location.href = '/list/' + listId + '/edit';
            };

            const handlePressStart = () => {
                isLongPress = false;
                longPressTimer = setTimeout(() => {
                    isLongPress = true;
                    openEdit();
                }, 500);
            };

            const handlePressEnd = () => {
                clearTimeout(longPressTimer);
                if (isLongPress) {
                    return;
                }
                openList();
            };

            row.addEventListener('mousedown', handlePressStart);
            row.addEventListener('mouseup', handlePressEnd);
            row.addEventListener('mouseleave', () => clearTimeout(longPressTimer));
            row.addEventListener('touchstart', handlePressStart);
            row.addEventListener('touchend', handlePressEnd);
            row.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openList();
                }
            });
        };

        const initializeAllListRows = () => {
            const listRows = document.querySelectorAll('.list-row[data-list-id]');
            listRows.forEach(row => initializeListRowInteractions(row));
        };

        if (searchInput && suggestionsContainer) {
            let autocompleteTimeout;

            searchInput.addEventListener('input', (e) => {
                clearTimeout(autocompleteTimeout);
                const query = e.target.value.trim();

                if (query.length === 0) {
                    clearSuggestions();
                    return;
                }

                autocompleteTimeout = setTimeout(async () => {
                    try {
                        const response = await fetch('/api/autocomplete?q=' + encodeURIComponent(query));
                        const markup = await response.text();
                        suggestionsContainer.innerHTML = markup;
                    } catch (err) {
                        console.error('Autocomplete error:', err);
                    }
                }, 300);
            });

            suggestionsContainer.addEventListener('click', (event) => {
                const target = event.target;
                const button = target.closest('.suggestion-btn');
                if (!button || !searchInput || !searchForm) {
                    return;
                }

                const itemName = button.dataset.itemName || button.textContent || '';
                searchInput.value = itemName;
                clearSuggestions();

                htmx.trigger(searchForm, 'submit');
            });

            document.addEventListener('click', (event) => {
                const target = event.target;
                if (!searchInput.contains(target) && !suggestionsContainer.contains(target)) {
                    clearSuggestions();
                }
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            initializeAllItems();
            initializeAllListRows();
        });

        htmx.on('htmx:afterSwap', () => {
            initializeAllItems();
            initializeAllListRows();
        });

        htmx.on('htmx:afterRequest', (event) => {
            const pathInfo = event.detail.pathInfo;
            const requestPath = pathInfo && pathInfo.requestPath ? pathInfo.requestPath : '';
            if (requestPath.indexOf('/api/lists/') !== -1 && requestPath.indexOf('/items') !== -1) {
                setTimeout(updateEmptyState, 120);
            }
        });
    </script >
</body >
</html > `;
