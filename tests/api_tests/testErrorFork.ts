import { createBucket, setSelectedBucket, addFileFromPath, listFiles, deleteBucket, getStorage } from "../api_calls";
import { colorLog, Color, getPrivateBucketName } from "../util";

export async function testErrorFork(type: string) {
    console.log("\n");
    colorLog("testErrorFork", Color.TEST);
    const name = getPrivateBucketName(type);
    await createBucket(name);
    setSelectedBucket(name);
    await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", { checkIfBucketExists: true });
    try {
        const r = await getStorage().fileExistsFork("not-existing-bucket", "not-existing-file.jpg");
        console.log(r)
    } catch (e) {
        colorLog((e as Error).message, Color.ERROR)
    }
    await listFiles();
    await deleteBucket();
}
