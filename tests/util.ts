import { Readable, Stream, Writable } from "stream";

/**
 * Utility function that connects a read-stream (from the storage) to a write-stream (to a local file)
 */
export const saveFile = (
  readStream: Readable,
  writeStream: Writable,
  log: boolean = false
): Promise<void> => {
  return new Promise((resolve, reject) => {
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
};

export async function waitABit(millis = 100): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(colorLog("just wait a bit"), `${millis}ms`);
      resolve();
    }, millis);
  });
}

export function streamToString(stream: Readable) {
  const chunks: Array<Uint8Array> = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

export async function timeout(millis: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve();
    }, millis);
  });
}

// credits: https://stackoverflow.com/questions/14269233/node-js-how-to-read-a-stream-into-a-buffer
export async function stream2buffer(stream: Stream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>(); // eslint-disable-line

    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(`error converting stream - ${err}`));
  });
}

export function colorLog(s: string, c: string = "96m"): string {
  return `\x1b[${c}[${s}]\x1b[0m`;
}
