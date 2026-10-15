# web-toolbox

Shared Node packages for the browser scripts in this repo (screenshots, contrast/motion checks,
Lighthouse runs, visual diffs, LAN QR codes): `playwright`, `lighthouse`, `pixelmatch`, `pngjs`,
`qrcode`.

The scripts load them from a fixed path that does not depend on the Windows user name:

```js
const require = createRequire(path.join('C:/dev/web-toolbox', 'package.json'));
const { chromium } = require('playwright');
```

This folder holds the manifest only (versions pinned by the lockfile). The installed copy lives at
`C:\dev\web-toolbox`. To (re)build it on any machine:

```powershell
New-Item -ItemType Directory -Force C:\dev\web-toolbox | Out-Null
Copy-Item package.json, package-lock.json C:\dev\web-toolbox
cd C:\dev\web-toolbox; npm ci; npx playwright install chromium webkit
```

History: until 2026-10-09 these packages lived in an old session's temp scratchpad
(`%TEMP%\claude\...\8597f8e7-...\scratchpad`). Windows can clean that folder at any time and it does
not exist on a new machine, so it moved here before the move to the new PC.
