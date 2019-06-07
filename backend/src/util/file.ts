import fs from "fs";
import path from "path";
import util from 'util';

export const mkdir = util.promisify(fs.mkdir);

export const fileExists = async (filePath: string) =>
  new Promise(resolve => {
    fs.access(filePath, fs.constants.F_OK, err => {
      resolve(!err);
    })
  });

export const writeFile = util.promisify(fs.writeFile);
export const readFile = util.promisify(fs.readFile);
export const readDir = util.promisify(fs.readdir);
export const stat = util.promisify(fs.stat);

export const isSubfolder = async (parent: string, folder: string) =>
  !path.relative(parent, folder).startsWith('..');

export const unlink = util.promisify(fs.unlink);
