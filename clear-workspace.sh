#!/bin/bash
clear
rm -rf node_modules/ dist/ build/
rm -rf .DS_Store
rm -rf coverage/
rm -rf .cache/
git rm -r --cached cdk.out/
git gc --prune=now
npm cache clean --force
npm install