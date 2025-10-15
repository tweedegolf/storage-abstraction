import { createBucket, setSelectedBucket, addFileFromPath, listFiles, removeFile, clearBucket, deleteBucket } from "../api_calls";
import { colorLog, Color, getPrivateBucketName } from "../util";

export async function testVersioning(type: string) {
    console.log("\n");
    colorLog("testVersioning", Color.TEST);
    const name = getPrivateBucketName(type);
    // await createBucket(privateBucket, { versioning: true });
    await createBucket(name);
    setSelectedBucket(name);
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
    await deleteBucket();
    await deleteBucket("imaginary-bucket");
}
