import { Provider } from "../src/types/general";
import { init, cleanup, getStorage, waitABit } from "./api_calls";
import { testAddFilesToBucket, testClearBucket, testDeleteBucket, testDownloadFilesFromBucket, testFilesInBucket, testNonExistingDown, testNonExistingUp, testPresignedUploadURL, testPrivateBucket, testPublicBucket, testVersioning } from "./api_tests/index";
import { testSkipBucketCheck } from "./api_tests/testSkipBucketCheck";

let provider = Provider.LOCAL;
if (process.argv[2]) {
  provider = process.argv[2] as Provider;
}

async function run() {
  try {

    // always run init first!
    await init(provider);

    // const r2 = await getStorage().deleteBucket("sab-test-public");
    // console.log(r2)

    // select the tests you want to run by (un)commenting out
    // await testPublicBucket(provider);
    // await testPrivateBucket(provider);
    // await testDeleteBucket(provider);
    // await testAddFilesToBucket(provider);
    // await testVersioning(provider);
    // await testNonExistingUp(provider);
    // await testNonExistingDown(provider);
    // await testDownloadFilesFromBucket(provider);
    // await testFilesInBucket(provider);
    // await testPresignedUploadURL(provider);
    await testSkipBucketCheck(provider);
    // await testClearBucket(provider);


    // clean up
    // await cleanup();
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}

run();

