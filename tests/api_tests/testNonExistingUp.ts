import { addFileFromPath, createBucket, deleteBucket } from "../api_calls.ts";
import { colorLog, Color, getPrivateBucketName } from "../util.ts";

export async function testNonExistingUp(type: string) {
    console.log("\n");
    colorLog("testNonExistingUp", Color.TEST);
    const name = getPrivateBucketName(type);
    await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {}, "imaginary-bucket");
    await createBucket(name);
    await addFileFromPath("./tests/data/imaginary.jpg", "file1.jpg", {}, name);
    await addFileFromPath("./tests/data/image3.jpg", "file1.jpg", {}, name);
    await deleteBucket(name);
}
