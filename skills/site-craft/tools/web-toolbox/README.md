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

## php74 (portable PHP 7.4.33, for the WordPress agent tests)

Not an npm package: a Windows zip unpacked at `C:\dev\web-toolbox\php\7.4.33\` (outside every repo). The hub's PHP tests
(`hub/test/support/php-bins.mjs`, env `PHP74_BIN`) run the agent on it next to the PATH php (8.3).

- Source: `https://windows.php.net/downloads/releases/archives/php-7.4.33-nts-Win32-vc15-x64.zip`
- SHA-256 (matches windows.php.net `sha256sum.txt` and `releases.json`, checked 2026-10-26):
  `14ae3250d4447c8ccfc4c45a70d90adfbcd61e728d85f0be56a7ddf8f9c8aace`
- Install: `tar -xf <zip>` into the folder, copy `php.ini-development` to `php.ini`, set `extension_dir = "ext"`
  (no extension enabled; the agent needs only core, json, hash, zlib, pcre). Check with `php.exe -v`.
