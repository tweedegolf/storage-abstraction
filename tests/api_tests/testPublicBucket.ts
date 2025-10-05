import { S3Type } from "../../src/types/general";
import { createBucket, bucketIsPublic, setSelectedBucket, addFileFromPath, listFiles, getPublicURL, getSignedURL, deleteBucket } from "../api_calls";
import { colorLog, Color, getPublicBucketName } from "../util";

export async function testPublicBucket(type: string) {
    console.log("\n");
    colorLog("testPublicBucket", Color.TEST);
    const name = getPublicBucketName(type);
    if (type !== S3Type.CLOUDFLARE && type !== S3Type.BACKBLAZE) {
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
    const options = type === S3Type.CUBBIT ? { ACL: "public-read" } : {};
    await addFileFromPath("./tests/data/image2.jpg", 'file2.jpg', options);
    await listFiles();
    await getPublicURL('file2.jpg');
    await getPublicURL('file2.jpg', { noCheck: true });
    await getSignedURL('file2.jpg', "valid1", { expiresIn: 1 }); // expires after a second
    await getSignedURL('file2.jpg', "expired", { expiresIn: 1, waitUntilExpired: true }); // check url after expiration
    await getSignedURL('file2.jpg', "valid2", {});

    // check url to files in a subdir of a bucket
    await addFileFromPath("./tests/data/image2.jpg", "subdir/file2.jpg", {});
    await getPublicURL('subdir/file2.jpg', { noCheck: true });
    await getSignedURL('subdir/file2.jpg', "valid3", {});

    if (type !== S3Type.CLOUDFLARE && type !== S3Type.BACKBLAZE) {
        await deleteBucket();
    }
}
