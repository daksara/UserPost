# Pendar

An AI assistant for **freelance** work. Pendar helps you write and polish client
work - proposals, message replies, price quotes, brief summaries, follow-ups,
social captions, service descriptions, and more - through an AI chat with
ready-to-use templates.

It runs straight from the browser using your own API keys: **Groq** and
**Gemini**, with a model picker that dynamically lists the relevant (chat)
models. No backend - keys are stored only in the browser (localStorage).

> History note: this repo was previously a web3 learning app (wagmi/viem +
> Firebase). That version has been fully replaced by this AI assistant; check
> the git history if you need the old code.

## Stack
- **Frontend**: React 18 + TypeScript + Vite
- **AI**: Groq (OpenAI-compatible) + Gemini (`generativelanguage` API),
  called directly from the browser with streaming
- **PWA**: installable via `vite-plugin-pwa`
- **Hosting**: Vercel / any static host (pure static output)

---

## Getting started

### 1. Install & run
```bash
npm install
npm run dev
```

### 2. Connect AI
Open the **Settings** menu in the app, pick a provider, then paste an API key:
- **Groq** - https://console.groq.com/keys
- **Gemini** - https://aistudio.google.com/app/apikey

The list of relevant models loads automatically from the provider once a key is
entered. Keys are stored in the browser `localStorage` and sent directly to the
provider.

Optionally, default keys can be set at build time via `.env`:
```bash
cp .env.example .env
# fill VITE_GROQ_API_KEY / VITE_GEMINI_API_KEY (optional)
```

### 3. Quality checks
```bash
npm run lint   # ESLint
npm test       # Vitest (AI provider helpers, learn data, components)
npm run build  # typecheck + production build
```
CI (GitHub Actions) runs all three on every push and pull request.

---

## Features
- Bilingual interface - an Indonesia/English toggle in the sidebar switches all
  UI text, the document title, and the learning curriculum (the choice is saved
  in localStorage). AI replies stay adaptive to the language the user types in
- Learn to be a VA from beginner to expert - a tiered curriculum (Beginner,
  Intermediate, Advanced, Expert) with dozens of lessons covering the full range
  of VA skills, plus a path toward a high monthly income. Each lesson is taught
  directly by an AI mentor (playing an experienced senior VA): click "Start
  learning" and the mentor teaches step by step, with real examples and
  exercises. Learning progress is saved in the browser (localStorage)
- Client Practice - a turn-by-turn roleplay where the client speaks and you pick
  the best reply (A/B/C/D). Each option gets a clear, teacher-style explanation
  of why it is right or wrong, and you get a score at the end. Your best score
  per scenario is saved in the browser (localStorage)
- Streaming AI chat with Groq or Gemini
- Persistent conversation history - many conversations stored in the browser
  (localStorage), titles auto-generated from the first message, switch/delete
  from the sidebar
- Dynamic model picker - shows only the relevant chat models
- 8 freelance task templates (proposal, client reply, price quote, brief
  summary, follow-up, social caption, fix/translate, service description)
- One-click copy, stop generation, start a new chat
- Composer with an auto-grow textarea and smart auto-scroll (it does not yank
  you down while you read older history)
- Dark/light theme, responsive (sidebar becomes a drawer on mobile), installable
  PWA

## Security & connection modes
Pendar has two transport modes to the AI provider:

- **Mode A - Bring-your-own-key (default).** Each user pastes their own API key
  in Settings; the key is stored in `localStorage` and sent directly from the
  browser to Groq/Gemini. Good for a **personal tool**. Risk: anyone with access
  to that browser can read the key. Do not set `VITE_GROQ_API_KEY` /
  `VITE_GEMINI_API_KEY` for a public deploy: `VITE_`-prefixed values are bundled
  into the client JS and visible to every visitor - use Mode B.
- **Mode B - Proxy server (recommended for public/multi-user).** Build with
  `VITE_USE_PROXY=1`; the front-end calls `/api/proxy` and the **server**
  injects the key from env (`GROQ_API_KEY` / `GEMINI_API_KEY`). The key is
  **never** in the browser. `api/proxy.ts` is a Vercel Edge Function and
  forwards the chat stream as-is.

  The proxy is locked down so it cannot become an *open relay*: it only accepts
  `POST`, only forwards allow-listed paths (model list + chat), and rejects
  requests from other origins (default: must match the deploy origin; set
  `ALLOWED_ORIGINS` if the front-end is served from a different domain).

  Optionally, per-IP rate limiting can be enabled by setting
  `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (Upstash Redis, free).
  Without both, rate limiting is skipped (fail-open). Thresholds are set via
  `RL_MAX` (requests) & `RL_WINDOW` (seconds); default 30 requests / 60 seconds.

Other security notes: all text is rendered as plain text (no
`dangerouslySetInnerHTML`), so there is no XSS path from AI replies. The existing
`npm audit` vulnerabilities only concern `esbuild`/`vite` during the **dev
server** and are not bundled into the production output.

### Secure deploy to Vercel (Mode B)
```bash
# Environment Variables in the Vercel dashboard:
#   VITE_USE_PROXY = 1            (build-time, read by the front-end)
#   GROQ_API_KEY   = ...          (server-only, do NOT use the VITE_ prefix)
#   GEMINI_API_KEY = ...          (server-only)
vercel
```

## Project structure
```
api/
  proxy.ts          # Vercel Edge Function - key-safe proxy to Groq/Gemini
src/
  ai/
    types.ts        # Provider types + metadata (key url, model fallback)
    providers.ts    # Groq & Gemini clients: listModels + streamChat (direct/proxy)
    templates.ts    # Freelance task templates + system prompts
    clean.ts        # Output cleaner (strips markdown/emoji) + test
    providers.test.ts
  learn/
    curriculum.ts   # Bilingual VA curriculum (beginner->expert) + mentor persona + prompt builders
    progress.ts     # Pure learning-progress helpers (sanitize, per-level, percent)
    scenarios.ts    # Client Practice scenarios (persona + context) + helpers
    roleplay.ts     # Turn-by-turn A/B/C/D roleplay dialogues per scenario
    scores.ts       # Pure quiz-score helpers (best score, mastery)
    curriculum.test.ts, progress.test.ts, scenarios.test.ts, roleplay.test.ts, scores.test.ts
  i18n/
    translations.ts # Indonesia/English UI dictionary + t() helper
    i18n.ts         # Language context + useI18n hook
  chat/
    types.ts        # Conversation types + pure helpers (title, sanitize) + test
  hooks/
    useSettings.ts      # Provider/API key/model saved in localStorage
    useConversations.ts # Persistent conversation history (many chats) in localStorage
    useChat.ts          # Streaming, send, regenerate, cancel
    useLearning.ts      # VA lesson progress saved in localStorage
    useQuizScores.ts    # Best roleplay scores saved in localStorage
    useTheme.ts         # Dark/light theme
  components/
    Sidebar.tsx     # Conversation history + actions (learn VA, language, theme, settings)
    LearnModal.tsx  # VA academy: browse curriculum, progress, lessons, Client Practice
    RoleplayChat.tsx # Turn-by-turn client roleplay with choices + feedback
    Composer.tsx    # Input box: auto-grow + Send/Stop/Regenerate
    MessageBubble.tsx
    SettingsModal.tsx
    ModelPicker.tsx # Dynamic model dropdown
    Logo.tsx, ErrorBoundary.tsx
  App.tsx           # Main shell (sidebar + chat + composer)
  main.tsx
```

## Notes
- By default AI calls are client-side (Mode A). For multi-user production, use
  Mode B (proxy) so API keys are not in the browser - see "Security & connection
  modes".
- Both Groq and Gemini allow direct browser calls (CORS) using the user's key.
