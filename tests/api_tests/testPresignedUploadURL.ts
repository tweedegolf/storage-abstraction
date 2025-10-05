import { StorageType } from "../../src/types/general";
import { createBucket, setSelectedBucket, getPresignedUploadURL, deleteBucket } from "../api_calls";
import { colorLog, Color, getPrivateBucketName } from "../util";

export async function testPresignedUploadURL(type: string) {
    console.log("\n");
    colorLog("testPresignedUploadURL", Color.TEST);
    const name = getPrivateBucketName(type);
    await createBucket(name);
    setSelectedBucket(name);
    await getPresignedUploadURL("test.jpg");

    if (type !== StorageType.B2) {
        await getPresignedUploadURL("test.jpg", {
            expires: 1,
            waitUntilExpired: true
        });
    }

    if (type === StorageType.GCS) {
        await getPresignedUploadURL("test.jpg", {
            contentType: "image/jpeg"
        });
    }

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
    } else if (type === StorageType.AZURE) {
        await getPresignedUploadURL("test.jpg", { permissions: {} });
        await getPresignedUploadURL("test.jpg", { permissions: { weird: 123 } });
    }

    await deleteBucket(name);
}
