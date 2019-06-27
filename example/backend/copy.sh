#!/bin/sh

TARGET="./node_modules/storage-abstraction"
SOURCE="../.."

mkdir -p $TARGET

cp "$SOURCE/package.json" $TARGET
cp "$SOURCE/README.md" $TARGET
cp "$SOURCE/index.ts" $TARGET
cp "$SOURCE/index.d".ts $TARGET
cp "$SOURCE/Storage.ts" $TARGET
cp "$SOURCE/StorageAmazonS3.ts" $TARGET
cp "$SOURCE/StorageGoogleCloud.ts" $TARGET
cp "$SOURCE/StorageLocal.ts" $TARGET
