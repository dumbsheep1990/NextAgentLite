#!/bin/bash

wasm-pack build --release --target web

# Copy to the component folder.
TARGET=../../component/src/lib/density_clustering/wasm
rm -rf $TARGET
mkdir $TARGET
cp pkg/*.ts pkg/*.js pkg/*.wasm $TARGET
