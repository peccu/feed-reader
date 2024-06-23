#!/bin/bash
echo npm run build
npm run build 2>&1 \
| sed -ur "s/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]//g" \
| tee build.log
