import fs from 'fs';
import path from 'path';

export const fileExists = async (filePath: string) =>
  new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });

export const isSubfolder = async (parent: string, folder: string) =>
  !path.relative(parent, folder).startsWith('..');
