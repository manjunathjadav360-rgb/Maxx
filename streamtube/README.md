# VYBE — video platform starter

VYBE is a responsive, mobile-first video-sharing website prototype. It is added under `streamtube/` so the existing root `index.html` in this repository is not overwritten.

## Current build

- Responsive desktop/mobile video discovery UI
- Search and category filters
- Video player modal, share action, likes and creator subscriptions
- Sign-up/sign-in UI wired for Supabase Auth when configured
- Upload flow wired for Supabase Storage and the `videos` table when configured
- PostgreSQL schema and Row Level Security policies in `supabase/schema.sql`
- Demo cards remain available as fallback when no database videos are present

## Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Supabase Auth, Postgres, Storage
- Repository: GitHub
- Hosting: GitHub Pages can host the static frontend; Supabase runs the backend separately

## Run locally

Open `streamtube/index.html` in a browser. The demo feed works without credentials. Authentication, persistent likes/subscriptions, database-backed videos, and uploads require Supabase.

## Supabase connection

- Project: `VYBE` (`wxssshmtatilyjktxmji`)
- Region: Mumbai (`ap-south-1`)
- Project URL is configured in `streamtube/index.html` using the public publishable key.
- The database schema has been applied and verified: `profiles`, `videos`, `likes`, `comments`, and `subscriptions`, all with Row Level Security enabled.
- A public Storage bucket named `videos` has been created. Do not upload private or sensitive videos to this bucket.
- Automated Node.js smoke checks now run through GitHub Actions on the development branch and pull requests. Next: verify email/password settings, then test sign-up, sign-in, video upload, likes, subscriptions, and comments in a real browser.

**Security:** Only use the Supabase anon/publishable key in browser code. Never put a service-role key, database password, or other secret in this repository. RLS is enabled in the schema, but policies and upload settings must be reviewed before public launch.

## Deploy

The frontend is static and can be hosted on GitHub Pages. Backend features still require the separate Supabase project. The repository's existing homepage is a separate project, so publish the `streamtube/` folder through a dedicated Pages workflow or deploy it to a static host with `streamtube/` as the publish directory.

## Not production-ready yet

- Demo embed links/thumbnails are sample content and must be replaced with content you own or have permission to use.
- No short-video feed, comments UI, recommendations algorithm, creator studio, admin/moderation panel, notifications, or payment integration yet.
- View counts use a hardened database function: signed-in users can count at most one view per video per account. The function is security-definer, restricted to authenticated users, and checks that the target video is public; review rate-limiting needs before public launch.
- Add upload progress, file-size/type enforcement, video transcoding, thumbnail generation, rate limiting, reporting, copyright handling, abuse moderation, backups, monitoring, and privacy/legal pages before launch.
- Public video storage is suitable only for public videos. Use private buckets and signed URLs for private/unlisted content.
- For large video hosting at scale, evaluate a dedicated video platform/CDN rather than relying on basic object storage.

## Suggested next milestones

1. **Completed:** Create the Supabase project, apply the schema, create the video bucket, and configure the frontend connection.
2. Test account creation and sign-in end-to-end.
3. Test uploads, likes, subscriptions, and comments using real accounts/videos.
4. Add stronger view-count abuse protection and moderation/reporting.
5. Add upload progress and adaptive streaming.


## Recent reliability fixes
- Watch history is stored locally on the device and can be opened from the History navigation item.
- Comments are available for database-backed uploaded videos.
- View counts use an atomic database function instead of a client-side read/overwrite.
- Auth and like actions surface common failures more safely.
