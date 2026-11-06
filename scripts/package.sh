#!/usr/bin/env bash
# Build the Chrome Web Store upload: dist/startpage-<version>.zip
# Usage: scripts/package.sh   (run from anywhere; needs node and zip)
set -euo pipefail
cd "$(dirname "$0")/.."
node --test test/*.test.js
version=$(node -p "require('./manifest.json').version")
rm -rf dist && mkdir -p dist/ext
cp -r manifest.json index.html icon.svg icons css js dist/ext/
# MV3 extension pages may not run inline scripts or eval; fail the build if any sneaked in.
if grep -nE '<script>|<script [^>]*>[^<]|\son[a-z]+="' dist/ext/index.html; then echo "inline script found" >&2; exit 1; fi
if grep -rnE '\beval\(|new Function\(' dist/ext/js; then echo "eval found" >&2; exit 1; fi
(cd dist/ext && zip -qr "../startpage-$version.zip" .)
echo "dist/startpage-$version.zip"
