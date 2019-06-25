import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { StorageLocal } from '../StorageLocal';
import to from 'await-to-js';
import 'jasmine';
import { Storage } from '../types';
dotenv.config();

const bucketName = 'aap-en-beer';
const configLocal = {
  bucketName,
  directory: '/home/abudaan/Downloads'
}
const sl = new StorageLocal(configLocal);

describe('testing local storage', () => {

  it('create bucket', async () => {
    // TODO add extra argument to clear the bucket if it exists
    const [err, result] = await to(sl.createBucket())
    expect(err).toBe(null);
    expect(result).toBe(true);
  });


  it('add file', async () => {
    const [err, result] = await to(sl.addFileFromPath('./src/storage/tests/data/image1.jpg'))
    console.log(result);
    expect(err).toBe(null);
  });

  it('add file error', async () => {
    const [err, result] = await to(sl.addFileFromPath('./src/storage/tests/data/non-existent.jpg'))
    expect(err).toBeDefined();
    expect(result).toBe(undefined);
  });

  it('add file with new name and dir', async () => {
    const [err, result] = await to(sl.addFileFromPath('./src/storage/tests/data/image1.jpg', {
      dir: 'subdir',
      name: 'renamed.jpg',
    }))
    console.log(result);
    expect(err).toBe(null);
    expect(result.name).toBe('renamed.jpg');
    expect(result.path).toBe('subdir/renamed.jpg');
  });

  it('remove file', async () => {
    const [err, result] = await to(sl.removeFile('subdir/renamed.jpg'))
    console.log(err);
    expect(err).toBe(null);
    expect(result).toBe(true);
  })
});



/*
const listFiles = async () => {
  try {
    const r = await sl.listFiles()
    return r;
  } catch (e) {
    return e.message
  }
}

describe('testing local storage', () => {
  it('list files', async () => {
    const r = await listFiles()
    console.log('list files', r)
    expect(r instanceof Array).toBe(true);
  });
});


/*




const addFileFromPath = async (file: string, newFilePath?: string) => {
  const [err, result] = await to(sl.addFileFromPath(file, newFilePath))
  if (err) {
    console.error(err.message);
  } else {
    console.log(result);
  }
}
// addFileFromPath('/home/abudaan/Downloads/SH-3-44.mid');
// addFileFromPath('/home/abudaan/Downloads/surfaces-smooth.jpg');
// addFileFromPath('/home/abudaan/Pictures/sun-blanket.jpg', 'test/aapenbeer.jpg')


const getFileAsReadable = (fileName: string) => {
  sl.getFileAsReadable(fileName)
    .then(readStream => {
      const filePath = path.join('/home/abudaan/Downloads/tmp/', fileName);
      const writeStream = fs.createWriteStream(filePath);
      readStream.pipe(writeStream);
      writeStream.on('error', (e: Error) => {
        console.log(e.message);
      })
      writeStream.on('finish', () => {
        console.log('FINISHED');
      })
    })
    .catch(e => { console.log(e) })
}
getFileAsReadable('generate_error/SH-3-44.mid');
// getFileAsReadable('IMG_9643.jpg');

*/

