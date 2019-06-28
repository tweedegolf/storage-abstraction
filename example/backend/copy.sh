#!/bin/sh

TARGET="./node_modules/storage-abstraction"
SOURCE="../.."

mkdir -p $TARGET

cp "$SOURCE/package.json" $TARGET
cp "$SOURCE/package-lock.json" $TARGET
cp -r "$SOURCE/dist/" $TARGET
cp -r "$SOURCE/node_modules/" $TARGET
