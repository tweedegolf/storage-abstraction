import rimraf from "rimraf";
import { Readable, Writable } from "stream";

/**
 * Utility function that connects a read-stream (from the storage) to a write-stream (to a local file)
 */
export const copyFile = (
  readStream: Readable,
  writeStream: Writable,
  log: boolean = false
): Promise<void> =>
  new Promise((resolve, reject) => {
    readStream
      .pipe(writeStream)
      .on("error", (e) => {
        console.error("\x1b[31m", e, "\n");
        reject();
      })
      .on("finish", () => {
        if (log) {
          console.log("read finished");
        }
      });
    writeStream
      .on("error", (e) => {
        console.error("\x1b[31m", e, "\n");
        reject();
      })
      .on("finish", () => {
        if (log) {
          console.log("write finished");
        }
        resolve();
      });
  });
