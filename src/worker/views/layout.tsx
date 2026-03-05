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
    <meta name="theme-color" content="#0a84ff" />
    <meta name="description" content="Offline-first shopping list PWA" />
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
            --primary: #0a84ff;
            --primary-dark: #0068d8;
            --primary-light: #5ac8fa;
            --secondary: #64d2ff;
            --danger: #ff453a;
            --warning: #ff9f0a;
            --success: #32d74b;
            --bg-primary: rgba(255, 255, 255, 0.56);
            --bg-secondary: rgba(246, 250, 255, 0.52);
            --bg-tertiary: rgba(226, 236, 248, 0.58);
            --bg-page-top: #c9dcff;
            --bg-page-bottom: #f1f7ff;
            --text-primary: #102340;
            --text-secondary: #2a4668;
            --text-tertiary: #5f7a9a;
            --border: rgba(255, 255, 255, 0.62);
            --border-strong: rgba(255, 255, 255, 0.78);
            --shadow-sm: 0 8px 18px rgba(10, 33, 63, 0.09);
            --shadow-md: 0 14px 30px rgba(10, 33, 63, 0.14);
            --shadow-lg: 0 24px 48px rgba(10, 33, 63, 0.17);
            --shadow-xl: 0 38px 72px rgba(10, 33, 63, 0.2);
            --radius-sm: 0.375rem;
            --radius-md: 0.5rem;
            --radius-lg: 0.75rem;
            --radius-xl: 1rem;
            --glass-blur: blur(24px) saturate(170%);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'SF Pro Display', 'D-DIN', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background:
                radial-gradient(140% 90% at 12% 8%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0) 60%),
                radial-gradient(120% 80% at 88% 0%, rgba(99, 181, 255, 0.35) 0%, rgba(99, 181, 255, 0) 62%),
                linear-gradient(172deg, var(--bg-page-top) 0%, var(--bg-page-bottom) 50%, #eaf3ff 100%);
            color: var(--text-primary);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }

        body::before,
        body::after {
            content: '';
            position: fixed;
            border-radius: 999px;
            pointer-events: none;
            filter: blur(2px);
            z-index: 0;
        }

        body::before {
            width: 360px;
            height: 360px;
            top: -120px;
            left: -80px;
            background: radial-gradient(circle at 40% 35%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0) 72%);
        }

        body::after {
            width: 420px;
            height: 420px;
            right: -160px;
            bottom: -130px;
            background: radial-gradient(circle at 45% 50%, rgba(95, 188, 255, 0.3) 0%, rgba(95, 188, 255, 0) 70%);
        }

        .container {
            max-width: 720px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: linear-gradient(140deg, rgba(255, 255, 255, 0.42) 0%, rgba(232, 243, 255, 0.4) 100%);
            backdrop-filter: var(--glass-blur);
            -webkit-backdrop-filter: var(--glass-blur);
            border-left: 1px solid var(--border-strong);
            border-right: 1px solid var(--border-strong);
            box-shadow: var(--shadow-xl);
            position: relative;
            z-index: 1;
            overflow: hidden;
        }

        .container::before {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            height: 1px;
            background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.82) 50%, rgba(255, 255, 255, 0) 100%);
            z-index: 2;
            pointer-events: none;
        }

        /* Header Styles */
        .header {
            background: transparent;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            color: var(--text-primary);
            padding: 0.5rem 1.5rem;
            box-shadow: none;
            border-bottom: none;
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
            background: linear-gradient(135deg, rgba(10, 132, 255, 0.18) 0%, rgba(90, 200, 250, 0.14) 100%);
            border: none;
            box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.4), 0 8px 14px rgba(13, 33, 54, 0.1);
            padding: 0;
        }

        .logo img {
            width: 24px;
            height: 24px;
            border-radius: 0;
            display: block;
        }

        .btn {
            font-family: 'D-DIN', sans-serif;
            padding: 0.45rem 0.85rem;
            border: 1px solid var(--border-strong);
            border-radius: var(--radius-lg);
            cursor: pointer;
            font-weight: 600;
            font-size: 0.85rem;
            transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            justify-content: center;
            white-space: nowrap;
            line-height: 1;
            min-height: 34px;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75), var(--shadow-sm);
            backdrop-filter: blur(14px) saturate(150%);
            -webkit-backdrop-filter: blur(14px) saturate(150%);
            position: relative;
            overflow: hidden;
        }

        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 46%;
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.52) 0%, rgba(255, 255, 255, 0) 100%);
            pointer-events: none;
        }

        .btn-primary {
            background: linear-gradient(135deg, rgba(10, 132, 255, 0.82) 0%, rgba(90, 200, 250, 0.72) 100%);
            color: white;
            border-color: rgba(255, 255, 255, 0.6);
        }

        .btn-primary:hover {
            background: linear-gradient(135deg, rgba(0, 104, 216, 0.92) 0%, rgba(10, 132, 255, 0.84) 100%);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }

        .btn-primary:active {
            transform: translateY(0);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.42);
            color: var(--text-primary);
            border: 1px solid var(--border-strong);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.62);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }

        .btn-danger {
            background: linear-gradient(135deg, rgba(255, 105, 97, 0.85) 0%, rgba(255, 69, 58, 0.82) 100%);
            color: white;
            border-color: rgba(255, 255, 255, 0.58);
        }

        .btn-danger:hover {
            background: linear-gradient(135deg, rgba(255, 69, 58, 0.94) 0%, rgba(209, 48, 39, 0.9) 100%);
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
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(233, 244, 255, 0.08) 100%);
        }

        /* Footer Styles */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            max-width: 720px;
            margin: 0 auto;
            width: 100%;
            padding: 1rem;
            background: transparent;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            border-top: none;
            box-shadow: none;
            z-index: 50;
        }

        /* Items List */
        .items-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        /* List View */
        .list-view {
            position: relative;
            min-height: 50vh;
        }

        .item {
            display: flex;
            gap: 0.75rem;
            padding: 1rem 1rem;
            background: linear-gradient(140deg, rgba(255, 255, 255, 0.54) 0%, rgba(233, 244, 255, 0.44) 100%);
            border-radius: var(--radius-xl);
            align-items: flex-start;
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border-strong);
            backdrop-filter: blur(16px) saturate(150%);
            -webkit-backdrop-filter: blur(16px) saturate(150%);
            transition: all 0.2s ease;
            position: relative;
            cursor: pointer;
            height: 4.75rem;
        }

        .item-content {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.3rem;
            width: 100%;
        }

        .item:hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
            border-color: rgba(113, 186, 255, 0.95);
        }

        .item.completed {
            background: linear-gradient(140deg, rgba(231, 238, 247, 0.54) 0%, rgba(223, 234, 246, 0.58) 100%);
            opacity: 0.82;
        }

        .item-name {
            flex: 0 0 auto;
            font-family: 'D-DIN Condensed', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .item-remark {
            font-size: 0.875rem;
            color: var(--text-secondary);
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
            background: linear-gradient(140deg, rgba(255, 255, 255, 0.5) 0%, rgba(229, 241, 255, 0.46) 100%);
            padding: 1.25rem;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border-strong);
            backdrop-filter: blur(20px) saturate(170%);
            -webkit-backdrop-filter: blur(20px) saturate(170%);
            flex-wrap: wrap;
            flex: none;
        }

        .add-item-form input {
            flex: 1;
            min-width: 200px;
            padding: 0.875rem 1.125rem;
            border: 1px solid rgba(255, 255, 255, 0.7);
            border-radius: var(--radius-lg);
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.2s ease;
            background: rgba(255, 255, 255, 0.36);
            color: var(--text-primary);
            backdrop-filter: blur(10px) saturate(145%);
            -webkit-backdrop-filter: blur(10px) saturate(145%);
        }

        .add-item-form input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.18);
            background: rgba(255, 255, 255, 0.6);
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
            background: rgba(255, 255, 255, 0.36);
            border-radius: var(--radius-xl);
            border: 1px solid var(--border-strong);
            box-shadow: var(--shadow-sm);
            padding: 0.45rem;
            backdrop-filter: blur(18px) saturate(170%);
            -webkit-backdrop-filter: blur(18px) saturate(170%);
        }

        .search-form input {
            flex: 1;
            min-width: 0;
            padding: 0.75rem 1rem;
            border: 1px solid rgba(255, 255, 255, 0.42);
            border-radius: var(--radius-lg);
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.2s ease;
            background: rgba(255, 255, 255, 0.2);
            color: var(--text-primary);
        }

        .search-form input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.14);
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
            justify-content: center;
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
            z-index: 60;
        }

        .suggestions-container:empty {
            display: none;
        }

        .suggestion-btn {
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, rgba(10, 132, 255, 0.88) 0%, rgba(90, 200, 250, 0.8) 100%);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.7);
            border-radius: var(--radius-lg);
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48), 0 10px 20px rgba(7, 46, 83, 0.16);
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
            border: 1px solid var(--border-strong);
            background: rgba(255, 255, 255, 0.36);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75), var(--shadow-sm);
        }

        .btn-icon-clear:hover {
            border-color: var(--primary);
            color: var(--primary);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
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
            backdrop-filter: blur(18px) saturate(165%);
            -webkit-backdrop-filter: blur(18px) saturate(165%);
            border: 1px solid rgba(255, 255, 255, 0.42);
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
            color: var(--text-secondary);
            font-size: 1.125rem;
            background: rgba(255, 255, 255, 0.3);
            border-radius: var(--radius-xl);
            border: 1px solid var(--border);
            backdrop-filter: blur(16px) saturate(165%);
            -webkit-backdrop-filter: blur(16px) saturate(165%);
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
            background: rgba(255, 159, 10, 0.88);
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
            border: 1px solid rgba(255, 224, 179, 0.65);
            backdrop-filter: blur(10px) saturate(170%);
            -webkit-backdrop-filter: blur(10px) saturate(170%);
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
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 200;
        }

        .form-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            z-index: -1;
        }

        .form-container > form,
        .form-container > div:not(::before):not(::after) {
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.55) 0%, rgba(232, 243, 255, 0.45) 100%);
            padding: 2rem;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-xl);
            border: 1px solid var(--border-strong);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            max-width: 480px;
            width: 90%;
            z-index: 201;
        }

        .form-container > form {
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.55) 0%, rgba(232, 243, 255, 0.45) 100%);
            padding: 2rem;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-xl);
            border: 1px solid var(--border-strong);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            max-width: 480px;
            width: 90%;
            z-index: 201;
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

        .form-group input {
            width: 100%;
            padding: 0.875rem 1.125rem;
            border: 1px solid rgba(255, 255, 255, 0.7);
            border-radius: var(--radius-lg);
            font-size: 1rem;
            font-family: inherit;
            transition: all 0.2s ease;
            background: rgba(255, 255, 255, 0.34);
            backdrop-filter: blur(10px) saturate(150%);
            -webkit-backdrop-filter: blur(10px) saturate(150%);
        }

        .form-group input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.17);
            background: rgba(255, 255, 255, 0.62);
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
            background: linear-gradient(140deg, rgba(255, 255, 255, 0.56) 0%, rgba(234, 245, 255, 0.44) 100%);
            border: 1px solid var(--border-strong);
            border-radius: var(--radius-xl);
            padding: 1rem 1.1rem;
            box-shadow: var(--shadow-sm);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            user-select: none;
            backdrop-filter: blur(16px) saturate(155%);
            -webkit-backdrop-filter: blur(16px) saturate(155%);
        }

        .list-row:hover {
            box-shadow: var(--shadow-md);
            transform: translateY(-2px);
            border-color: rgba(113, 186, 255, 0.95);
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
            text-shadow: 0 6px 16px rgba(13, 53, 99, 0.18);
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

        <div class="content" id="content">
            ${props.children}
        </div>

        <div class="footer">
            ${props.currentListId ? SearchForm({ listId: props.currentListId }) : ''}
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
        } // Close initialization block

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
                            let itemHtml = '<div class="item" data-item-id="' + serverItem.id + '" data-list-id="' + listId + '" data-item-name="' + serverItem.name + '">';
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
                                if (remarkEl) {
                                    remarkEl.textContent = serverItem.remark;
                                } else {
                                    const contentEl = existing.element.querySelector('.item-content');
                                    if (contentEl) {
                                        contentEl.insertAdjacentHTML('beforeend', '<span class="item-remark">' + serverItem.remark + '</span>');
                                    }
                                }
                            } else if (remarkEl) {
                                remarkEl.remove();
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

        const searchInput = document.getElementById('search-input');
        const suggestionsContainer = document.getElementById('suggestions-container');
        const searchForm = searchInput ? searchInput.closest('form') : null;

        const clearSuggestions = () => {
            if (suggestionsContainer) {
                suggestionsContainer.innerHTML = '';
            }
        };

        const updateEmptyState = () => {
            const emptyMessage = document.getElementById('empty-message');
            const itemsList = document.getElementById('items-list');
            if (!emptyMessage || !itemsList) {
                return;
            }

            const itemCount = itemsList.querySelectorAll('.item').length;
            emptyMessage.style.display = itemCount === 0 ? 'block' : 'none';
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
    </script>
</body>
</html>`;
