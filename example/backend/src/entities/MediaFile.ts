import { Property, Required } from '@tsed/common';
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { BaseMediaFile } from '../types';
import { When } from './When';

@Entity()
export class MediaFile implements BaseMediaFile {

  constructor(when?: When) {
    this.when = when ? when : new When();
  }

  @PrimaryGeneratedColumn()
  @Property()
  public id!: number;

  @Column(type => When)
  @Property()
  public when!: When;

  @Column()
  @Index()
  @Required()
  public path!: string;

  @Column()
  @Required()
  public size!: number;

  @Column()
  @Required()
  public name!: string;
}
