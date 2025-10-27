import { createBucket, setSelectedBucket, addFileFromPath, listFiles, clearBucket, deleteBucket } from "../api_calls";
import { colorLog, Color, getPrivateBucketName } from "../util";

export async function testSkipBucketCheck(type: string) {
    console.log("\n");
    colorLog("testSkipBucketCheck", Color.TEST);
    const name = getPrivateBucketName(type);
    await createBucket(name);
    setSelectedBucket(name);
    await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", { checkIfBucketExists: true });
    await listFiles();
    await deleteBucket();
    setSelectedBucket(name);
    await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", { checkIfBucketExists: false });
}
