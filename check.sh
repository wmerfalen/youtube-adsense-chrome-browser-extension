#!/bin/bash
cd /home/bjonk/chrome-ext/not-interested
echo 'CONTENT:'
~/bin/node/node -c ./content*.js
echo 'BACKGROUND:'
~/bin/node/node -c ./background.js
