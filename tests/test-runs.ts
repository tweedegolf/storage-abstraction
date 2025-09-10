import { S3Type, StorageType } from "../src/types/general";
import { cleanup, init, getSelectedBucket, listBuckets, deleteAllBuckets, createBucket, bucketIsPublic, setSelectedBucket, addFileFromPath, listFiles, getPublicURL, getSignedURL, deleteBucket, bucketExists, addFileFromBuffer, addFileFromStream, getFileAsStream, privateBucket, publicBucket } from "./tests";
import { Color, colorLog } from "./util";

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

async function testPrivateBucket() {
  colorLog("testPrivateBucket", Color.TEST);
  await init(type);
  getSelectedBucket();
  await createBucket(privateBucket, { public: false });
  await bucketIsPublic(privateBucket);

  setSelectedBucket(privateBucket);
  await addFileFromPath('file1.jpg', {});
  await listFiles();
  if (type === StorageType.B2 || type === S3Type.BACKBLAZE) {
    await listFiles("b2-snapshots-26f128630441");
  }
  await getPublicURL('file1.jpg', { noCheck: true });
  await getPublicURL('file1.jpg', { noCheck: false });
  await getSignedURL("file1.jpg", "file1", {});
}

async function testPublicBucket() {
  colorLog("testPublicBucket", Color.TEST);
  await init(types[index]);
  await createBucket(publicBucket, { public: true });
  await bucketIsPublic(publicBucket);
  setSelectedBucket(publicBucket)

  /**
   * To make a file publicly accessible in Cubbit you need to set ACL per file.
   * Note that this also makes files in a private bucket publicly accessible!
   */
  const options = type === S3Type.CUBBIT ? { ACL: "public-read" } : {};
  await addFileFromPath('file2.jpg', options);
  await listFiles();
  await getPublicURL('file2.jpg', { noCheck: true });
  await getSignedURL('file2.jpg', "expired", { expiresIn: 1 });
  await getSignedURL('file2.jpg', "valid", {});
}

// setSelectedBucket(privateBucket)
// await deleteBucket();
// await bucketExists();

// setSelectedBucket(publicBucket);
// await addFileFromBuffer("file-from-buffer.jpg", {});
// await addFileFromStream("file-from-stream.jpg", {});
// await listFiles();

// await getFileAsStream("file-from-stream.jpg", "full");
// await getFileAsStream("file-from-stream.jpg", "partial1", { start: 0, end: 2000 });
// await getFileAsStream("file-from-stream.jpg", "partial2", { end: 2000 });
// await getFileAsStream("file-from-stream.jpg", "partial3", { start: 2000 });

// await listFiles();
// await deleteBucket();

// process.exit();

// await fileExists();
// await sizeOf();
// await removeFile();
// await removeFile();
// await removeFile();
// await fileExists();
// await clearBucket();
// await listFiles();
// await deleteBucket();
// await listBuckets();


async function run() {
  await testPrivateBucket();
  console.log("\n");
  await testPublicBucket();
  console.log("\n");

  if (type = StorageType.LOCAL) {
    await cleanup();
  }
}

run();

