# setup
rm -rf ./publish/Storage/dist
rm -rf ./publish/AdapterLocal/dist
rm -rf ./publish/AdapterAmazonS3/dist
rm -rf ./publish/AdapterGoogleCloud/dist
rm -rf ./publish/AdapterBackblazeB2/dist
rm -rf ./publish/AdapterAzureBlob/dist
rm -rf ./publish/AdapterMinio/dist

mkdir -p ./publish/Storage/dist/types
mkdir -p ./publish/AdapterLocal/dist/types
mkdir -p ./publish/AdapterAmazonS3/dist/types
mkdir -p ./publish/AdapterGoogleCloud/dist/types
mkdir -p ./publish/AdapterBackblazeB2/dist/types
mkdir -p ./publish/AdapterAzureBlob/dist/types
mkdir -p ./publish/AdapterMinio/dist/types

mkdir -p ./publish/Storage/dist/index
mkdir -p ./publish/AdapterLocal/dist/index
mkdir -p ./publish/AdapterAmazonS3/dist/index
mkdir -p ./publish/AdapterGoogleCloud/dist/index
mkdir -p ./publish/AdapterBackblazeB2/dist/index
mkdir -p ./publish/AdapterAzureBlob/dist/index
mkdir -p ./publish/AdapterMinio/dist/index

# Storage
cp ./publish/dist/types/general* ./publish/Storage/dist/types
cp ./publish/dist/types/result* ./publish/Storage/dist/types
cp ./publish/dist/types/add_file_params* ./publish/Storage/dist/types

mv ./publish/dist/Storage* ./publish/Storage/dist
mv ./publish/dist/indexes/Storage.d.ts ./publish/Storage/dist/index/index.d.ts
mv ./publish/dist/indexes/Storage.js ./publish/Storage/dist/index/index.js
mv ./publish/dist/indexes/Storage.js.map ./publish/Storage/dist/index/index.js.map

# AdapterLocal
cp ./publish/dist/AbstractAdapter* ./publish/AdapterLocal/dist
cp ./publish/dist/util* ./publish/AdapterLocal/dist

cp ./publish/dist/types/general* ./publish/AdapterLocal/dist
cp ./publish/dist/types/result* ./publish/AdapterLocal/dist
cp ./publish/dist/types/add_file_params* ./publish/AdapterLocal/dist
cp ./publish/dist/types/adapter_local* ./publish/AdapterLocal/dist

mv ./publish/dist/AdapterLocal* ./publish/AdapterLocal/dist
mv ./publish/dist/indexes/AdapterLocal.d.ts ./publish/AdapterLocal/dist/index.d.ts
mv ./publish/dist/indexes/AdapterLocal.js ./publish/AdapterLocal/dist/index.js
mv ./publish/dist/indexes/AdapterLocal.js.map ./publish/AdapterLocal/dist/index.js.map

# AdapterAmazonS3
cp ./publish/dist/AbstractAdapter* ./publish/AdapterAmazonS3/dist
cp ./publish/dist/util* ./publish/AdapterAmazonS3/dist

cp ./publish/dist/types/general* ./publish/AdapterAmazonS3/dist
cp ./publish/dist/types/result* ./publish/AdapterAmazonS3/dist
cp ./publish/dist/types/add_file_params* ./publish/AdapterAmazonS3/dist
cp ./publish/dist/types/adapter_amazon_s3* ./publish/AdapterAmazonS3/dist

mv ./publish/dist/AdapterAmazonS3* ./publish/AdapterAmazonS3/dist
mv ./publish/dist/indexes/AdapterAmazonS3.d.ts ./publish/AdapterAmazonS3/dist/index.d.ts
mv ./publish/dist/indexes/AdapterAmazonS3.js ./publish/AdapterAmazonS3/dist/index.js
mv ./publish/dist/indexes/AdapterAmazonS3.js.map ./publish/AdapterAmazonS3/dist/index.js.map

# AdapterGoogleCloud
cp ./publish/dist/AbstractAdapter* ./publish/AdapterGoogleCloud/dist
cp ./publish/dist/util* ./publish/AdapterGoogleCloud/dist

cp ./publish/dist/types/general* ./publish/AdapterGoogleCloud/dist
cp ./publish/dist/types/result* ./publish/AdapterGoogleCloud/dist
cp ./publish/dist/types/add_file_params* ./publish/AdapterGoogleCloud/dist
cp ./publish/dist/types/adapter_google_cloud* ./publish/AdapterGoogleCloud/dist

mv ./publish/dist/AdapterGoogleCloud* ./publish/AdapterGoogleCloud/dist
mv ./publish/dist/indexes/AdapterGoogleCloud.d.ts ./publish/AdapterGoogleCloud/dist/index.d.ts
mv ./publish/dist/indexes/AdapterGoogleCloud.js ./publish/AdapterGoogleCloud/dist/index.js
mv ./publish/dist/indexes/AdapterGoogleCloud.js.map ./publish/AdapterGoogleCloud/dist/index.js.map

# AdapterBackblazeB2
cp ./publish/dist/AbstractAdapter* ./publish/AdapterBackblazeB2/dist
cp ./publish/dist/util* ./publish/AdapterBackblazeB2/dist

cp ./publish/dist/types/general* ./publish/AdapterBackblazeB2/dist
cp ./publish/dist/types/result* ./publish/AdapterBackblazeB2/dist
cp ./publish/dist/types/add_file_params* ./publish/AdapterBackblazeB2/dist
cp ./publish/dist/types/adapter_backblaze_b2* ./publish/AdapterBackblazeB2/dist

mv ./publish/dist/AdapterBackblazeB2* ./publish/AdapterBackblazeB2/dist
mv ./publish/dist/indexes/AdapterBackblazeB2.d.ts ./publish/AdapterBackblazeB2/dist/index.d.ts
mv ./publish/dist/indexes/AdapterBackblazeB2.js ./publish/AdapterBackblazeB2/dist/index.js
mv ./publish/dist/indexes/AdapterBackblazeB2.js.map ./publish/AdapterBackblazeB2/dist/index.js.map

# AdapterAzureBlob
cp ./publish/dist/AbstractAdapter* ./publish/AdapterAzureBlob/dist
cp ./publish/dist/util* ./publish/AdapterAzureBlob/dist

cp ./publish/dist/types/general* ./publish/AdapterAzureBlob/dist
cp ./publish/dist/types/result* ./publish/AdapterAzureBlob/dist
cp ./publish/dist/types/add_file_params* ./publish/AdapterAzureBlob/dist
cp ./publish/dist/types/adapter_azure_blob* ./publish/AdapterAzureBlob/dist

mv ./publish/dist/AdapterAzureBlob* ./publish/AdapterAzureBlob/dist
mv ./publish/dist/indexes/AdapterAzureBlob.d.ts ./publish/AdapterAzureBlob/dist/index.d.ts
mv ./publish/dist/indexes/AdapterAzureBlob.js ./publish/AdapterAzureBlob/dist/index.js
mv ./publish/dist/indexes/AdapterAzureBlob.js.map ./publish/AdapterAzureBlob/dist/index.js.map

# AdapterMinio
cp ./publish/dist/AbstractAdapter* ./publish/AdapterMinio/dist
cp ./publish/dist/util* ./publish/AdapterMinio/dist

cp ./publish/dist/types/general* ./publish/AdapterMinio/dist
cp ./publish/dist/types/result* ./publish/AdapterMinio/dist
cp ./publish/dist/types/add_file_params* ./publish/AdapterMinio/dist
cp ./publish/dist/types/adapter_minio* ./publish/AdapterMinio/dist

mv ./publish/dist/AdapterMinio* ./publish/AdapterMinio/dist
mv ./publish/dist/indexes/AdapterMinio.d.ts ./publish/AdapterMinio/dist/index.d.ts
mv ./publish/dist/indexes/AdapterMinio.js ./publish/AdapterMinio/dist/index.js
mv ./publish/dist/indexes/AdapterMinio.js.map ./publish/AdapterMinio/dist/index.js.map

# cleanup
rm -rf ./publish/dist/*
