# Shopping List PWA

Offline-first shopping list Progressive Web App with Cloudflare Workers backend and D1 database.

## Features

- **Multiple Shopping Lists**: Create and manage multiple shopping lists
- **Offline-First**: Works seamlessly offline with automatic sync when back online
- **Smart Autocomplete**: Suggests items based on history as you type
- **Organized by Area**: Items grouped by supermarket position/area, alphabetically sorted
- **Click to Remove**: Single-click items to remove them from the list
- **Long-Press to Edit**: Long-press items to edit name, remark, and position
- **Admin Mode**: Track which device created/modified each item
- **Last-Write-Wins Sync**: Automatic conflict resolution across devices

## Tech Stack

- **Frontend**: HONO SSR (Server-Side Rendering with HTML templates)
- **Backend**: Cloudflare Workers + Hono
- **Database**: Cloudflare D1 (SQL)
- **Storage**: localStorage for offline queue
- **PWA**: Service Worker for offline support

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)
- Wrangler CLI

### Installation

```bash
# Install dependencies
npm install

# Initialize D1 database (local)
npx wrangler d1 create shopping_list_db

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

The app will be available at `http://localhost:8787`.

### Development

- `npm run dev` - Start Wrangler dev server
- `npm run deploy` - Deploy to Cloudflare Workers

### Database Schema

#### Lists
- `id` (UUID)
- `name`
- `created_at`
- `updated_at`
- `created_by_device_id`

#### Items
- `id` (UUID)
- `list_id` (FK to lists)
- `name`
- `remark` (quantity/notes)
- `position` (supermarket area)
- `completed`
- `created_at`
- `updated_at`
- `created_by_device_id`
- `last_modified_by_device_id`

#### Items History (for autocomplete)
- `id`
- `item_name`
- `last_used_at`

#### Sync Metadata
- `device_id`
- `list_id`
- `last_sync_at`
- `list_version`

## Usage

### Main Interface

- **Header**: List switcher, admin toggle, sync status
- **List View**: Items grouped by area, alphabetically sorted
- **Search Field**: Add new items or select from suggestions

### Interactions

- **Click item**: Remove from list
- **Long-press item**: Open edit dialog
- **Type in search**: See autocomplete suggestions
- **Click suggestion**: Add to list
- **List switcher**: Change or edit lists

### Admin Mode

Toggle admin mode to see device tracking information (which device created/modified each item).

## Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

Update `wrangler.toml` with your D1 database ID before deploying.

## API Endpoints

- `GET /api/lists` - Get all lists
- `POST /api/lists` - Create list
- `PUT /api/lists/:listId` - Update list
- `DELETE /api/lists/:listId` - Delete list
- `GET /api/lists/:listId/items` - Get items
- `POST /api/lists/:listId/items` - Create item
- `PUT /api/lists/:listId/items/:itemId` - Update item
- `DELETE /api/lists/:listId/items/:itemId` - Delete item
- `POST /api/sync` - Sync operations
- `GET /api/autocomplete?q=query` - Search suggestions
- `GET /api/admin/lists/:listId/activity` - Admin activity log

## Architecture

### Offline Sync Strategy

1. **Local State**: React state holds current items
2. **Offline Queue**: localStorage stores pending operations
3. **Optimistic Updates**: UI updates immediately
4. **Auto-Sync**: Syncs when device comes online
5. **Conflict Resolution**: Last-write-wins based on timestamps

### Data Flow

```
User Action → Optimistic Update → Queue Operation → (Online?) → Sync → Update State
```

## License

MIT
