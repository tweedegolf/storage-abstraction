import { createBucket, setSelectedBucket, addFileFromPath, listFiles, clearBucket, deleteBucket } from "../api_calls";
import { colorLog, Color, getPrivateBucketName } from "../util";

export async function testClearBucket(type: string) {
    console.log("\n");
    colorLog("testClearBucket", Color.TEST);
    const name = getPrivateBucketName(type);
    await createBucket(name);
    setSelectedBucket(name);
    await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {});
    await addFileFromPath("./tests/data/image2.jpg", "file2.jpg", {});
    await listFiles();
    await clearBucket();
    await listFiles();
    await clearBucket();
    await deleteBucket();
}
