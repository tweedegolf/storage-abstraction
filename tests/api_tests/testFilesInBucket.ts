import { createBucket, setSelectedBucket, addFileFromPath, fileExists, sizeOf, removeFile, deleteBucket } from "../api_calls";
import { colorLog, Color, getPrivateBucketName } from "../util";

export async function testFilesInBucket(type: string) {
    console.log("\n");
    colorLog("testFilesInBucket", Color.TEST);
    const name = getPrivateBucketName(type);
    await createBucket(name);
    setSelectedBucket(name);

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
