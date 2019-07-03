#!/bin/sh

TARGET="./example/backend/src/storage-dev-tmp/"
mkdir -p $TARGET
cp -v ./src/*.ts $TARGET
