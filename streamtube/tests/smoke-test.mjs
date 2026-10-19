import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]);
assert.equal(ids.length, new Set(ids).size, "HTML contains duplicate IDs");

const scripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
assert.ok(scripts.length > 0, "No inline JavaScript found");
for (const [index, script] of scripts.entries()) {
  new Function(script);
  console.log("Inline JavaScript " + (index + 1) + ": syntax OK");
}

const referencedIds = [...html.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map((m) => m[1]);
for (const id of new Set(referencedIds)) {
  assert.ok(ids.includes(id), "Missing HTML element with ID: " + id);
}

assert.match(html, /https:\/\/wxssshmtatilyjktxmji\.supabase\.co/);
assert.match(html, /sb_publishable_/);
assert.doesNotMatch(html, /service_role|sb_secret_|SUPABASE_SERVICE_ROLE_KEY/i);
assert.match(html, /auth\.signUp/);
assert.match(html, /auth\.signInWithPassword/);
assert.match(html, /storage\.from\(["']videos["']\)\.upload/);
assert.match(html, /from\(["']comments["']\)\.insert/);
assert.match(schema, /alter table public\.video_views enable row level security/i);
assert.match(schema, /grant execute on function public\.increment_video_view\(uuid\) to authenticated/i);
assert.doesNotMatch(schema, /grant execute on function public\.increment_video_view\(uuid\) to anon/i);

console.log("VYBE smoke checks passed.");
