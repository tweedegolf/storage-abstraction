import { createBucket, setSelectedBucket, getSelectedBucket, listBuckets, deleteBucket, bucketExists } from "../api_calls";
import { colorLog, Color, getPrivateBucketName } from "../util";

export async function testDeleteBucket(type: string) {
    console.log("\n");
    colorLog("testDeleteBucket", Color.TEST);
    const name = getPrivateBucketName(type);
    await createBucket(name);
    setSelectedBucket(name);
    getSelectedBucket();
    await listBuckets();
    await deleteBucket();
    await bucketExists(name);
    await listBuckets();
    getSelectedBucket();
}
