import { Provider } from "../src/types/general";
import { init, cleanup, getStorage, waitABit } from "./api_calls";
import { testAddFilesToBucket, testClearBucket, testDeleteBucket, testDownloadFilesFromBucket, testFilesInBucket, testNonExistingDown, testNonExistingUp, testPresignedUploadURL, testPrivateBucket, testPublicBucket, testVersioning } from "./api_tests/";

const types = [
  Provider.LOCAL, // 0
  Provider.S3, // 1
  Provider.B2, // 2
  Provider.GCS, // 3
  Provider.AZURE, // 4
  Provider.MINIO, // 5
  Provider.CUBBIT, // 6
  Provider.CLOUDFLARE, // 7
  Provider.B2_S3, // 8
  Provider.MINIO_S3, // 9
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

  // const r2 = await getStorage().deleteBucket("sab-test-public");
  // console.log(r2)

  // select the tests you want to run by (un)commenting out
  // await testPublicBucket(type);
  // await testPrivateBucket(type);
  // await testDeleteBucket(type);
  await testAddFilesToBucket(type);
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

