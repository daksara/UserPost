# Onramp

Platform belajar web3 dengan langsung praktik on-chain. Tiap lesson
mengajarkan satu skill (connect wallet, baca data, kirim transaksi, dll)
lewat aksi nyata di testnet — bukan sekadar teori. Dibangun dengan
React + Vite + wagmi + viem.

> Catatan: repo ini sebelumnya bernama "UserPost" (social feed). Kode app
> sosial lama masih ada (`src/App.tsx`, `src/pages/{Feed,Messages,Profile}Page.tsx`,
> `src/lib/firebase.ts`) untuk rujukan; entry point sekarang `src/LearnApp.tsx`.

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Web3**: wagmi v3 + viem (target chain: Base Sepolia testnet)
- **Backend (warisan app lama)**: Firebase (Firestore + Auth + Storage)
- **Hosting**: Vercel or Firebase Hosting

---

## Setup

### 1. Create a Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com) → Add project
2. Enable **Authentication → Email/Password**
3. Enable **Firestore Database** and **Storage**
4. Add a **Web app** (Project Settings → Your apps) and copy its config

### 2. Configure env
```bash
cp .env.example .env
# Fill in the VITE_FIREBASE_* values from your web app config
```

### 3. Deploy security rules and indexes
Security rules live in `firestore.rules` and `storage.rules` and **must** be
deployed — without them nothing enforces ownership or badge permissions.

**Option A — from the browser (no CLI):** Firebase Console → Firestore
Database → Rules → paste the contents of `firestore.rules` → Publish. Repeat
for Storage → Rules with `storage.rules`. Enable the TTL policy under
Firestore → TTL (collection `posts`, field `expires_at`).

**Option B — GitHub Actions:** add the `FIREBASE_SERVICE_ACCOUNT` repository
secret (JSON key from Project settings → Service accounts → Generate new
private key); the "Deploy Firebase rules" workflow then deploys automatically
whenever rule files change on `main`, or on demand from the Actions tab.

**Option C — local CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore,storage
```

`firestore.indexes.json` includes the composite indexes the feed and message
queries need, plus a **TTL policy** on `posts.expires_at` so expired posts are
deleted automatically by Firestore (the client also filters them out while
they wait for garbage collection).

### 4. Install and run
```bash
npm install
npm run dev
```

### 5. Quality checks
```bash
npm run lint   # ESLint
npm test       # Vitest unit tests
npm run build  # typecheck + production build
```
CI (GitHub Actions) runs all three on every push and pull request.

### 6. Deploy to Vercel
```bash
npm install -g vercel
vercel
# Add the VITE_FIREBASE_* variables as environment variables
```

---

## Features
- ✅ Auth (email + password, username as public identity, email verification)
- ✅ Feed with 24-hour auto-expiring posts
- ✅ Contract address / link attachment with allowlisted domains
- ✅ Comments + likes with rule-enforced counters
- ✅ Direct messages with replies, read receipts, soft delete
- ✅ Realtime updates (feed, messages)
- ✅ Badge system (verified accounts can grant badges)
- ✅ Mobile-first UI, light/dark theme

## Data model

| Collection | Purpose |
|---|---|
| `profiles/{uid}` | Public profile (username, bio, badge, avatar URL) |
| `usernames/{username}` | Username → uid index for uniqueness checks (`{ uid }` only — no email, it is publicly readable) |
| `posts/{postId}` | Posts with `expires_at` (24h TTL) and denormalized `like_count` / `comment_count` |
| `posts/{postId}/comments/{commentId}` | Comments |
| `users/{uid}/liked_posts/{postId}` | Per-user like marks |
| `users/{uid}/inbox/{partnerUid}` | Latest-message pointer per conversation (unread badge) |
| `conversations/{uidA_uidB}/messages/{msgId}` | Direct messages (conversation id = sorted uid pair) |

## Project structure
```
src/
  lib/
    firebase.ts        # Firebase client + all DB helpers
    utils.ts           # Pure helpers (tested in utils.test.ts)
  hooks/useAuth.tsx    # Auth context
  components/          # Avatar, Badge, ErrorBoundary
  pages/
    AuthPage.tsx       # Sign in / sign up / reset password
    FeedPage.tsx       # Main feed + compose
    MessagesPage.tsx   # DMs + thread view
    ProfilePage.tsx    # Profile, settings, account deletion
  App.tsx              # Root + tab navigation (hash-routed)
firestore.rules        # Firestore security rules
firestore.indexes.json # Composite indexes + TTL policy
storage.rules          # Storage security rules
```

## Notes
- **Sign-in** accepts email or username. New accounts reset passwords with
  their email; the username index no longer stores emails (accounts that
  still have one keep working until migrated).
- **Badges**: only accounts with `is_verified: true` can grant/revoke badges —
  enforced by Firestore rules, not just the UI.
- Accounts created before email was required use a legacy synthetic email
  (`up.<username>@userpost.app`) and skip email verification.
