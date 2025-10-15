import { createBucket, setSelectedBucket, getSelectedBucket, listBuckets, deleteBucket, bucketExists, addFileFromPath, listFiles } from "../api_calls";
import { colorLog, Color, getPrivateBucketName } from "../util";

export async function testDeleteBucket(type: string) {
    console.log("\n");
    colorLog("testDeleteBucket", Color.TEST);
    let name = getPrivateBucketName(type);
    await createBucket(name);
    setSelectedBucket(name);
    getSelectedBucket();
    await listBuckets();
    await deleteBucket();
    await bucketExists(name);
    await listBuckets();
    getSelectedBucket();

    name = getPrivateBucketName(type);
    await createBucket(name);
    await addFileFromPath("./tests/data/image1.jpg", "image1.jpg", {}, name)
    await listFiles(name);
    await deleteBucket(name);
}
