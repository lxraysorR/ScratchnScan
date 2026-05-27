# Storage Plan: Supabase Durable + IndexedDB Fallback

## Durable source of truth
- Target durable store: **Supabase**
  - table: `scratch_recipes`
  - table: `scratch_recipe_media`
  - storage bucket: `scratch-recipe-media`

## Local fallback/cache
- IndexedDB remains enabled for:
  - guest/local-only saves
  - temporary drafts and previews
  - offline recovery
  - pending sync queue metadata (`syncStatus`, `remoteId`, `lastSyncError`)

## Media policy
- Do **not** store full base64 package photos in durable recipe JSON.
- Durable records should keep media references only:
  - `storageBucket`
  - `storagePath`
  - `mediaRole` (`front_package`, `back_label`, `thumbnail`)

## Security
- Frontend may only use Supabase anon/public config values.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.
- No service role key appears in frontend app files.

## Env configuration
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Migration/compatibility
- Existing local records with embedded `data:image/...` previews continue rendering.
- When durable mode is configured, save path strips embedded image data and stores media refs with `syncStatus: pending` until server-side sync/upload is implemented.

## Next implementation steps
1. Wire authenticated Supabase client/provider to `recipeStorage`.
2. Implement media upload API (server-side signed upload path preferred).
3. Add sync job for `pending` local records.
4. Add RLS owner policies once auth is enabled.
