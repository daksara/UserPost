# UserPost

Social feed where posts disappear in 24 hours. Built with React + Vite + Supabase.

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **Hosting**: Vercel (recommended)

---

## Setup

### 1. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Save your **Project URL** and **anon key** (Settings > API)

### 2. Run the schema
1. Supabase Dashboard → **SQL Editor**
2. Paste and run the contents of `supabase/schema.sql`
3. Go to **Database → Replication** → enable realtime for: `posts`, `comments`, `messages`

### 3. Configure env
```bash
cp .env.example .env
# Edit .env and fill in your Supabase URL and anon key
```

### 4. Install and run
```bash
npm install
npm run dev
```

### 5. Deploy to Vercel
```bash
npm install -g vercel
vercel
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment variables
```

---

## Features
- ✅ Auth (username + password, no email needed)
- ✅ Feed with 24-hour auto-expiring posts
- ✅ Contract address attachment + copy button
- ✅ Comments
- ✅ Direct messages with reply support
- ✅ Realtime updates (feed, messages)
- ✅ Mobile-first UI

## Project Structure
```
src/
  lib/supabase.ts      # Supabase client + all DB helpers
  hooks/
    useAuth.tsx        # Auth context
    useRealtime.ts     # Realtime subscription hook
  pages/
    AuthPage.tsx       # Sign in / Sign up
    FeedPage.tsx       # Main feed + compose
    MessagesPage.tsx   # DMs + thread view
    ProfilePage.tsx    # Profile + sign out
  App.tsx              # Root + tab navigation
  index.css            # Full design system
supabase/
  schema.sql           # Run this in Supabase SQL Editor
```
