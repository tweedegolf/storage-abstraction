import { Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Format, Property } from '@tsed/common';
import { Description } from '@tsed/swagger';

@Description('Timestamp for item creation and modification')
export class When {
  @Column()
  @Property()
  @Format('date-time')
  public created!: Date;

  @Column()
  @Property()
  @Format('date-time')
  public updated!: Date;

  public constructor() {
    this.updateCreated();
  }

  @BeforeInsert()
  public updateCreated() {
    this.created = new Date();
    this.updated = new Date();
  }

  @BeforeUpdate()
  public updateUpdated() {
    this.updated = new Date();
  }
}
