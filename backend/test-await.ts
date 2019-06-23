import dotenv from 'dotenv'
import { readFile } from './utils';
dotenv.config();

const img = '/home/abudaan/Downloads/tmp/IMG_9643.jpg';


// OPTION 1

const getImageApi1 = async (filePath: string): Promise<Buffer> => {
  return readFile(filePath)
    .then(buffer => buffer)
    .catch(e => Promise.reject(e))
}

const test1 = (path: string) => {
  getImageApi1(path)
    .then(buffer => { console.log(1, buffer.length) })
    .catch(e => { console.log(1, e.message) })
}

test1(img)
test1('non/existent')


// OPTION 2

const getImageApi2 = async (filePath: string): Promise<Buffer | null> => {
  return readFile(filePath)
    .then(buffer => buffer)
    .catch(e => {
      console.log(2, e.message)
      return null;
    })
}

const test2 = async (path: string) => {
  const buffer = await getImageApi2(path);

  if (buffer !== null) {
    console.log(2, buffer.length);
  }
}

test2(img)
test2('non/existent')

