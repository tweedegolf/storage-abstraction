import { Provider } from "../../src/types/general.ts";
import { createBucket, bucketIsPublic, setSelectedBucket, addFileFromPath, listFiles, getPublicURL, getSignedURL, deleteBucket } from "../api_calls.ts";
import { colorLog, Color, getPrivateBucketName } from "../util.ts";

export async function testPrivateBucket(type: string) {
    console.log("\n");
    colorLog("testPrivateBucket", Color.TEST);
    const name = getPrivateBucketName(type);
    await createBucket(name, { public: false });
    await bucketIsPublic(name);

    setSelectedBucket(name);
    await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {});
    await listFiles();
    if (type === Provider.B2 || type === Provider.BACKBLAZE_S3) {
        await listFiles("b2-snapshots-26f128630441");
    }
    await getPublicURL('file1.jpg', 'public1', { noCheck: true });
    await getPublicURL('file1.jpg', 'public2', { noCheck: false });
    await getSignedURL("file1.jpg", "file1", {});

    await deleteBucket();
}
