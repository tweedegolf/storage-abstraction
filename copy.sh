# setup
rm -rf ./publish/Storage/dist
rm -rf ./publish/AdapterLocal/dist
rm -rf ./publish/AdapterAmazonS3/dist
rm -rf ./publish/AdapterGoogleCloud/dist
rm -rf ./publish/AdapterBackblazeB2/dist
rm -rf ./publish/AdapterMinio/dist

mkdir -p ./publish/Storage/dist
mkdir -p ./publish/AdapterLocal/dist
mkdir -p ./publish/AdapterAmazonS3/dist
mkdir -p ./publish/AdapterGoogleCloud/dist
mkdir -p ./publish/AdapterBackblazeB2/dist
mkdir -p ./publish/AdapterMinio/dist

# Storage
mv ./publish/dist/Storage* ./publish/Storage/dist
cp ./publish/dist/types* ./publish/Storage/dist

# AdapterLocal
mv ./publish/dist/AdapterLocal* ./publish/AdapterLocal/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterLocal/dist
cp ./publish/dist/types* ./publish/AdapterLocal/dist
cp ./publish/dist/util* ./publish/AdapterLocal/dist

# AdapterAmazonS3
mv ./publish/dist/AdapterAmazonS3* ./publish/AdapterAmazonS3/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterAmazonS3/dist
cp ./publish/dist/types* ./publish/AdapterAmazonS3/dist
cp ./publish/dist/util* ./publish/AdapterAmazonS3/dist

# AdapterGoogleCloud
mv ./publish/dist/AdapterGoogleCloud* ./publish/AdapterGoogleCloud/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterGoogleCloud/dist
cp ./publish/dist/types* ./publish/AdapterGoogleCloud/dist
cp ./publish/dist/util* ./publish/AdapterGoogleCloud/dist

# AdapterBackblazeB2
mv ./publish/dist/AdapterBackblazeB2* ./publish/AdapterBackblazeB2/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterBackblazeB2/dist
cp ./publish/dist/types* ./publish/AdapterBackblazeB2/dist
cp ./publish/dist/util* ./publish/AdapterBackblazeB2/dist

# AdapterAzureBlob
mv ./publish/dist/AdapterAzureBlob* ./publish/AdapterAzureBlob/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterAzureBlob/dist
cp ./publish/dist/types* ./publish/AdapterAzureBlob/dist
cp ./publish/dist/util* ./publish/AdapterAzureBlob/dist

# AdapterMinio
mv ./publish/dist/AdapterMinio* ./publish/AdapterMinio/dist
cp ./publish/dist/AbstractAdapter* ./publish/AdapterMinio/dist
cp ./publish/dist/types* ./publish/AdapterMinio/dist
cp ./publish/dist/util* ./publish/AdapterMinio/dist

# cleanup
rm ./publish/dist/*
