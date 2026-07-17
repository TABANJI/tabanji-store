# TABANJI deployment guide

TABANJI is a static HTML/CSS/JavaScript frontend. It has no build step, package manager, server API or required environment variables. Publish the repository root unchanged.

## Local HTTP testing

Do not test PWA behavior through `file://`. From the project directory, use one of:

```text
python -m http.server 8080
py -m http.server 8080
```

Then open `http://localhost:8080/`. VS Code Live Server is also suitable. Localhost is used only for local testing and is treated as a secure context by browsers.

## Netlify

The included `netlify.toml` sets the repository root as the publish directory and configures redirects, security headers and cache policy.

1. Import the repository or drag the project directory into Netlify Drop.
2. Leave the build command empty.
3. Set the publish directory to `.` if the UI asks for it.
4. After deployment, verify `/contacts.html`, `/categories.html`, `/new.html`, `/profile.html` and `/wishlist.html`.
5. Confirm unknown URLs return `404.html` with HTTP 404 status.

## Vercel

The included `vercel.json` configures redirects and headers without clean URLs or an SPA rewrite.

1. Import the repository as a new project.
2. Select “Other” as the framework preset.
3. Leave the build command empty and output directory as `.`.
4. Deploy and verify the redirect and 404 checks listed above.

## GitHub Pages

Publish from the repository root using GitHub Pages. No Jekyll configuration is required. Relative page, script, stylesheet, manifest and icon paths support a project subpath such as `/tabanji-store/`. `js/pwa.js` registers `./service-worker.js`, so its default scope remains the project directory; `manifest.webmanifest` also uses `./index.html` and `./`.

Limitations:

- GitHub Pages cannot apply `netlify.toml` or `vercel.json` security/cache headers.
- Server-side 301 aliases are unavailable. The existing `contacts.html` and `categories.html` HTML fallbacks still redirect, while other configured host aliases depend on the target host.
- A project-site `404.html` is supported, but the browser address remains the missing URL.
- Never change project-relative paths to root-absolute `/...` paths unless deploying to a custom root domain.

## Production domain TODO

Replace `https://example.invalid` in:

- `robots.txt`;
- every `<loc>` in `sitemap.xml`.

Also replace relative canonical and Open Graph URL placeholders in public HTML with absolute HTTPS URLs after the production origin is known. Keep the OG image URL on the same production origin unless a dedicated asset origin is intentionally configured.

## PWA verification

1. Deploy through HTTPS.
2. Open browser DevTools → Application.
3. Confirm the manifest loads and PNG icons are recognized.
4. Confirm `service-worker.js` controls pages within the deployment scope.
5. Reload once, enable Offline mode, and open a previously visited public page.
6. Confirm an unknown URL is not cached as a successful page.
7. Confirm admin, account, login and checkout are not available from the page cache offline.
8. Deploy a change and verify the “New version available” flow.

## Redirect verification

Use a browser network panel or an HTTP client and verify that host redirects return 301, preserve unrelated query parameters, and do not loop. `product.html?id=...` must remain unchanged. There is intentionally no catch-all rewrite to `index.html`.

## Clearing an old service worker/cache

In DevTools → Application:

1. Open Service Workers and choose Unregister.
2. Open Storage and choose Clear site data.
3. Reload the page twice.

Do this for troubleshooting only; normal updates use the in-app service worker update prompt.

## Rollback

Use the hosting provider’s previous-deployment rollback, or redeploy the last known-good repository revision. After rollback, bump the service worker cache version if cached resources from a broken deployment could remain. Do not delete customer-facing localStorage as part of a normal rollback.

## Production checklist

- [ ] Replace every `example.invalid` placeholder.
- [ ] Make canonical and Open Graph URLs absolute HTTPS URLs.
- [ ] Confirm all local `href` and `src` resources return 200.
- [ ] Confirm real missing URLs return HTTP 404 and render `404.html`.
- [ ] Verify all five aliases and query preservation.
- [ ] Verify response security and cache headers.
- [ ] Confirm `service-worker.js` is served with `Cache-Control: no-cache`.
- [ ] Confirm manifest, icons, offline fallback and update behavior.
- [ ] Confirm utility/private pages return `X-Robots-Tag: noindex, nofollow` on Netlify/Vercel.
- [ ] Keep demo admin credentials clearly identified as demo; never reuse them for real access control.
- [ ] Test forms and confirm no request is sent to an external service.
- [ ] Run Lighthouse and keyboard tests on the deployed HTTPS origin.

## Content Security Policy

A global enforced CSP is intentionally not included yet. Legacy/demo files such as `chat.html` and backup pages still contain inline scripts and styles, so an enforced `script-src 'self'` / `style-src 'self'` policy would break existing pages. Before enforcing CSP, remove or exclude those legacy routes, move their inline code into local files, then test a policy based on:

```text
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
```

Test it as `Content-Security-Policy-Report-Only` on the selected host before enforcement.
