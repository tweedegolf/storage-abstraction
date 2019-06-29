import { Service, AfterRoutesInit } from '@tsed/common';
import { TypeORMService } from '@tsed/typeorm';
import { Repository } from 'typeorm';
import { MediaFile } from '../../entities/MediaFile';

@Service()
export class MediaFileRepository implements AfterRoutesInit {
  private repository: Repository<MediaFile>;

  public constructor(private typeORMService: TypeORMService) {
  }

  public $afterRoutesInit() {
    this.repository = this.typeORMService.get('tg').getRepository(MediaFile);
  }

  public async create(args: { name: string, path: string, size: number }): Promise<MediaFile> {
    const file = new MediaFile();
    Object.assign(file, args);
    await this.repository.save(file);
    return file;
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

  public async findOne(id: number): Promise<MediaFile | undefined> {
    return this.repository.findOne(id);
  }
}
