<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Preview before production

The owner tests every change on the two preview sites before it reaches
production, and nothing merges to production until they say it is verified.

- Website preview: https://preview.minimoatelier.in (minimo-atelier-storefront,
  `preview` branch). Its server talks only to the admin preview.
- Admin preview: https://preview-admin.minimoatelier.in (minimo-inventory,
  `preview` branch, preview database). Test login: OWNER_EMAIL / OWNER_PASSWORD
  in the Vercel preview environment.

For every pull request:

1. Open the PR against the production branch (`main` for minimo-inventory,
   `storefront-v1` for the storefront) as usual.
2. Merge the PR branch into `preview` and push, so the preview site runs it.
   If the change needs both apps, do this in both repos.
3. Check the change on the preview sites yourself, then ask the owner to test
   and give them the preview links.
4. Merge the PR into the production branch only after the owner says it is
   verified. Never push to `main` or `storefront-v1` directly.
5. After a release, merge the production branch back into `preview` so the
   previews match production plus whatever is still being tested.
