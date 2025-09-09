#!/bin/bash

set -euxo pipefail

# Create the upload page
rm -rf public/upload
cp -r ../viewer/dist public/upload
python -c "fn='public/upload/index.html';c=open(fn).read().replace('viewer','upload');open(fn,'w').write(c);"

# Create the demo page
if [ -d "demo-data" ]; then
    rm -rf public/demo
    cp -r ../viewer/dist public/demo
    cp -r demo-data public/demo/data
fi
