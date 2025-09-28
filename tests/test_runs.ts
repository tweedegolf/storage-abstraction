import { S3Type, StorageType } from "../src/types/general";
import { init, getSelectedBucket, listBuckets, createBucket, bucketIsPublic, setSelectedBucket, addFileFromPath, listFiles, getPublicURL, getSignedURL, deleteBucket, bucketExists, addFileFromBuffer, addFileFromStream, getFileAsStream, privateBucket, publicBucket, clearBucket, fileExists, removeFile, sizeOf, getFileSize, cleanup, getStorage, getPresignedUploadURL } from "./api_calls";
import { Color, colorLog, logResult } from "./util";

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
let type = types[index];
// console.log(process.argv);
if (process.argv[2]) {
  index = parseInt(process.argv[2], 10);
  type = types[index];
}
// console.log(index, type);

async function testPrivateBucket() {
  console.log("\n");
  colorLog("testPrivateBucket", Color.TEST);
  await createBucket(privateBucket, { public: false });
  await bucketIsPublic(privateBucket);

  setSelectedBucket(privateBucket);
  await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {});
  await listFiles();
  if (type === StorageType.B2 || type === S3Type.BACKBLAZE) {
    await listFiles("b2-snapshots-26f128630441");
  }
  await getPublicURL('file1.jpg', { noCheck: true });
  await getPublicURL('file1.jpg', { noCheck: false });
  await getSignedURL("file1.jpg", "file1", {});

  await deleteBucket();
}

async function testPublicBucket() {
  console.log("\n");
  colorLog("testPublicBucket", Color.TEST);
  if (type !== S3Type.CLOUDFLARE && type !== S3Type.BACKBLAZE) {
    await createBucket(publicBucket, { public: true });
  } else {
    /**
     * If you're connecting to Cloudflare or Backblaze with the S3 adapter you can't create a public bucket in one go.
     * The bucket will be created but you'll get a warning that you can only make this bucket public manually using the 
     * Cloudflare or Backblaze web console.
     */
    await createBucket(publicBucket, { public: true });
  }
  await bucketIsPublic(publicBucket);
  setSelectedBucket(publicBucket)

  /**
   * To make a file publicly accessible in Cubbit you need to set ACL per file.
   * Note that this also makes files in a private bucket publicly accessible!
   */
  const options = type === S3Type.CUBBIT ? { ACL: "public-read" } : {};
  await addFileFromPath("./tests/data/image2.jpg", 'file2.jpg', options);
  await listFiles();
  await getPublicURL('file2.jpg');
  await getPublicURL('file2.jpg', { noCheck: true });
  await getSignedURL('file2.jpg', "valid1", { expiresIn: 1 }); // expires after a second
  await getSignedURL('file2.jpg', "expired", { expiresIn: 1, waitUntilExpired: true }); // check url after expiration
  await getSignedURL('file2.jpg', "valid2", {});

  // check url to files in a subdir of a bucket
  await addFileFromPath("./tests/data/image2.jpg", "subdir/file2.jpg", {});
  await getPublicURL('subdir/file2.jpg', { noCheck: true });
  await getSignedURL('subdir/file2.jpg', "valid3", {});

  if (type !== S3Type.CLOUDFLARE && type !== S3Type.BACKBLAZE) {
    await deleteBucket();
  }
}

async function testDeleteBucket() {
  console.log("\n");
  colorLog("testDeleteBucket", Color.TEST);
  await createBucket(privateBucket);
  setSelectedBucket(privateBucket);
  getSelectedBucket();
  await listBuckets();
  await deleteBucket();
  await bucketExists(privateBucket);
  await listBuckets();
  getSelectedBucket();
}

async function testAddFilesToBucket() {
  console.log("\n");
  colorLog("testAddFilesToBucket", Color.TEST);
  await createBucket(privateBucket);
  setSelectedBucket(privateBucket);
  await addFileFromPath("./tests/data/with space.jpg", "file-from-path.jpg", {});
  await addFileFromBuffer("./tests/data/input.txt", "file-from-buffer.txt", {});
  await addFileFromStream("./tests/data/image1.jpg", "file-from-stream.jpg", {});
  await listFiles();
  await deleteBucket();
}

async function testVersioning() {
  console.log("\n");
  colorLog("testVersioning", Color.TEST);
  // await createBucket(privateBucket, { versioning: true });
  await createBucket(privateBucket);
  setSelectedBucket(privateBucket);
  await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {});
  await addFileFromPath("./tests/data/image1.jpg", "file2.jpg", {});
  await addFileFromPath("./tests/data/image1.jpg", "file3.jpg", {});
  await addFileFromPath("./tests/data/image1.jpg", "file3.jpg", {});
  await addFileFromPath("./tests/data/image1.jpg", "file3.jpg", {});
  listFiles();
  listFiles(2);
  await removeFile("file1.jpg");
  await removeFile("file1.jpg");
  await clearBucket();
  await clearBucket();
  // await deleteBucket();
  // await deleteBucket("imaginary-bucket");
}

async function testNonExistingUp() {
  await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {}, "imaginary-bucket");
  await createBucket(privateBucket);
  await addFileFromPath("./tests/data/imaginary.jpg", "file1.jpg", {}, privateBucket);
  await addFileFromPath("./tests/data/image3.jpg", "file1.jpg", {}, privateBucket);
  await deleteBucket(privateBucket);
}

async function testNonExistingDown() {
  await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {}, "imaginary-bucket");
  await getPublicURL("imaginary-file.jpg", {}, "imaginary-bucket");
  await getSignedURL("imaginary-file.jpg", "imaginary", {}, "imaginary-bucket");
  await listFiles("imaginary-bucket");

  await createBucket(privateBucket);
  await getPublicURL("imaginary-file.jpg", {}, privateBucket);
  await getSignedURL("imaginary-file.jpg", "imaginary", {}, privateBucket);
  await listFiles(privateBucket);

  await deleteBucket(privateBucket);
}

async function testDownloadFilesFromBucket() {
  console.log("\n");
  colorLog("testDownloadFilesFromBucket", Color.TEST);
  await createBucket(privateBucket);
  setSelectedBucket(privateBucket);
  await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {});
  const origSize = await getFileSize("./tests/data/image1.jpg");

  await getFileAsStream("file1.jpg", "full.jpg");
  const fullSize = await getFileSize("./tests/test_directory/full.jpg");
  if (origSize === fullSize) {
    colorLog("checkSize", Color.OK, origSize, fullSize);
  } else {
    colorLog("checkSize", Color.ERROR, origSize, fullSize);
  }

  await getFileAsStream("file1.jpg", "partial1.jpg", { start: 0, end: 2000 });
  let partSize = await getFileSize("./tests/test_directory/partial1.jpg");
  if (partSize === 2001) {
    colorLog("checkSize", Color.OK, "size is ok");
  } else {
    colorLog("checkSize", Color.ERROR, "file not downloaded correctly");
  }

  await getFileAsStream("file1.jpg", "partial2.jpg", { end: 2000 });
  partSize = await getFileSize("./tests/test_directory/partial2.jpg");
  if (partSize === 2001) {
    colorLog("checkSize", Color.OK, "size is ok");
  } else {
    colorLog("checkSize", Color.ERROR, "file not downloaded correctly");
  }

  await getFileAsStream("file1.jpg", "partial3.jpg", { start: 2000 });
  partSize = await getFileSize("./tests/test_directory/partial3.jpg");
  if (partSize === origSize - 2000) {
    colorLog("checkSize", Color.OK, "size is ok");
  } else {
    colorLog("checkSize", Color.ERROR, "file not downloaded correctly");
  }

  await deleteBucket();
}

async function testFilesInBucket() {
  console.log("\n");
  colorLog("testFilesInBucket", Color.TEST);
  await createBucket(privateBucket);
  setSelectedBucket(privateBucket);

  await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {});
  await fileExists("file1.jpg");
  await sizeOf("file1.jpg");
  await removeFile("file1.jpg");
  await fileExists("file1.jpg");

  // add multiple times to create versions (if versioning is enabled)
  await addFileFromPath("./tests/data/image1.jpg", "subdir/file1.jpg", {});
  await addFileFromPath("./tests/data/image1.jpg", "subdir/file1.jpg", {});
  await addFileFromPath("./tests/data/image1.jpg", "subdir/file1.jpg", {});
  await fileExists("subdir/file1.jpg");
  await sizeOf("subdir/file1.jpg");
  await removeFile("subdir/file1.jpg"); // removes all versions
  await fileExists("subdir/file1.jpg");
  await removeFile("subdir/file1111.jpg"); // try to remove a file that doesn't exist

  await deleteBucket();

  await removeFile("file1.jpg"); // try to remove a file when no bucket is selected (because it has been deleted)
  await removeFile("file1.jpg", "this-is-not-a-bucket-999"); // try to remove a file in a bucket that doesn't exist
}

async function testPresignedUploadURL() {
  console.log("\n");
  colorLog("testPresignedUploadURL", Color.TEST);
  await createBucket(privateBucket);
  setSelectedBucket(privateBucket);
  await getPresignedUploadURL("test.jpg");
  await getPresignedUploadURL("test.jpg", {
    expires: 1,
  });
  if (type === StorageType.S3) {
    await getPresignedUploadURL("test.jpg", {
      conditions: [
        ["starts-with", "$key", "something-else"],
      ]
    });
    await getPresignedUploadURL("test.jpg", {
      conditions: [
        ["content-length-range", 1, 1024],
      ]
    });
  }
}

async function testClearBucket() {
  console.log("\n");
  colorLog("testClearBucket", Color.TEST);
  await createBucket(privateBucket);
  setSelectedBucket(privateBucket);
  await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {});
  await addFileFromPath("./tests/data/image2.jpg", "file2.jpg", {});
  await listFiles();
  await clearBucket();
  await listFiles();
  await clearBucket();
  await deleteBucket();
}

async function run() {
  // always run init first!
  await init(type);

  // select the tests you want to run by (un)commenting out
  // await testPublicBucket();
  // await testPrivateBucket();
  // await testDeleteBucket();
  // await testAddFilesToBucket();
  // await testVersioning();
  // await testNonExistingUp();
  // await testNonExistingDown();
  // await testDownloadFilesFromBucket();
  // await testFilesInBucket();
  await testPresignedUploadURL();
  // await testClearBucket();

  // clean up
  await cleanup();
}

run();

