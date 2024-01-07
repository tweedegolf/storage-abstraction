# setup
rm -rf ./publish/Storage/dist
rm -rf ./publish/AdapterLocal/dist
rm -rf ./publish/AdapterAmazonS3/dist
rm -rf ./publish/AdapterGoogleCloud/dist
rm -rf ./publish/AdapterBackblazeB2/dist
rm -rf ./publish/AdapterAzureBlob/dist
rm -rf ./publish/AdapterMinio/dist

mkdir -p ./publish/Storage/dist
mkdir -p ./publish/AdapterLocal/dist
mkdir -p ./publish/AdapterAmazonS3/dist
mkdir -p ./publish/AdapterGoogleCloud/dist
mkdir -p ./publish/AdapterBackblazeB2/dist
mkdir -p ./publish/AdapterAzureBlob/dist
mkdir -p ./publish/AdapterMinio/dist

# Storage
mv ./publish/dist/Storage* ./publish/Storage/dist
cp ./publish/dist/types* ./publish/Storage/dist
mv ./publish/dist/indexStorage.d.ts ./publish/Storage/dist/index.d.ts
mv ./publish/dist/indexStorage.js ./publish/Storage/dist/index.js
mv ./publish/dist/indexStorage.js.map ./publish/Storage/dist/index.js.map

# AdapterLocal
mv ./publish/dist/AdapterLocal* ./publish/AdapterLocal/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterLocal/dist
cp ./publish/dist/types* ./publish/AdapterLocal/dist
cp ./publish/dist/util* ./publish/AdapterLocal/dist
mv ./publish/dist/indexAdapterLocal.d.ts ./publish/AdapterLocal/dist/index.d.ts
mv ./publish/dist/indexAdapterLocal.js ./publish/AdapterLocal/dist/index.js
mv ./publish/dist/indexAdapterLocal.js.map ./publish/AdapterLocal/dist/index.js.map

# AdapterAmazonS3
mv ./publish/dist/AdapterAmazonS3* ./publish/AdapterAmazonS3/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterAmazonS3/dist
cp ./publish/dist/types* ./publish/AdapterAmazonS3/dist
cp ./publish/dist/util* ./publish/AdapterAmazonS3/dist
mv ./publish/dist/indexAdapterAmazonS3.d.ts ./publish/AdapterAmazonS3/dist/index.d.ts
mv ./publish/dist/indexAdapterAmazonS3.js ./publish/AdapterAmazonS3/dist/index.js
mv ./publish/dist/indexAdapterAmazonS3.js.map ./publish/AdapterAmazonS3/dist/index.js.map

# AdapterGoogleCloud
mv ./publish/dist/AdapterGoogleCloud* ./publish/AdapterGoogleCloud/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterGoogleCloud/dist
cp ./publish/dist/types* ./publish/AdapterGoogleCloud/dist
cp ./publish/dist/util* ./publish/AdapterGoogleCloud/dist
mv ./publish/dist/indexAdapterGoogleCloud.d.ts ./publish/AdapterGoogleCloud/dist/index.d.ts
mv ./publish/dist/indexAdapterGoogleCloud.js ./publish/AdapterGoogleCloud/dist/index.js
mv ./publish/dist/indexAdapterGoogleCloud.js.map ./publish/AdapterGoogleCloud/dist/index.js.map

# AdapterBackblazeB2
mv ./publish/dist/AdapterBackblazeB2* ./publish/AdapterBackblazeB2/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterBackblazeB2/dist
cp ./publish/dist/types* ./publish/AdapterBackblazeB2/dist
cp ./publish/dist/util* ./publish/AdapterBackblazeB2/dist
mv ./publish/dist/indexAdapterBackblazeB2.d.ts ./publish/AdapterBackblazeB2/dist/index.d.ts
mv ./publish/dist/indexAdapterBackblazeB2.js ./publish/AdapterBackblazeB2/dist/index.js
mv ./publish/dist/indexAdapterBackblazeB2.js.map ./publish/AdapterBackblazeB2/dist/index.js.map

# AdapterAzureBlob
mv ./publish/dist/AdapterAzureBlob* ./publish/AdapterAzureBlob/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterAzureBlob/dist
cp ./publish/dist/types* ./publish/AdapterAzureBlob/dist
cp ./publish/dist/util* ./publish/AdapterAzureBlob/dist
mv ./publish/dist/indexAdapterAzureBlob.d.ts ./publish/AdapterAzureBlob/dist/index.d.ts
mv ./publish/dist/indexAdapterAzureBlob.js ./publish/AdapterAzureBlob/dist/index.js
mv ./publish/dist/indexAdapterAzureBlob.js.map ./publish/AdapterAzureBlob/dist/index.js.map

# AdapterMinio
mv ./publish/dist/AdapterMinio* ./publish/AdapterMinio/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterMinio/dist
cp ./publish/dist/types* ./publish/AdapterMinio/dist
cp ./publish/dist/util* ./publish/AdapterMinio/dist
mv ./publish/dist/indexAdapterMinio.d.ts ./publish/AdapterMinio/dist/index.d.ts
mv ./publish/dist/indexAdapterMinio.js ./publish/AdapterMinio/dist/index.js
mv ./publish/dist/indexAdapterMinio.js.map ./publish/AdapterMinio/dist/index.js.map

# cleanup
rm ./publish/dist/*
