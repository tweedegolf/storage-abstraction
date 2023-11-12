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

export const parseMode = (s: number | string): string | number => {
  // if mode is a number, parseMode assumes it is a decimal number
  if (typeof s === "number") {
    if (s < 0) {
      throw new Error(
        `The argument 'mode' must be a 32-bit unsigned integer or an octal string. Received ${s}`
      );
    }
    return s;
  }

  // mode is a string

  // e.g "0x755" (octal)
  if (s.startsWith("0o")) {
    return parseInt(s.substring(2), 8).toString(8);
  }
  // e.g '511' (decimal)
  const i = parseInt(s, 10);
  // quick fix for erroneously passed octal number as string (without 0o prefix)
  return i > 511 ? 511 : i;
};
