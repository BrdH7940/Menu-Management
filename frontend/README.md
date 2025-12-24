# Menu Management Dashboard

A high-performance, premium restaurant menu admin UI built with React, TypeScript, Tailwind CSS, and Shadcn/UI.

## Features

- 🚀 **Blazing Fast**: Optimistic updates with TanStack Query for instant UI feedback
- 🎨 **Premium Design**: Modern minimalist aesthetic with subtle animations
- 📱 **Responsive Grid**: Beautiful Bento-style grid layout for menu items
- ✏️ **Quick Edit**: Inline price editing with instant updates
- 🎯 **Modifier Management**: Drag-and-drop modifier groups and options
- 🔍 **Menu Health**: Real-time dashboard showing menu status

## Tech Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/UI** (Radix UI) for components
- **TanStack Query v5** for server state management
- **React Hook Form** + **Zod** for forms and validation
- **Framer Motion** for animations
- **@dnd-kit** for drag-and-drop functionality

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # Sidebar, TopBar
│   ├── menu/            # Menu-related components
│   └── ui/              # Shadcn/UI components
├── hooks/               # Custom React hooks (TanStack Query)
├── lib/                 # Utilities and API client
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

## Key Components

### MenuGrid
Displays menu items in a responsive grid layout with virtual scrolling support (can be enabled for large lists).

### EditItemDrawer
Slide-over drawer with tabs for editing menu items:
- **General Info**: Name, description, price, availability
- **Modifiers**: Drag-and-drop modifier groups and options
- **Photos**: Image management (placeholder for now)

### QuickEditPriceDialog
Quick price editing dialog for instant updates.

## Performance Optimizations

- **Optimistic Updates**: UI updates instantly before server confirmation
- **Query Caching**: Aggressive caching with TanStack Query
- **Code Splitting**: Lazy-loaded drawers and modals
- **Virtual Scrolling**: Ready for large lists (can be enabled in MenuGrid)
- **Memoization**: Optimized re-renders with React.useMemo

## Design System

- **Primary Color**: Deep Emerald (`#059669`)
- **Font**: Inter (with Geist fallback)
- **Spacing**: Consistent 4px base unit
- **Shadows**: Subtle `shadow-sm` for depth
- **Borders**: Clean, minimal borders with rounded corners

## API Integration

The app uses a mock API client (`src/lib/api.ts`). Replace with your actual API endpoints:

```typescript
const API_BASE = 'https://your-api.com/api'
```

## License

MIT

