import fs from 'fs';
import dotenv from 'dotenv';
import to from 'await-to-js';
dotenv.config();

const img = '/home/abudaan/Downloads/tmp/IMG_9643.jpg';

// Option 1: API method propagates reject

// API method
const readImage1 = async (filePath: string): Promise<Buffer> => {
  return fs.promises.readFile(filePath)
    .then(buffer => buffer)
    .catch(e => Promise.reject(e));
};

// call API method
const test1 = (path: string) => {
  readImage1(path)
    .then(buffer => { console.log('1', buffer.length); })
    .catch(e => { console.log('1', e.message); });
};

test1(img);
test1('non/existent');

// call API method async
const test1a = async (path: string) => {
  try {
    const buffer = await readImage1(path);
    console.log('1a', buffer.length);
  } catch (e) {
    console.log('1a', e.message);
  }
};

test1a(img);
test1a('non/existent');

// call API method async using 'await-to-js' (see https://blog.grossman.io/how-to-write-async-await-without-try-catch-blocks-in-javascript/)
const test1b = async (path: string) => {
  const [error, buffer] = await to(readImage1(path));
  if (typeof buffer !== 'undefined') {
    console.log('1b', buffer.length);
  } else {
    console.log('1b', error.message);
  }
};

test1b(img);
test1b('non/existent');

// Option 2: API method catches reject and resolves

// API method
const readImage2 = async (filePath: string): Promise<Buffer | null> => {
  return fs.promises.readFile(filePath)
    .then(buffer => buffer)
    .catch(e => {
      console.log('2', e.message);
      return null;
    });
};

// call API method
const test2 = async (path: string) => {
  const buffer = await readImage2(path);

  if (buffer !== null) {
    console.log('2', buffer.length);
  }
};

test2(img);
test2('non/existent');
