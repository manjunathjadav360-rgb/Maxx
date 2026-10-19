# VYBE — video platform starter

VYBE is a responsive, mobile-first video-sharing website prototype. It is added under `streamtube/` so the existing root `index.html` in this repository is not overwritten.

## Current build

- Responsive desktop/mobile video discovery UI
- Search and category filters
- Video player modal, share action, likes and creator subscriptions
- Sign-up/sign-in UI wired for Supabase Auth when configured
- Upload flow wired for Supabase Storage and the `videos` table when configured
- PostgreSQL schema and Row Level Security policies in `supabase/schema.sql`
- Demo cards shown until a Supabase project is connected

## Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Supabase Auth, Postgres, Storage
- Repository: GitHub
- Hosting: GitHub Pages can host the static frontend; Supabase runs the backend separately

## Run locally

Open `streamtube/index.html` in a browser. The demo feed works without credentials. Authentication, persistent likes/subscriptions, database-backed videos, and uploads require Supabase.

## Connect Supabase

1. Create a Supabase project.
2. Open **SQL Editor** and run all of `streamtube/supabase/schema.sql`.
3. In **Storage**, create a bucket named `videos`. For this starter it is configured as public; do not upload private or sensitive videos.
4. Copy the Project URL and anon/public key from **Project Settings → API**.
5. In `streamtube/index.html`, replace:
   - `YOUR_SUPABASE_PROJECT_URL`
   - `YOUR_SUPABASE_ANON_KEY`
6. Enable email/password authentication in Supabase Auth.
7. Test sign-up, sign-in, video upload, likes, and subscriptions.

**Security:** Only use the Supabase anon/publishable key in browser code. Never put a service-role key, database password, or other secret in this repository. RLS is enabled in the schema, but policies and upload settings must be reviewed before public launch.

## Deploy

The frontend is static and can be hosted on GitHub Pages. Backend features still require the separate Supabase project. The repository's existing homepage is a separate project, so publish the `streamtube/` folder through a dedicated Pages workflow or deploy it to a static host with `streamtube/` as the publish directory.

## Not production-ready yet

- Demo embed links/thumbnails are sample content and must be replaced with content you own or have permission to use.
- No short-video feed, comments UI, recommendations algorithm, creator studio, admin/moderation panel, notifications, or payment integration yet.
- View counts need a secure server-side function; do not trust browser-side counters.
- Add upload progress, file-size/type enforcement, video transcoding, thumbnail generation, rate limiting, reporting, copyright handling, abuse moderation, backups, monitoring, and privacy/legal pages before launch.
- Public video storage is suitable only for public videos. Use private buckets and signed URLs for private/unlisted content.
- For large video hosting at scale, evaluate a dedicated video platform/CDN rather than relying on basic object storage.

## Suggested next milestones

1. Connect Supabase and test account creation.
2. Replace demo cards with real uploaded videos.
3. Add comments, creator profiles, and editable channel pages.
4. Add secure view counting and moderation/reporting.
5. Add upload progress and adaptive streaming.


## Recent reliability fixes
- Watch history is stored locally on the device and can be opened from the History navigation item.
- Comments are available for database-backed uploaded videos.
- View counts use an atomic database function instead of a client-side read/overwrite.
- Auth and like actions surface common failures more safely.
