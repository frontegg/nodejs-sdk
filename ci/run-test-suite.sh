#!/usr/bin/env bash

set -e

docker compose -p nodejs-sdk-tests up -d --wait

npm run --prefix ../ test:jest --coverage
RESULT=$@

docker compose -p nodejs-sdk-tests down

exit $RESULT
