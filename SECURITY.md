# Security Policy

## Reporting a Vulnerability

Please do not open a public issue for security problems.

Use GitHub private vulnerability reporting on this repository when available:

https://github.com/AngelBuild7/FutClaw/security/advisories/new

If private reporting is not available, contact the repository owner privately.

Please include:

- affected route, endpoint, or file
- reproduction steps
- expected impact
- any proof of concept that does not expose real secrets

## Scope

In scope:

- source code in this repository
- public card/scout/API routes
- setup and self-hosting configuration

Out of scope:

- leaked local tokens or credentials
- denial-of-service against GitHub-backed best-effort endpoints
- dependency scanner output without a working exploit path against FutClaw

## Supported Versions

Only the current `main` branch is supported.
