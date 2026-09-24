@AGENTS.md

# SENSE — project conventions

Beta prototype of SENSE (corporate training + social co-learning app for Power Electronics). See README.md for the
product, demo accounts and what is simulated. Visual source of truth: `assets/reference/` (mockups from the diary).

## Commands

- `npm run check` — typecheck + lint + tests. Run before every commit.
- `npx expo start` — dev server (Expo Go / emulator / `w` for web).
- Install native deps with `npx expo install <pkg>` (use `EXPO_OFFLINE=1` if api.expo.dev is unreachable).

## Architecture rules

- Routes only in `src/app/`; everything else in `src/modules/<domain>` (university, training, social, ai, auth, admin)
  or `src/shared/components`. Route files export only the default screen component.
- Screens never touch data directly: use hooks from `src/hooks/api.ts`, which call `api` (`src/services`).
  New data needs: add to the interface in `src/services/types.ts`, implement in `src/services/mock/index.ts`,
  add a hook with proper query key + invalidation. Keep `supabase/schema.sql` in sync with `src/types/domain.ts`.
- Pure logic (scoring, progress, challenges, licensing, AI) lives in plain TS modules with Jest tests in
  `src/__tests__`. Keep it framework-free.
- AI goes through the `RecommendationEngine` interface (`src/modules/ai`); every recommendation carries `reasons`.
- Star ratings are private: only the author, instructors and admins may read them (enforced in the service).

## UI conventions

- Tokens from `src/theme` only (colors sampled from the mockups: primary `#1E88C4`, navy `#06205B`, CTA orange
  `#FE6320`). Poppins via `fonts.*`. No hard-coded colors except illustration SVGs.
- Reuse `SegmentedTabs` (blue active / dark inactive), `Header` (home + back + breadcrumb), `CTAButton` (orange),
  `ModuleCard`, `ProgressRing`, `ParameterTile`, `AnnotationToolbar`.
- All user-facing strings through i18next (`useI18n()`): add keys to both `src/i18n/en.ts` and `es.ts`
  (es is type-checked against en). Seed content uses `Localized` `{ en, es }`, resolved with `tr()`.
- English is the default UI language (as in the mockups).
- React Compiler lint rules are on: no `ref.current` during render. Use `useState(() => new Animated.Value(0))`
  and closure variables inside `PanResponder` created in a `useState` initializer; derive state instead of
  syncing it in effects.
- Add `testID`s to primary actions; web screenshots via Playwright are used to verify screens.

## Git

- Small, descriptive commits. Do not modify original documentation files; exported reference images go to
  `assets/reference/`.
