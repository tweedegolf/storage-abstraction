import { Format, Property } from '@tsed/common';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Label {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  @Property()
  public timesRequested: number;

  @Column({ type: 'varchar', length: 6, nullable: false })
  @Property()
  public postalCode!: string;

  @Column({ type: 'int', nullable: false })
  @Property()
  public houseNumber!: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @Property()
  public houseNumberAddition: string;

  @Column()
  @Property()
  public grade!: string;

  @Column({ type: 'float', nullable: true })
  @Property()
  public index: number;

  @Column()
  @Property()
  public provisional!: boolean;

  @Column({ nullable: true })
  @Property()
  @Format('date-time')
  public validThru: Date;
}
