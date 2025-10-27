DMAPI change for Castingly backfill

Summary
- To enable server-side backfill to PATCH file metadata reliably, the app needs a way to map folder-listed files to DB ids.
- Two simple options (either works):
  1) `/api/files` supports listing for `app_id=castingly` with `user_id=…` (returns DB records with `id`), or
  2) `/api/files` accepts a `storage_key` (or `path`) filter to return the DB record for a known storage key.

Why this matters
- The backfill route enumerates candidates from bucket folders (`/api/buckets/:bucket_id/files`) for an actor and infers `metadata.category` + `metadata.sourceActorId`.
- Patching requires `/api/files/:id` with the DB id. Right now, listing by app/user returns empty (or is disabled), and folder results do not include the DB id.

Suggested API additions

- Expand GET `/api/files` filters:
  - `app_id=<string>` (existing)
  - `user_id=<string>` (existing)
  - `storage_key=<string>` (new; exact match)
  - Optional: `path=<string>` alias for `storage_key`

Example SQL (DMAPI backend)
```sql
-- Add filter in the files list handler
WHERE
  (COALESCE(:app_id, '') = '' OR application_id = :app_id)
  AND (COALESCE(:user_id, '') = '' OR user_id = :user_id)
  AND (COALESCE(:storage_key, '') = '' OR storage_key = :storage_key)
```

Security
- The request is already authenticated via Core; honor `X-Client-Id`/audience for app boundaries.
- `storage_key` is an opaque internal key; matching it to a user/app remains scoped by the token/app.

Outcome
- Castingly’s admin backfill POST will PATCH ids directly with built-in throttling/backoff.
- After normalization, `/api/actors/:id?media=1` hits the fast metadata path and folder fallbacks become a safety net only.

