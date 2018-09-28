#!/bin/bash
cd /home/bjonk/chrome-ext/get_started_complete
echo 'CONTENT:'
~/bin/node/node -c ./content*.js
echo 'BACKGROUND:'
~/bin/node/node -c ./background.js
