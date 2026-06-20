# Contributing to dashAI

Thanks for your interest! dashAI is an open demonstration of a tamper-evident,
AI-assisted dashcam for Indonesian traffic enforcement and driver protection.

## Development

```bash
pnpm install
pnpm dev
pnpm typecheck   # tsc --noEmit
pnpm build       # production build
pnpm lint
```

## Ground rules

- **TypeScript strict** — keep `pnpm typecheck` green.
- **Legal accuracy is sacred.** `lib/legal/citations.ts` is *generated* from a
  verified research workflow — do not hand-edit it. To change citations, update
  the research process and regenerate, keeping `verified`/`sources` intact.
- **Honesty in claims.** Never describe dashAI as tamper-*proof*. Never add face
  recognition. Keep privacy-by-design (detect + blur).
- **Match the design system** (forensic terminal: Archivo + JetBrains Mono;
  signal-red / amber / verified-green) and write UI copy in Bahasa Indonesia.
- Keep modules focused and well-typed; prefer small, testable units.

## Commit / PR

- Describe the *why*, not just the *what*.
- Ensure typecheck + build pass before opening a PR.
- For security-sensitive changes, see [SECURITY.md](SECURITY.md).
