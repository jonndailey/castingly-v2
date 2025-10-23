# Castingly × DMAPI × Core — Integration Status (Oct 23, 2025)

## Summary

- Core login is working (slug-based, RS256 + JWKS).
- Actor profile API returns 200 with a minimal profile when no legacy row exists; media is sourced from DMAPI (public headshots via bucket listing; private resumes via proxy).
- Forum queries updated to use `name` + `avatar_url`; endpoints require authentication.
- DMAPI currently accepts Core tokens with relaxed audience; plan is to pin `CORE_AUDIENCE` and remove relaxed mode.
- DMAPI uploads succeed to storage; add `ensureApplication('castingly')` to avoid occasional DB FK failures and populate `/api/files` reliably.

## Required Env (Castingly server)

- Core: `DAILEY_CORE_AUTH_URL`, `DAILEY_CORE_APP_SLUG`, `DAILEY_CORE_TENANT_SLUG`
- DMAPI: `DMAPI_BASE_URL`, `DMAPI_SERVICE_EMAIL`, `DMAPI_SERVICE_PASSWORD`, optional `DMAPI_LIST_USER_ID`
- DB tunnel: `DB_HOST=127.0.0.1`, `DB_PORT=3307` + credentials

## Serving Private Files

- Use `GET /api/media/proxy?bucket=castingly-private&userId=<service_subject>&path=actors/<actorId>/resumes&name=<file>` to stream private documents from DMAPI using the server service token.

## Next Hardening

- DMAPI: set `CORE_AUDIENCE=<Castingly Core app_id>`, remove `ALLOW_CORE_ANY_AUD`.
- DMAPI: ensure application row is present before inserting `media_files` (small patch in `databaseService.js`).
- Castingly: keep proxy-based serving for private files; continue using DMAPI direct serve for public content.

## Verification

- Core token (demo actor): `/api/actors/1cf9...` → 200 with minimal profile and headshots; forum endpoints → 401 when unauthenticated.
- UI: agent roster/manage uses Authorization on actor fetches; upload calls hit `/api/media/actor/:actorId/upload`.

