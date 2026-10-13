# Buildpack snapshot for ASIC Explorer

This branch contains Heroku's official classic Node.js buildpack at upstream commit `baf13a3c963062b874ee1e75c5d50cb8b14806be` from https://github.com/heroku/heroku-buildpack-nodejs.

The sole executable change increases the Node runtime download timeout in `lib/runtimes/nodejs.sh` from 30 to 180 seconds. The official download resolver, inventory, SHA-256 checksum validation, TLS checks, retry policy, dependency installation, and application build behavior are retained. The first ASIC Explorer deployment encountered six download timeouts before obtaining the runtime archive.

The upstream LICENSE remains in this branch. This buildpack snapshot is separate from the application's main branch and is pinned by commit in the Heroku app configuration. It does not change the app's synthesis deadline or HTTP request deadlines.
