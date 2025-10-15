import { createBucket, setSelectedBucket, addFileFromPath, getFileSize, getFileAsStream, deleteBucket } from "../api_calls";
import { colorLog, Color, getPrivateBucketName } from "../util";


export async function testDownloadFilesFromBucket(type: string) {
    console.log("\n");
    colorLog("testDownloadFilesFromBucket", Color.TEST);
    const name = getPrivateBucketName(type);
    await createBucket(name);
    setSelectedBucket(name);
    await addFileFromPath("./tests/data/image1.jpg", "file1.jpg", {});
    const origSize = await getFileSize("./tests/data/image1.jpg");

    await getFileAsStream("file1.jpg", "full.jpg");
    const fullSize = await getFileSize("./tests/test_directory/full.jpg");
    if (origSize === fullSize) {
        colorLog("checkSize", Color.OK, origSize, fullSize);
    } else {
        colorLog("checkSize", Color.ERROR, origSize, fullSize);
    }

    await getFileAsStream("file1.jpg", "partial1.jpg", { start: 0, end: 2000 });
    let partSize = await getFileSize("./tests/test_directory/partial1.jpg");
    if (partSize === 2001) {
        colorLog("checkSize", Color.OK, "size is ok");
    } else {
        colorLog("checkSize", Color.ERROR, "file not downloaded correctly");
    }

    await getFileAsStream("file1.jpg", "partial2.jpg", { end: 2000 });
    partSize = await getFileSize("./tests/test_directory/partial2.jpg");
    if (partSize === 2001) {
        colorLog("checkSize", Color.OK, "size is ok");
    } else {
        colorLog("checkSize", Color.ERROR, "file not downloaded correctly");
    }

    await getFileAsStream("file1.jpg", "partial3.jpg", { start: 2000 });
    partSize = await getFileSize("./tests/test_directory/partial3.jpg");
    if (partSize === origSize - 2000) {
        colorLog("checkSize", Color.OK, "size is ok");
    } else {
        colorLog("checkSize", Color.ERROR, "file not downloaded correctly");
    }

    await deleteBucket();
}
