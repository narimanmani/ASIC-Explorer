# Private visitor history

The owner page is **`/history`**. It shows sampled visit times, anonymous visitor IDs, lesson names, broad browser labels, and approximate city/region/country. Period and lesson filters and 100-row pagination help review recent activity. Sign out ends the current browser session. There is no public history feed.

**Live:** [Open private history](https://asic-explorer-narimanmani-a1aa7fa79bdd.herokuapp.com/history). Activated with account-owner approval on October 12, 2026, using one Essential-0 PostgreSQL database. Live private-access, visitor capture/location, privacy opt-out, and persistence checks passed. The README's preview is local test data; live visitor records and screenshots are kept private.

## Privacy and interpretation

- Location is an **IP estimate**, not GPS or proof of physical location. VPNs, shared networks, proxies, and bots can change it. Unknown locations remain unknown.
- A signed, HttpOnly first-party cookie contains a random visitor identifier, with a maximum 30-day lifetime. The database stores its keyed digest. Counts describe browser identifiers, not identified people; clearing/blocking cookies affects the counts.
- Raw IPs are used transiently for local geolocation and are not saved in the history table. No visitor IP is sent to an external geolocation API. Raw headers, referrers, query strings, entered HDL, GPS coordinates, and simulation results are excluded.
- Sampling is one observation per visitor/lesson/15-minute bucket. Records older than 30 days are removed on the next history read or write; the table is capped at 20,000 records. Records do not survive a disabled collection period retroactively. Hosting logs and database backups have separate provider lifecycles.
- The visitor endpoint is bounded to 1,024 bytes and has request-start limits. Location lookups run in a short-lived child process, one at a time, with a five-second deadline; unavailable/busy lookups are explicitly labeled. Collection failures leave the teaching controls usable.
- The public app shows a recording notice and links to `/privacy`. Global Privacy Control and Do Not Track requests are excluded. No third-party analytics script is installed.

The **October 2026 DB-IP City Lite** database is downloaded from [DB-IP's official page](https://db-ip.com/db/download/ip-to-city-lite), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Its published SHA-1 checksum applies to the uncompressed MMDB and is verified before use. The history and privacy pages provide the required DB-IP link. This pinned snapshot must be deliberately updated; it does not refresh automatically or guarantee accuracy. The database is an ignored build asset, not source committed to GitHub.

## Access protection

The owner password is stored only as a salted scrypt hash. Sessions are HMAC-signed, purpose-separated from visitor cookies, HttpOnly, SameSite Strict, limited to `/history`, and expire after four hours. Cookies are Secure on the HTTPS deployment. Rotating the password hash or signing secret invalidates existing tokens. Sign-out removes the current browser cookie; copied session tokens remain valid until expiry/rotation, so keep them private.

All history reads check authentication before accessing storage. `/history/data` returns 401 without a valid owner session. Protected routes use private/no-store caching, no-referrer, noindex, and frame-denial headers. Login/logout and visitor capture require the configured exact origin. Sign-in attempts are limited per transient keyed network address and globally, with at most one active password derivation; these process-local budgets reset on restart and are not distributed authentication controls. The configured origin is never taken from a visitor-supplied host header.

Heroku capture uses only the **rightmost valid** forwarding entry appended by Heroku's router. Outside Heroku, forwarding headers are ignored; local visits have no network location. The app must remain directly behind Heroku for this policy. Adding a CDN/proxy requires a fresh boundary review.

## Configuration

History is **off by default**, and fails closed without a strong password hash, signing secret, and appropriate storage. Credentials never belong in source control.

```sh
npm run history:setup
npm run geoip:prepare
```

The setup script creates `config.json` and `access.txt` under the current user's `.codex/private/asic-explorer-history` directory, outside the repository, and does not print the password. It refuses to overwrite existing files. On Windows, restrict this directory's ACL to the owner and SYSTEM; file mode flags alone do not establish Windows access restrictions.

Set these server-only variables using the generated configuration:

| Variable | Purpose |
| --- | --- |
| `HISTORY_ENABLED=true` | Explicitly enables collection when access/storage are ready. |
| `HISTORY_PASSWORD_HASH` | Generated salted scrypt password hash. |
| `HISTORY_SECRET` | Generated random signing key, at least 32 bytes encoded as hex. |
| `HISTORY_SITE_ORIGIN` | Exact browser origin; HTTPS is required on Heroku. |
| `DATABASE_URL` | Persistent PostgreSQL connection, supplied by the approved Heroku add-on. |
| `HISTORY_DATABASE_PROVIDER=heroku` | Uses Heroku's documented self-signed TLS configuration, only on Heroku. Other providers retain certificate validation. |
| `HISTORY_LOCAL=true` | Enables local SQLite only outside Heroku. |
| `HISTORY_LOCAL_FILE` | Optional local database path; default `.data/visitor-history.sqlite`. |
| `HISTORY_GEOIP_FILE` | Optional MMDB path; default `.data/dbip-city.mmdb`. |
| `HISTORY_DATABASE_CA` | Optional certificate authority for a non-Heroku PostgreSQL provider. |

The initial setup origin is `http://127.0.0.1:4177` for the review preview. Change it to match the actual local or hosted origin. Local SQLite is an explicitly enabled development option; Heroku never falls back to its ephemeral disk for visitor history.

Heroku deployment prepares the licensed MMDB before building Next.js. PostgreSQL schema and indexes initialize on first use, with parameterized writes/filters and a pool capped at three connections. Heroku database connections use encrypted TLS with its documented self-signed-certificate configuration; other providers retain certificate validation. See [Heroku's connection guidance](https://devcenter.heroku.com/articles/connecting-heroku-postgres) for this provider-specific limitation.

## Hosting cost and activation

The Basic web dyno costs up to US$7/month. Permanent history uses an **Essential-0 PostgreSQL database**, [currently US$5/month](https://elements.heroku.com/addons/heroku-postgresql), for a combined maximum of approximately **US$12/month**, prorated by use. The account owner explicitly approved this additional database on October 12, 2026. There are no other add-ons.

For a separate installation, local checks do not mean collection is live. Obtain its owner's database-cost approval, provision the app's own database, set private server configuration, deploy, and verify unauthenticated access, a real new visit, location lookup, sign-in, filters, sign-out, and persistence across a server restart. Do not reuse another project's database or expose database credentials. Earlier visitors cannot be recovered.
