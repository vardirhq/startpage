#!/usr/bin/env bash
# Build the Chrome Web Store upload: dist/startpage-<version>.zip
# Usage: scripts/package.sh   (run from anywhere; needs node and zip)
set -euo pipefail
cd "$(dirname "$0")/.."
node --test test/*.test.js
version=$(node -p "require('./manifest.json').version")
rm -rf dist && mkdir -p dist/ext
cp -r manifest.json app.webmanifest index.html icon.svg icons css js dist/ext/
# MV3 extension pages may not run inline scripts or eval; fail the build if any sneaked in.
if grep -nE '<script>|<script [^>]*>[^<]|\son[a-z]+="' dist/ext/index.html; then echo "inline script found" >&2; exit 1; fi
if grep -rnE '\beval\(|new Function\(' dist/ext/js; then echo "eval found" >&2; exit 1; fi
(cd dist/ext && zip -qr "../startpage-$version.zip" .)

# Firefox: same files, plus the gecko settings AMO requires for Manifest V3 (an add-on ID and the
# data-collection declaration). Nothing is collected by the developer; the optional categories cover
# what the user can choose to send to third-party services (weather, GitHub, the Claude API).
rm -rf dist/firefox && cp -r dist/ext dist/firefox
node -e '
  const fs = require("fs"), f = "dist/firefox/manifest.json", m = JSON.parse(fs.readFileSync(f, "utf8"));
  delete m.minimum_chrome_version; delete m.offline_enabled;
  m.browser_specific_settings = { gecko: { id: "startpage@vardirhq.github.io", strict_min_version: "140.0",
    data_collection_permissions: { required: ["none"], optional: ["locationInfo", "personallyIdentifyingInfo", "personalCommunications", "bookmarksInfo"] } } };
  fs.writeFileSync(f, JSON.stringify(m, null, 2) + "\n");'
(cd dist/firefox && zip -qr "../startpage-$version-firefox.zip" .)
echo "dist/startpage-$version.zip"
echo "dist/startpage-$version-firefox.zip"
