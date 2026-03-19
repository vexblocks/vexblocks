# Project instructions

## Workflow
- Do not create git commits. I will do commits myself.
- All tables created for the CMS should start with cms
- Do not run linting or formatting locally. Use pnpm lint or pnpm format:fix from the root of the project instead.

## Linting
- This project uses Biome (not Prettier or ESLint).
- To auto-fix lint errors (including Tailwind class sorting): `npx @biomejs/biome check --write <file>`
- To lint the whole project: `pnpm lint` from the repo root.