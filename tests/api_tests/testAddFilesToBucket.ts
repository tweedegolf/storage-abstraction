import { createBucket, setSelectedBucket, addFileFromPath, addFileFromBuffer, addFileFromStream, listFiles, deleteBucket } from "../api_calls";
import { colorLog, Color, getPrivateBucketName } from "../util";

export async function testAddFilesToBucket(type: string) {
    console.log("\n");
    colorLog("testAddFilesToBucket", Color.TEST);
    const name = getPrivateBucketName(type);
    await createBucket(name);
    setSelectedBucket(name);
    await addFileFromPath("./tests/data/with space.jpg", "file-from-path.jpg", {});
    await addFileFromBuffer("./tests/data/input.txt", "file-from-buffer.txt", {});
    await addFileFromStream("./tests/data/image1.jpg", "file-from-stream.jpg", {});
    await listFiles();
    await deleteBucket();
}
