import { addFileFromPath, getPublicURL, getSignedURL, listFiles, createBucket, deleteBucket } from "../api_calls";
import { colorLog, Color, getPrivateBucketName } from "../util";

export async function testNonExistingDown(type: string) {
    console.log("\n");
    colorLog("testNonExistingDown", Color.TEST);
    const name = getPrivateBucketName(type);
    await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {}, "imaginary-bucket");
    await getPublicURL("imaginary-file.jpg", "imaginary", {}, "imaginary-bucket");
    await getSignedURL("imaginary-file.jpg", "imaginary", {}, "imaginary-bucket");
    await listFiles("imaginary-bucket");

    await createBucket(name);
    await getPublicURL("imaginary-file.jpg", "imaginary", {}, name);
    await getSignedURL("imaginary-file.jpg", "imaginary", {}, name);
    await listFiles(name);

    await deleteBucket(name);
}
