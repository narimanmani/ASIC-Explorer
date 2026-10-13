# Buildpack snapshot for ASIC Explorer

This branch contains Heroku's official classic Node.js buildpack at upstream commit `baf13a3c963062b874ee1e75c5d50cb8b14806be` from https://github.com/heroku/heroku-buildpack-nodejs.

The sole executable change makes the Node runtime download in `lib/runtimes/nodejs.sh` resumable, with up to six attempts of 90 seconds each. Each new curl invocation resumes from the existing partial file using HTTP range requests. The official download resolver, inventory, SHA-256 checksum validation, TLS checks, dependency installation, and application build behavior are retained. Initial ASIC Explorer builds encountered repeated download stalls; increasing the single-attempt timeout alone did not resolve them.

The upstream LICENSE remains in this branch. This buildpack snapshot is separate from the application's main branch and is pinned by commit in the Heroku app configuration. It does not change the app's synthesis deadline or HTTP request deadlines.
