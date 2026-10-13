# Heroku deployment

Heroku application: `asic-explorer-narimanmani`.

Dashboard: https://dashboard.heroku.com/apps/asic-explorer-narimanmani

Assigned URL: https://asic-explorer-narimanmani-a1aa7fa79bdd.herokuapp.com/

This app record is created in the maintainer's personal account. The URL becomes usable after a successful deployment and activation of a web dyno; creating the empty app record alone does not deploy the source.

## Configuration

- Stack: `heroku-24`, US region, classic `heroku/nodejs` buildpack.
- Runtime: Node 22.x, matching the tested LTS line.
- Build: `heroku-postbuild` prepares local Monaco assets and runs the production Next.js build. Dependencies come from the committed npm lockfile.
- Process: `web: npm start`. The launcher uses `PORT` and binds to `0.0.0.0` when `DYNO` is present. Local startup uses loopback and port 4175 by default.
- Formation: one web dyno, without a database, add-on, background worker, or external synthesis service.
- Shared synthesis: one active compilation, at most six starts per minute per process, and a 20-second worker deadline. Request bodies are capped at 24,000 bytes with a five-second read deadline; output is capped at approximately five million characters. These controls are defined in the source rather than secret configuration.

One Basic dyno costs up to **US$7 per month**, prorated by usage, according to [Heroku pricing](https://devcenter.heroku.com/articles/usage-and-billing). An Eco plan has a separate shared-hours subscription and sleep behavior. Choosing a paid formation creates recurring usage charges; do not activate it without the account owner's authorization. Scaling the web process to zero stops its dyno usage and makes the app unavailable.

## Deploy and verify

Use the Heroku CLI while authenticated to the intended account. The repository's `heroku` remote points to this app; `origin` points to GitHub. Deployment uses the committed source, not the local `.next` directory.

```sh
git push heroku main
heroku ps --app asic-explorer-narimanmani
heroku logs --app asic-explorer-narimanmani --num 100
```

The public Node server retains the functional synthesis engine and the locally served editor. No API key or database is needed. Heroku's filesystem is ephemeral; the app does not use it to store student code, simulation progress, or accounts. Source and state remain in the current browser session, without server-side persistence.

Check the hosted API with PowerShell:

```powershell
$env:ASIC_EXPLORER_URL = 'https://asic-explorer-narimanmani-a1aa7fa79bdd.herokuapp.com'
npm run check:api
Remove-Item Env:ASIC_EXPLORER_URL
```

Also open the site in a browser, step the introductory counter, hold with Enable off, request synchronous reset, and synthesize a small edited example. Check the actual circuit and waveform rather than relying only on an HTTP 200 response. The timing and physical-design lessons remain illustrative models, without foundry signoff.

See [SECURITY.md](../SECURITY.md) for known dependency-audit findings and the shared demo's limits. This deployment is intended for small classroom demonstrations; it is not a scalable or isolated online EDA service.
