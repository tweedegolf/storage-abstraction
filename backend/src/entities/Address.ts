import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Property } from '@tsed/common';

@Entity()
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Property()
  public timesRequested: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @Property()
  public street!: string;

  @Column({ type: 'varchar', length: 6, nullable: false })
  @Property()
  public postalCode!: string;

  @Column({ type: 'int', nullable: false })
  @Property()
  public houseNumber!: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @Property()
  public houseNumberAddition: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  @Property()
  public city!: string;

  @Column()
  @Property()
  public area!: number;

  @Column()
  @Property()
  public year!: number;
}
