# 🍞 Bread Note

A modern, offline-first PWA note-taking application built with Next.js 15, Turso, and TypeScript.

## Features

- ✍️ **Rich Text Editing** - Powered by Tiptap with markdown support
- 📱 **PWA Support** - Install and use offline on any device
- 🔄 **Offline-First** - Local-first with automatic cloud sync
- ✅ **To-Do Lists** - Create tasks with priorities and subtasks
- 🏷️ **Tags & Folders** - Organize notes your way
- 🔍 **Full-Text Search** - Find anything instantly
- 🤝 **Sharing** - Share notes publicly or with specific users
- 🗑️ **Trash** - 30-day recovery period
- 📄 **PDF Export** - Export notes as PDF
- ⌨️ **Keyboard Shortcuts** - Speed up your workflow
- 🌙 **Dark Theme** - Eye-friendly dark interface

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Turso (LibSQL/SQLite)
- **ORM**: Drizzle
- **Local DB**: IndexedDB (Dexie.js)
- **UI**: Shadcn/UI + Tailwind CSS
- **Editor**: Tiptap
- **Auth**: NextAuth.js
- **Email**: Resend
- **Upload**: UploadThing
- **Testing**: Vitest + Playwright
- **Monitoring**: Sentry + Vercel Analytics

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Turso account ([turso.tech](https://turso.tech))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bread-note.git
cd bread-note
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your configuration:
- Turso database URL and auth token
- NextAuth secret
- Resend API key (for email)
- UploadThing credentials (for image uploads)

4. Set up the database:
```bash
# Create Turso database
turso db create bread-note

# Get database URL
turso db show bread-note --url

# Create auth token
turso db tokens create bread-note

# Push schema to database
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests

## Project Structure

```
bread-note/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Auth pages
│   │   ├── (main)/       # Protected pages
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/           # Shadcn/UI components
│   │   ├── editor/       # Tiptap editor
│   │   ├── notes/        # Note components
│   │   └── layout/       # Layout components
│   ├── lib/              # Utilities & logic
│   │   ├── db/           # Turso database
│   │   ├── indexeddb/    # IndexedDB
│   │   ├── sync/         # Sync engine
│   │   ├── auth/         # NextAuth config
│   │   └── hooks/        # Custom React hooks
│   └── types/            # TypeScript types
├── public/               # Static assets
├── tests/                # Test files
└── drizzle/              # Database migrations
```

## Development Guide

See [CLAUDE.md](./CLAUDE.md) for detailed development documentation, including:
- Architecture overview
- API reference
- Database schema details
- Sync strategy
- Performance optimization
- Debugging tips

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

```bash
npm run build
npm run start
```

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## License

MIT License - see LICENSE file for details

## Support

For bugs and feature requests, please [open an issue](https://github.com/yourusername/bread-note/issues).

---

Built with ❤️ using Next.js and Turso
