# Third-party notices

ASIC Explorer original code and teaching assets are MIT licensed. External dependencies retain their own licenses and copyright notices. This repository contains source, examples, screenshots, and teaching assets; installed dependencies, generated builds, and copied editor runtime assets are excluded from Git. `npm ci` obtains the locked packages from npm.

The inventory in [docs/dependency-licenses.json](docs/dependency-licenses.json) records all 148 locked package entries, including optional platform packages. License declarations were checked against the lockfile and installed package metadata on October 12, 2026. Copies of available LICENSE/COPYING/NOTICE files from the installed packages are retained in [licenses/dependencies](licenses/dependencies/). The YoWASP and Yosys ISC notices were obtained from their official repositories.

## Direct dependencies

| Package | Locked version | License | Source |
| --- | --- | --- | --- |
| `3vl` | 1.0.1 | BSD-2-Clause | [Upstream](https://github.com/tilk/js_3vl) |
| `@monaco-editor/react` | 4.7.0 | MIT | [Upstream](https://github.com/suren-atoyan/monaco-react) |
| `@types/node` | 22.20.5 | MIT | [Upstream](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/react` | 19.3.0 | MIT | [Upstream](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/react-dom` | 19.3.0 | MIT | [Upstream](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@yowasp/yosys` | 0.70.62-dev.1236 | ISC | [Upstream](https://github.com/YoWASP/yosys) |
| `digitaljs` | 0.14.2 | BSD-2-Clause | [Upstream](https://github.com/tilk/digitaljs) |
| `elkjs` | 0.11.0 | EPL-2.0 | [Upstream](https://github.com/kieler/elkjs) |
| `lucide-react` | 0.577.0 | ISC | [Upstream](https://github.com/lucide-icons/lucide) |
| `monaco-editor` | 0.55.1 | MIT | [Upstream](https://github.com/microsoft/monaco-editor) |
| `next` | 16.3.8 | MIT | [Upstream](https://github.com/vercel/next.js) |
| `maxmind` | 5.0.7 | MIT | [Upstream](https://github.com/runk/node-maxmind) |
| `pg` | 8.23.1 | MIT | [Upstream](https://github.com/brianc/node-postgres) |
| `react` | 19.3.0 | MIT | [Upstream](https://github.com/react/react) |
| `react-dom` | 19.3.0 | MIT | [Upstream](https://github.com/react/react) |
| `typescript` | 5.9.3 | Apache-2.0 | [Upstream](https://github.com/microsoft/TypeScript) |
| `yosys2digitaljs` | 0.10.3 | BSD-2-Clause | [Upstream](https://github.com/tilk/yosys2digitaljs) |

## Dependencies with separate source-license terms

- **DB-IP City Lite:** October 2026 location data, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), from [DB-IP](https://db-ip.com/db/download/ip-to-city-lite). The ignored MMDB build asset is downloaded with its published checksum verified. History and privacy pages link to DB-IP; no visitor IPs are sent to its service. This data is not covered by the application's MIT license. See [history documentation](docs/HISTORY.md).

- **ELK.js:** EPL-2.0. Its unmodified upstream source is available from https://github.com/kieler/elkjs/tree/v0.11.0 and through its npm package. Preserve the EPL notice and source-access information when redistributing its runtime.
- **JointJS core and directed-graph layout:** MPL-2.0, through the DigitalJS toolchain. Sources are available from https://github.com/clientIO/joint and https://github.com/clientIO/joint-layout-directed-graph; versions are recorded in the inventory. Preserve their notices and applicable source terms.
- **Sharp / libvips:** Next.js includes optional image packages with Apache-2.0, LGPL-3.0-or-later, and other component licenses. Those binaries are not committed here. Source and redistribution information are available from https://github.com/lovell/sharp and https://github.com/libvips/libvips. Retain their component notices when distributing installed binaries.
- **Lucide:** the copied upstream notice includes the icon project's ISC terms and notices for icons derived from Feather under MIT. Some transitive data packages use attribution licenses; see the full inventory and their copied notices.

No third-party library is relicensed by the project MIT license. A dependency metadata inventory is not a substitute for retaining notices and meeting the terms of a binary or hosted distribution. New dependencies and vendored assets must be reviewed separately.
