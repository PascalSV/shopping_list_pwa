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
    <meta name="theme-color" content="#FF6969" />
    <meta name="description" content="Offline-first shopping list PWA" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>${props.title}</title>
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/png" href="/icons/icon-64.png" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <link rel="stylesheet" href="/fonts/fonts.css" />
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <style>
        :root {
            --primary: #FF6969;
            --secondary: #CCCCCC;
            --error: #F44336;
            --warning: #FF9800;
            --success: #4CAF50;
            --bg-primary: #FFFFFF;
            --bg-secondary: #F5F5F5;
            --text-primary: #1a1a1a;
            --text-secondary: #666666;
            --text-tertiary: #999999;
            --border: #E0E0E0;
            --border-strong: #E0E0E0;
            --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
            --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.12);
            --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.14);
            --shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.15);
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
            font-family: 'SF Pro Display', 'D-DIN', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--bg-secondary);
            color: var(--text-primary);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            min-height: 100vh;
            height: 100dvh;
            position: relative;
            overflow-x: hidden;
            overflow-y: hidden;
        }



        .container {
            max-width: 720px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            height: 100dvh;
            max-height: 100dvh;
            background: var(--bg-primary);
            border-left: 1px solid var(--border);
            border-right: 1px solid var(--border);
            box-shadow: var(--shadow-md);
            position: relative;
            z-index: 1;
            overflow: hidden;
            padding-top: env(safe-area-inset-top);
        }

        /* Header Styles */
        .header {
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 0.5rem 1.5rem;
            box-shadow: var(--shadow-sm);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header h1 {
            font-family: 'D-DIN', sans-serif;
            font-size: 1.75rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            letter-spacing: -0.025em;
            color: var(--text-primary);
        }

        h2, h3, h4, h5, h6 {
            font-family: 'D-DIN', sans-serif;
            font-weight: 700;
        }

        .logo {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--primary);
            border: none;
            box-shadow: var(--shadow-sm);
            padding: 0;
        }

        .logo img {
            width: 24px;
            height: 24px;
            border-radius: 0;
            display: block;
            filter: brightness(0) invert(1);
        }

        .btn {
            font-family: 'D-DIN', sans-serif;
            padding: 0.45rem 0.85rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            cursor: pointer;
            font-weight: 600;
            font-size: 0.85rem;
            transition: transform 0.1s ease, background 0.1s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            justify-content: center;
            white-space: nowrap;
            line-height: 1;
            min-height: 34px;
            box-shadow: var(--shadow-sm);
            position: relative;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .btn-primary:active {
            opacity: 0.85;
        }

        .btn-secondary {
            background: var(--secondary);
            color: var(--text-primary);
            border: 1px solid var(--border);
        }

        .btn-secondary:active {
            opacity: 0.85;
        }

        .btn-danger {
            background: var(--error);
            color: white;
            border-color: var(--error);
        }

        .btn-danger:active {
            opacity: 0.85;
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
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            overscroll-behavior: contain;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 1.5rem;
            padding-bottom: 1rem;
            background: var(--bg-secondary);
        }

        .content::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
        }

        /* Footer Styles */
        .footer {
            position: relative;
            max-width: 720px;
            margin: 0 auto;
            width: 100%;
            flex-shrink: 0;
            padding: 0.65rem;
            padding-bottom: calc(0.65rem + env(safe-area-inset-bottom));
            background: transparent;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            border-top: none;
            box-shadow: none;
            z-index: 50;
        }

        .footer:empty {
            display: none;
        }

        .container.has-search .footer {
            background: var(--secondary);
            border-top: 1px solid var(--border);
            box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
        }

        /* Items List */
        .items-list {
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
        }

        /* List View */
        .list-view {
            position: relative;
            min-height: 50vh;
        }

        .list-toolbar {
            position: sticky;
            top: 0;
            z-index: 35;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            margin-top: -1.5rem;
            margin-left: -1.5rem;
            margin-right: -1.5rem;
            margin-bottom: 0.75rem;
            padding: 0.2rem 1.5rem 0.75rem;
            background: var(--bg-primary);
            transition: gap 0.18s ease, padding 0.18s ease;
        }

        .list-back-btn {
            padding: 0.35rem 0.75rem;
            font-size: 0.8rem;
            min-height: 28px;
        }

        .list-title {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
            line-height: 1.15;
            transition: font-size 0.18s ease;
        }

        .list-toolbar.compact {
            flex-direction: row;
            align-items: center;
            gap: 0.6rem;
            padding: 0.2rem 1.5rem 0.6rem;
        }

        .list-toolbar.compact .list-title {
            font-size: 1.1rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: calc(100% - 110px);
        }

        .scrolling-list-title {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0 0 1rem 0;
            line-height: 1.15;
            padding: 0;
        }

        .item {
            display: flex;
            gap: 0.75rem;
            padding: 0.85rem 1rem;
            background: var(--primary);
            border-radius: 0;
            align-items: center;
            box-shadow: var(--shadow-sm);
            border: none;
            transition: all 0.2s ease;
            position: relative;
            cursor: pointer;
            height: 4rem;
        }

        .item:first-child {
            border-top-left-radius: var(--radius-xl);
            border-top-right-radius: var(--radius-xl);
        }

        .item:last-child {
            border-bottom-left-radius: var(--radius-xl);
            border-bottom-right-radius: var(--radius-xl);
        }

        .item:only-child {
            border-radius: var(--radius-xl);
        }

        .item-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.05rem;
            width: 100%;
        }

        .item.no-remark .item-content {
            justify-content: center;
            gap: 0;
            height: 100%;
        }

        .item:active {
            opacity: 0.9;
        }

        .item.completed {
            background: var(--primary);
            opacity: 0.75;
        }

        .item-name {
            flex: 0 0 auto;
            font-family: 'D-DIN Condensed', sans-serif;
            font-size: 1.06rem;
            font-weight: 600;
            color: white;
        }

        .item-remark {
            font-size: 0.92rem;
            color: rgba(255, 255, 255, 0.95);
            display: block;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .item-remark-empty {
            display: none;
        }

        /* Forms */
        .add-item-form {
            display: flex;
            gap: 0.75rem;
            background: var(--bg-secondary);
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
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.2s ease;
            background: var(--bg-primary);
            color: var(--text-primary);
        }

        .add-item-form input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(255, 105, 105, 0.2);
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
            gap: 0.4rem;
            background: var(--bg-primary);
            border-radius: var(--radius-xl);
            padding: 0.35rem;
            border: 1px solid var(--border);
        }

        .inline-error-banner {
            width: 100%;
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transform: translateY(10px);
            margin-bottom: 0;
            padding: 0 1rem;
            border-radius: var(--radius-lg);
            color: #c62828;
            font-size: 0.9rem;
            font-weight: 600;
            letter-spacing: 0.01em;
            border: 1px solid var(--error);
            background: #FFEBEE;
            box-shadow: var(--shadow-sm);
            transition: max-height 0.28s ease, opacity 0.22s ease, transform 0.22s ease, margin-bottom 0.22s ease, padding 0.22s ease;
        }

        .inline-error-banner.show {
            max-height: 84px;
            opacity: 1;
            transform: translateY(0);
            margin-bottom: 0.65rem;
            padding: 0.7rem 1rem;
        }

        .search-form input {
            flex: 1;
            min-width: 0;
            padding: 0.5rem 0.85rem;
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
            box-shadow: 0 0 0 3px rgba(255, 105, 105, 0.2);
        }

        .search-form input::placeholder {
            color: var(--text-tertiary);
        }

        .suggestions-container {
            position: absolute;
            bottom: calc(100% + 0.35rem);
            left: 0;
            right: 0;
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-start;
            gap: 0.5rem;
            padding: 0 0.5rem;
            background: transparent;
            border: none;
            box-shadow: none;
            border-radius: 0;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            max-height: 200px;
            overflow-y: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            z-index: 60;
        }

        .suggestions-container::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
        }

        .suggestions-container:empty {
            display: none;
        }

        .suggestion-btn {
            padding: 0.5rem 1rem;
            background: var(--text-secondary);
            color: white;
            border: 1px solid var(--text-secondary);
            border-radius: var(--radius-lg);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            box-shadow: var(--shadow-sm);
        }

        .suggestion-btn:active {
            opacity: 0.85;
        }

        .btn-icon-clear {
            padding: 0.5rem;
            width: 36px;
            height: 36px;
            border-radius: var(--radius-lg);
            border: 1px solid var(--border);
            background: var(--secondary);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-primary);
            box-shadow: var(--shadow-sm);
        }

        .btn-icon-clear:active {
            opacity: 0.85;
        }

        .btn-icon-clear svg {
            width: 18px;
            height: 18px;
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
            box-shadow: var(--shadow-lg);
            animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: none;
            z-index: 1000;
        }

        .notification.success {
            background: var(--success);
        }

        .notification.error {
            background: var(--error);
        }

        .notification.info {
            background: var(--primary);
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
            color: var(--text-secondary);
            font-size: 1.125rem;
            background: var(--bg-secondary);
            border-radius: var(--radius-xl);
            border: 1px solid var(--border);
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
            border: none;
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

        .header,
        .content,
        .footer {
            animation: glassFadeIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .item,
        .list-row,
        .form-container,
        .add-item-form {
            animation: glassRise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .item:nth-child(2), .list-row:nth-child(2) { animation-delay: 40ms; }
        .item:nth-child(3), .list-row:nth-child(3) { animation-delay: 80ms; }
        .item:nth-child(4), .list-row:nth-child(4) { animation-delay: 120ms; }
        .item:nth-child(5), .list-row:nth-child(5) { animation-delay: 160ms; }

        @keyframes glassFadeIn {
            from {
                opacity: 0;
                transform: translateY(8px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes glassRise {
            from {
                opacity: 0;
                transform: translateY(14px) scale(0.985);
                filter: blur(2px);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0);
            }
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

            .inline-error-banner.show {
                font-size: 0.86rem;
                margin-bottom: 0.5rem;
                padding: 0.62rem 0.85rem;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }

        /* Form Pages */
        .form-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.4);
            z-index: 200;
            pointer-events: auto;
        }

        .form-container > form {
            background: var(--bg-primary);
            padding: 2rem;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-xl);
            border: 1px solid var(--border);
            max-width: 480px;
            width: 90%;
            z-index: 201;
            pointer-events: auto;
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
            font-family: 'D-DIN Condensed', sans-serif;
            font-weight: 600;
            font-size: 0.95rem;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 0.875rem 1.125rem;
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.2s ease;
            background: var(--bg-primary);
            color: var(--text-primary);
        }

        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(255, 105, 105, 0.2);
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

        .list-row:active {
            opacity: 0.9;
        }

        .list-row-content {
            display: flex;
            flex-direction: column;
            min-width: 0;
        }

        .list-row-name {
            font-family: 'D-DIN Condensed', sans-serif;
            font-size: 1.05rem;
            font-weight: 700;
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
    <div class="container ${props.currentListId ? 'has-search' : ''}">

        <div class="content" id="content">
            ${props.children}
        </div>

        <div class="footer">
            ${props.currentListId ? html`
                <div id="inline-error-banner" class="inline-error-banner" role="status" aria-live="polite"></div>
                ${SearchForm({ listId: props.currentListId })}
            ` : ''}
        </div>
    </div>

    <script>
        // === Offline Queue System ===
        // Only initialize once per session to avoid redeclaration errors
        if (typeof window.offlineQueueInitialized === 'undefined') {
            window.offlineQueueInitialized = true;
            
            const OFFLINE_QUEUE_KEY = 'shopping-list-offline-queue';
            let isOnline = navigator.onLine;

            // Store in window for access across script executions
            window.offlineQueueState = { isOnline };

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

                if (window.offlineQueueState.isOnline) {
                    offlineBadge.classList.remove('visible');
                } else {
                    offlineBadge.classList.add('visible');
                }
            };

            // Process offline queue when back online
            const processOfflineQueue = async () => {
                if (!window.offlineQueueState.isOnline) {
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
                window.offlineQueueState.isOnline = true;
                updateOfflineStatus();
                processOfflineQueue();
            });

            window.addEventListener('offline', () => {
                console.log('Connection lost - entering offline mode');
                window.offlineQueueState.isOnline = false;
                updateOfflineStatus();
            });

            // Initialize offline status
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

        // Helper to show notifications (attached to window for global access)
        window.showNotification = (message, type = 'success') => {
            const notification = document.createElement('div');
            notification.className = 'notification ' + type;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        };
        const showNotification = window.showNotification; // Alias for convenience

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
        } // Close initialization block

        // Poll items for the current list
        {
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

                    // Build maps for efficient lookup
                    const currentItems = Array.from(itemsList.querySelectorAll('.item'));
                    const currentItemsMap = new Map();
                    currentItems.forEach(itemEl => {
                        const id = itemEl.getAttribute('data-item-id');
                        const name = itemEl.getAttribute('data-item-name');
                        const remarkEl = itemEl.querySelector('.item-remark');
                        const remark = remarkEl && remarkEl.textContent ? remarkEl.textContent.trim() : '';
                        currentItemsMap.set(id, { element: itemEl, name, remark });
                    });

                    const serverItemsMap = new Map();
                    items.forEach(item => {
                        serverItemsMap.set(item.id, { name: item.name, remark: item.remark || '' });
                    });

                    let hasChanges = false;

                    // Remove deleted items
                    currentItemsMap.forEach((data, id) => {
                        if (!serverItemsMap.has(id)) {
                            data.element.remove();
                            hasChanges = true;
                        }
                    });

                    // Add new items or update existing ones
                    items.forEach((serverItem, index) => {
                        const existing = currentItemsMap.get(serverItem.id);
                        
                        if (!existing) {
                            // Item doesn't exist - add it
                            const itemClass = serverItem.remark ? 'item' : 'item no-remark';
                            let itemHtml = '<div class="' + itemClass + '" data-item-id="' + serverItem.id + '" data-list-id="' + listId + '" data-item-name="' + serverItem.name + '">';
                            itemHtml += '<div class="item-content">';
                            itemHtml += '<span class="item-name">' + serverItem.name + '</span>';
                            if (serverItem.remark) {
                                itemHtml += '<span class="item-remark">' + serverItem.remark + '</span>';
                            }
                            itemHtml += '</div></div>';
                            
                            // Insert at correct position
                            const currentItemAtPosition = itemsList.children[index];
                            if (currentItemAtPosition) {
                                currentItemAtPosition.insertAdjacentHTML('beforebegin', itemHtml);
                            } else {
                                itemsList.insertAdjacentHTML('beforeend', itemHtml);
                            }
                            hasChanges = true;
                        } else if (existing.name !== serverItem.name || existing.remark !== (serverItem.remark || '')) {
                            // Item exists but content changed - update it
                            const nameEl = existing.element.querySelector('.item-name');
                            if (nameEl) {
                                nameEl.textContent = serverItem.name;
                            }
                            existing.element.setAttribute('data-item-name', serverItem.name);
                            
                            const remarkEl = existing.element.querySelector('.item-remark');
                            if (serverItem.remark) {
                                existing.element.classList.remove('no-remark');
                                if (remarkEl) {
                                    remarkEl.textContent = serverItem.remark;
                                } else {
                                    const contentEl = existing.element.querySelector('.item-content');
                                    if (contentEl) {
                                        contentEl.insertAdjacentHTML('beforeend', '<span class="item-remark">' + serverItem.remark + '</span>');
                                    }
                                }
                            } else {
                                existing.element.classList.add('no-remark');
                                if (remarkEl) {
                                    remarkEl.remove();
                                }
                            }
                            hasChanges = true;
                        }
                    });

                    // Re-initialize event listeners only for new/updated items
                    if (hasChanges) {
                        initializeAllItems();
                        
                        // Update empty message visibility
                        const emptyMessage = document.getElementById('empty-message');
                        if (items.length === 0) {
                            if (!emptyMessage) {
                                const listView = itemsList.closest('.list-view');
                                if (listView) {
                                    listView.insertAdjacentHTML('afterbegin', '<div id="empty-message" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1rem; color: var(--text-secondary); text-align: center;">You have no more items to shop - well done!</div>');
                                }
                            }
                        } else if (emptyMessage) {
                            emptyMessage.remove();
                        }
                    }
                } catch (err) {
                    console.error('Items refresh failed:', err);
                }
            };

            refreshItemsFromServer();
            window.setInterval(refreshItemsFromServer, 4000);
        }
        } // Close polling block

        const updateEmptyState = () => {
            const emptyMessage = document.getElementById('empty-message');
            const itemsList = document.getElementById('items-list');
            if (!emptyMessage || !itemsList) {
                return;
            }

            const itemCount = itemsList.querySelectorAll('.item').length;
            emptyMessage.style.display = itemCount === 0 ? 'block' : 'none';
        };

        const initializeListToolbar = () => {
            const toolbar = document.getElementById('list-toolbar');
            const toolbarTitle = document.getElementById('toolbar-title');
            const content = document.getElementById('content');
            
            if (!toolbar || !toolbarTitle || !content) {
                return;
            }

            // Clean up previous listeners before rebinding after HTMX swaps
            if (window.listToolbarCleanup) {
                window.listToolbarCleanup();
            }

            const showToolbarTitleAtScrollTopPx = 12;

            const updateToolbarState = () => {
                // Reveal compact title shortly after user starts scrolling.
                const shouldShowToolbarTitle = content.scrollTop >= showToolbarTitleAtScrollTopPx;
                toolbarTitle.style.display = shouldShowToolbarTitle ? 'block' : 'none';
                toolbar.classList.toggle('compact', shouldShowToolbarTitle);
            };

            content.addEventListener('scroll', updateToolbarState, { passive: true });
            window.addEventListener('resize', updateToolbarState);

            window.listToolbarCleanup = () => {
                content.removeEventListener('scroll', updateToolbarState);
                window.removeEventListener('resize', updateToolbarState);
            };

            updateToolbarState();
        };

        const initializeItemInteractions = (item) => {
            if (!item || item.dataset.initialized === 'true') {
                return;
            }

            item.dataset.initialized = 'true';

            let longPressTimer;
            let isLongPress = false;
            let hasMovedTooFar = false;
            let touchStartX = 0;
            let touchStartY = 0;
            let touchStartScrollTop = 0;

            const handleMouseDown = (e) => {
                isLongPress = false;
                hasMovedTooFar = false;
                touchStartX = e.clientX || e.touches?.[0]?.clientX || 0;
                touchStartY = e.clientY || e.touches?.[0]?.clientY || 0;
                
                // Record initial scroll position to detect vertical scrolling
                const contentEl = document.querySelector('.content');
                touchStartScrollTop = contentEl ? contentEl.scrollTop : 0;
                
                longPressTimer = setTimeout(() => {
                    if (!hasMovedTooFar) {
                        isLongPress = true;
                        const itemId = item.dataset.itemId;
                        const listId = item.dataset.listId;
                        const editUrl = '/item/' + itemId + '/edit?listId=' + listId;
                        htmx.ajax('GET', editUrl, {
                            target: 'body',
                            swap: 'beforeend'
                        });
                    }
                }, 500);
            };

            const handleMove = (e) => {
                // Cancel long-press if finger movement exceeds threshold (10px)
                const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
                const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
                const distance = Math.sqrt(
                    Math.pow(currentX - touchStartX, 2) + Math.pow(currentY - touchStartY, 2)
                );
                
                if (distance > 10) {
                    hasMovedTooFar = true;
                    clearTimeout(longPressTimer);
                }
            };

            const handleMouseUp = (e) => {
                clearTimeout(longPressTimer);
                
                // Check if page scrolled during touch
                const contentEl = document.querySelector('.content');
                const currentScrollTop = contentEl ? contentEl.scrollTop : 0;
                const scrollDelta = Math.abs(currentScrollTop - touchStartScrollTop);
                if (scrollDelta > 5) {
                    hasMovedTooFar = true;
                }
                
                if (isLongPress || hasMovedTooFar) {
                    return;
                }

                const itemId = item.dataset.itemId;
                const listId = item.dataset.listId;
                const deleteUrl = '/api/lists/' + listId + '/items/' + itemId;

                // Optimistic update: immediately mark item as being deleted
                if (!navigator.onLine) {
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
            item.addEventListener('mousemove', handleMove, { passive: true });
            item.addEventListener('mouseup', handleMouseUp);
            item.addEventListener('mouseleave', () => clearTimeout(longPressTimer));
            item.addEventListener('touchstart', handleMouseDown, { passive: true });
            item.addEventListener('touchmove', handleMove, { passive: true });
            item.addEventListener('touchend', handleMouseUp, { passive: true });
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

        // Search and autocomplete functionality
        {
            const searchInput = document.getElementById('search-input');
            const suggestionsContainer = document.getElementById('suggestions-container');
            const searchForm = searchInput ? searchInput.closest('form') : null;

            const clearSuggestions = () => {
                if (suggestionsContainer) {
                    suggestionsContainer.innerHTML = '';
                }
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
        } // Close search block

        document.addEventListener('DOMContentLoaded', () => {
            initializeAllItems();
            initializeAllListRows();
            initializeListToolbar();
        });

        htmx.on('htmx:afterSwap', () => {
            initializeAllItems();
            initializeAllListRows();
            initializeListToolbar();
        });

        htmx.on('htmx:afterRequest', (event) => {
            const pathInfo = event.detail.pathInfo;
            const requestPath = pathInfo && pathInfo.requestPath ? pathInfo.requestPath : '';
            if (requestPath.indexOf('/api/lists/') !== -1 && requestPath.indexOf('/items') !== -1) {
                if (event.detail.successful) {
                    const inlineErrorBanner = document.getElementById('inline-error-banner');
                    if (inlineErrorBanner) {
                        inlineErrorBanner.classList.remove('show');
                        inlineErrorBanner.textContent = '';
                    }
                }
                setTimeout(updateEmptyState, 120);
            }
        });

        htmx.on('htmx:responseError', (event) => {
            const xhr = event.detail.xhr;
            
            // Handle duplicate item error
            if (xhr.status === 409) {
                let message = 'Item already exists in this list';
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.error) {
                        message = response.error;
                    }
                } catch (e) {
                    // Use default message
                }
                const inlineErrorBanner = document.getElementById('inline-error-banner');
                if (inlineErrorBanner) {
                    inlineErrorBanner.textContent = message;
                    inlineErrorBanner.classList.add('show');
                    setTimeout(() => {
                        inlineErrorBanner.classList.remove('show');
                    }, 4500);
                } else {
                    window.showNotification(message, 'error');
                }
                
                // Prevent HTMX from swapping
                event.detail.shouldSwap = false;
            }
        });

        // Close modal when clicking on backdrop (outside the form)
        document.addEventListener('click', (event) => {
            const formContainer = event.target.closest('.form-container');
            if (formContainer && event.target === formContainer) {
                // User clicked on the backdrop, navigate back
                window.history.back();
            }
        }, true);
    </script>
</body>
</html>`;
