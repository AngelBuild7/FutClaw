# Contributing to FutClaw

Thanks for helping improve FutClaw. Good contributions include scoring fixes, card rendering improvements, accessibility, docs, tests, and new public-data integrations.

## Getting Started

FutClaw is a Next.js App Router app in TypeScript, styled with Tailwind. You'll need Node 20+ and npm.

```bash
git clone https://github.com/AngelBuild7/FutClaw.git
cd FutClaw
npm install
npm run setup
npm run dev
```

Open `http://localhost:3000`.

The app can run without Supabase or Redis. Live GitHub scouting requires a read-only GitHub token in `.env.local`.

## Environment

Never commit `.env.local`.

Use `.env.example` as the template:

```env
GITHUB_TOKEN=
GITHUB_TOKENS=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

For GitHub tokens, use read-only permissions. No write scopes are needed for public scouting.

## Before Opening a PR

Run:

```bash
npm run lint
npm test
npm run build
```

Add or update tests for scoring, parsing, URL overrides, and other pure logic.

## Scope

This repo is the open-core app. Please keep account management, claims, billing, private analytics, and managed cloud-only features out of this repository.

## Style

- Keep PRs focused.
- Match the surrounding code.
- Prefer clear, boring logic for scoring and data parsing.
- Include screenshots for visual/card changes.
- Use Conventional Commits when possible.

## Security

Do not open public issues for security reports. See [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the project [LICENSE](./LICENSE).
