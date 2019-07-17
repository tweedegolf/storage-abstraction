import path from 'path';
import { Service, AfterRoutesInit, OnInit } from '@tsed/common';
import { TypeORMService } from '@tsed/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { MediaFile } from '../../entities/MediaFile';
import { MediaFileService } from '../MediaFileService';

@Service()
export class MediaFileRepository implements AfterRoutesInit, OnInit {
  private repository: Repository<MediaFile>;

  public constructor(
    private typeORMService: TypeORMService,
    private mediaFileService: MediaFileService,
  ) {
  }

  private getOriginalFileName(p: string): string {
    const name = path.basename(p);
    const underscore = name.lastIndexOf('_');
    if (underscore !== -1) {
      return name.substring(underscore + 1);
    }
    return name;
  }

  public $onInit() {
  }

  public async $afterRoutesInit(): Promise<void> {
    return this.synchronize();
  }

  public async synchronize(): Promise<void> {
    this.repository = this.typeORMService.get('tg').getRepository(MediaFile);
    // synchronize storage with database
    const storageFiles = await this.mediaFileService.getStoredFiles();
    const repositoryFiles = await this.repository.find();
    const notInRepository = [];
    storageFiles.forEach(([path, size]) => {
      if (repositoryFiles.findIndex((f: MediaFile) => f.path === path) === -1) {
        const mf = new MediaFile();
        mf.path = path;
        mf.size = size;
        mf.name = this.getOriginalFileName(path);
        notInRepository.push(mf);
      }
    });
    // console.log('NOT IN REPOSITORY', notInRepository);
    await this.repository.save(notInRepository);

    // remove files from database that are not in storage
    const notInStorage = [];
    repositoryFiles.forEach((mf) => {
      if (storageFiles.findIndex((data: [string, number]) => data[0] === mf.path) === -1) {
        notInStorage.push(mf);
      }
    });
    // console.log('NOT IN STORAGE', notInStorage);
    await this.repository.remove(notInStorage);
  }

  public async create(args: { name: string, path: string, size: number }[]): Promise<MediaFile[]> {
    const files = [];
    for (let i = 0; i < args.length; i += 1) {
      const mf = new MediaFile();
      Object.assign(mf, args[i]);
      files.push(mf);
    }
    await this.repository.save(files);
    return files;
  }

  public async update(file: MediaFile): Promise<void> {
    await this.repository.update(file.id, file);
  }

  public async find(): Promise<MediaFile[]> {
    return this.repository.find();
  }

  public async findOneByPath(filePath: string): Promise<MediaFile> {
    return this.repository.findOne({ path: filePath });
  }

  public async remove(files: MediaFile[]): Promise<MediaFile[]> {
    return this.repository.remove(files);
  }

  public async deleteWhere(condition: {}): Promise<DeleteResult> {
    return this.repository.delete(condition);
  }

  public async findOne(id: number): Promise<MediaFile | undefined> {
    return this.repository.findOne(id);
  }
}
