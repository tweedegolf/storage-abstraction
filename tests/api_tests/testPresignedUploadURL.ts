import { Provider } from "../../src/types/general.ts";
import { createBucket, setSelectedBucket, getPresignedUploadURL, deleteBucket } from "../api_calls.ts";
import { colorLog, Color, getPrivateBucketName } from "../util.ts";

export async function testPresignedUploadURL(type: string) {
    console.log("\n");
    colorLog("testPresignedUploadURL", Color.TEST);
    const name = getPrivateBucketName(type);
    await createBucket(name);
    setSelectedBucket(name);
    await getPresignedUploadURL("test.jpg");

    if (type !== Provider.B2) {
        await getPresignedUploadURL("test.jpg", {
            expiresIn: 1,
            waitUntilExpired: true
        });
    }

    if (type === Provider.GCS) {
        await getPresignedUploadURL("test.jpg", {
            contentType: "image/jpeg"
        });
    }

    if (type === Provider.S3) {
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
    } else if (type === Provider.AZURE) {
        await getPresignedUploadURL("test.jpg", { permissions: {} });
        await getPresignedUploadURL("test.jpg", { permissions: { weird: 123 } });
    }

    await deleteBucket(name);
}
