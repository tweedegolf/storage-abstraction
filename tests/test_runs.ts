import { S3Type, StorageType } from "../src/types/general";
import { init, cleanup, getStorage, waitABit } from "./api_calls";
import { testAddFilesToBucket, testClearBucket, testDeleteBucket, testDownloadFilesFromBucket, testFilesInBucket, testNonExistingDown, testNonExistingUp, testPresignedUploadURL, testPrivateBucket, testPublicBucket, testVersioning } from "./api_tests/";

const types = [
  StorageType.LOCAL, // 0
  StorageType.S3, // 1
  StorageType.B2, // 2
  StorageType.GCS, // 3
  StorageType.AZURE, // 4
  StorageType.MINIO, // 5
  S3Type.CUBBIT, // 6
  S3Type.CLOUDFLARE, // 7
  S3Type.BACKBLAZE, // 8
];

let index = 0;
export let type = types[index];
// console.log(process.argv);
if (process.argv[2]) {
  index = parseInt(process.argv[2], 10);
  type = types[index];
}
// console.log(index, type);

async function run() {
  // always run init first!
  await init(type);

  // select the tests you want to run by (un)commenting out
  await testPublicBucket(type);
  // await testPrivateBucket(type);
  // await testDeleteBucket(type);
  // await testAddFilesToBucket(type);
  // await testVersioning(type);
  // await testNonExistingUp(type);
  // await testNonExistingDown(type);
  // await testDownloadFilesFromBucket(type);
  // await testFilesInBucket(type);
  // await testPresignedUploadURL(type);
  // await testClearBucket(type);

  // clean up
  // await cleanup();
}

run();

