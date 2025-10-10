import { Provider } from "../../src/types/general.ts";
import { createBucket, bucketIsPublic, setSelectedBucket, addFileFromPath, listFiles, getPublicURL, getSignedURL, deleteBucket } from "../api_calls.ts";
import { colorLog, Color, getPublicBucketName } from "../util.ts";

export async function testPublicBucket(type: string) {
    console.log("\n");
    colorLog("testPublicBucket", Color.TEST);
    const name = getPublicBucketName(type);
    if (type !== Provider.CLOUDFLARE && type !== Provider.B2_S3) {
        await createBucket(name, { public: true });
    } else {
        /**
         * If you're connecting to Cloudflare or Backblaze with the S3 adapter you can't create a public bucket in one go.
         * The bucket will be created but you'll get a warning that you can only make this bucket public manually using the
         * Cloudflare or Backblaze web console.
         */
        await createBucket(name, { public: true });
    }
    await bucketIsPublic(name);
    setSelectedBucket(name);

    /**
     * To make a file publicly accessible in Cubbit you need to set ACL per file.
     * Note that this also makes files in a private bucket publicly accessible!
     */
    const options = type === Provider.CUBBIT ? { ACL: "public-read" } : {};
    await addFileFromPath("./tests/data/image2.jpg", 'file2.jpg', options)
    await listFiles();
    await getPublicURL('file2.jpg', "public1");
    await getPublicURL('file2.jpg', "public2", { noCheck: true });
    await getSignedURL('file2.jpg', "valid1", { expiresIn: 1 }); // expires after a second
    await getSignedURL('file2.jpg', "expired", { expiresIn: 1, waitUntilExpired: true }); // check url after expiration
    await getSignedURL('file2.jpg', "valid2", {});

    // check url to files in a subdir of a bucket
    await addFileFromPath("./tests/data/image2.jpg", "subdir/file2.jpg", {});
    await getPublicURL('subdir/file2.jpg', "public3", { noCheck: true });
    await getSignedURL('subdir/file2.jpg', "valid3", {});

    if (type !== Provider.CLOUDFLARE && type !== Provider.B2_S3) {
        await deleteBucket();
    }
}
