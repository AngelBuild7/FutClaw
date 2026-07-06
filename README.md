# FutClaw

Open-source developer cards, scout reports, and repo squads.

FutClaw turns public developer activity into shareable FUT-style identity cards. The open-core app includes the public generation loop, card renderer, story exports, community browser, and RepoClub squads.

## Features

- Generate developer cards from public GitHub profiles.
- Generate RepoClub squads from public GitHub repositories.
- Export cards and story-format images.
- Customize card country, overall, theme, and accent through URL/UI overrides.
- Browse recent community cards when Supabase is configured.
- Run locally or self-host with your own GitHub/Supabase/Redis credentials.

## Quick Start

```bash
npm install
npm run setup
npm run dev
```

Open `http://localhost:3000`.

`npm run setup` creates `.env.local` from `.env.example` if it does not exist. It never overwrites an existing `.env.local`.

## Environment

Live GitHub scouting requires at least one GitHub token:

```env
GITHUB_TOKEN=
```

For token pooling:

```env
GITHUB_TOKENS=token_one,token_two
```

Supabase and Redis are optional for local demos. Without them, FutClaw can still render sample/community fallback data and generate live cards when GitHub tokens are configured.

See `.env.example` for all supported variables.

## Routes

- `/` public generator
- `/[username]` public scout report
- `/u/[username]` canonical scout report implementation
- `/youtube/[username]` public YouTube card route
- `/repo/[owner]/[repo]` RepoClub squad
- `/community` community browser
- `/community/[username]` community card detail
- `/api/card/[username]` JSON card API
- `/api/card-image/[username]` PNG card API

## Open Core Boundary

This repo intentionally excludes the hosted cloud layer: account management, claims, billing, private analytics, and managed revenue verification.

FutClaw Cloud can build on top of this core with hosted portfolios, verified badges, analytics, and managed infrastructure.

## Development

```bash
npm run lint
npm test
npm run build
```

## Security

Never commit `.env.local`, service role keys, GitHub tokens, Redis tokens, or analytics secrets.

Use SSH remotes for GitHub pushes:

```bash
git remote set-url origin git@github.com:YOUR_USER/YOUR_REPO.git
```

## License

MIT
