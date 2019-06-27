#!/bin/sh

TARGET="./node_modules/storage-abstraction"
SOURCE="../.."

mkdir -p $TARGET

cp "$SOURCE/package.json" $TARGET
cp "$SOURCE/package-lock.json" $TARGET
cp "$SOURCE/README.md" $TARGET
cp "$SOURCE/index.js" $TARGET
cp "$SOURCE/index.ts" $TARGET
cp "$SOURCE/index.d".ts $TARGET
cp "$SOURCE/Storage.js" $TARGET
cp "$SOURCE/Storage.ts" $TARGET
cp "$SOURCE/StorageAmazonS3.js" $TARGET
cp "$SOURCE/StorageAmazonS3.ts" $TARGET
cp "$SOURCE/StorageGoogleCloud.js" $TARGET
cp "$SOURCE/StorageGoogleCloud.ts" $TARGET
cp "$SOURCE/StorageLocal.js" $TARGET
cp "$SOURCE/StorageLocal.ts" $TARGET
cp -r "$SOURCE/node_modules/" $TARGET
