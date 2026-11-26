#!/usr/bin/env bash
# Render the site and publish the rendered output as the content of the `main` branch.
# Run from the repository root on the `source` branch.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "source" ]; then
  echo "Run this on the 'source' branch (current: $branch)." >&2
  exit 1
fi

quarto render
touch _site/.nojekyll
# Custom domain: GitHub Pages needs CNAME in the published branch, otherwise the domain stops working.
if [ ! -s _site/CNAME ]; then
  echo "_site/CNAME is missing – refusing to publish (the custom domain would be lost)." >&2
  exit 1
fi

remote=$(git remote get-url origin)
msg="Publish site from source $(git rev-parse --short HEAD)"
tmp=$(mktemp -d)
cp -R _site/. "$tmp/"
cd "$tmp"
git init -q -b main
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name || echo publisher)" \
    -c user.email="$(git -C "$OLDPWD" config user.email || echo publisher@localhost)" \
    commit -q -m "$msg"
git push -f "$remote" main
cd - >/dev/null
rm -rf "$tmp"
echo "Published to main."
