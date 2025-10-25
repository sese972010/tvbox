#!/bin/bash
set -e

echo "--- INSTALLING DEPENDENCIES ---"
npm install

echo "--- UPLOADING SECRET TO WORKER ---"
cd ./backend
echo $GH_TOKEN | npx wrangler secret put GH_TOKEN
cd ..

echo "--- DEPLOYING WORKER API ---"
cd ./backend
# 【核心修正】: 不再让wrangler自动寻找，而是明确告诉它要部署哪个文件
npx wrangler deploy src/index.js
cd ..

echo "--- DEPLOYING FRONTEND UI ---"
npx wrangler pages deploy frontend --project-name=tvbox-ui

echo "--- DEPLOYMENT COMPLETE ---"
