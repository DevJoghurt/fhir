#!/bin/bash

set -e

# Restore all git changes
git restore -s@ -SW  -- packages

# Build all once to ensure things are nice
pnpm build

# Update token
if [[ ! -z ${NPM_TOKEN} ]] ; then
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> ~/.npmrc
  echo "registry=https://registry.npmjs.org/" >> ~/.npmrc
  echo "always-auth=true" >> ~/.npmrc
  npm whoami
fi

# Release packages
for PKG in packages/* ; do
  pushd $PKG
  TAG="latest"
  echo "⚡ Publishing $PKG with tag $TAG"
  cp ../../LICENSE .
  cp ../../README.md .
  pnpm publish --access public --no-git-checks --tag $TAG
  popd > /dev/null
done